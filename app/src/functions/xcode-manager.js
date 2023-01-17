const { ChildProcess } = require('./child_process');
const { globalFunctions } = require('./global-shared');

class XcodeManager {
    childManager = new ChildProcess();
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {
    }

    async getXcodeVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking git version!', this.consoleType.info);
            const xcodeVersion = await this.childManager.executeCommand(
                mainWindow,
                '/usr/bin/xcodebuild -version',
                null,
                'You do not have a xcode version installed on your computer.'
            );
            if (!xcodeVersion.error) {
                xcodeVersion.data = new RegExp(/(\/*Xcode \S+\/*)/).exec(xcodeVersion.data.trim())[0].split(' ')[1].trim();
            }
            return resolve(xcodeVersion);
        });
    }

    async installXcode(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying to install Xcode!', this.consoleType.info);
            const installXcode = await this.childManager.executeCommand(
                mainWindow,
                'xcode-select --install',
                null,
                'When try to install xcode. Something get wrong!'
            );
            if (installXcode.error) {
                return resolve(installXcode);
            }
            const xcodeVersion = await this.getXcodeVersion(mainWindow);
            return resolve(xcodeVersion);
        });
    }

    async getIosAvailableEmulatorList(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking ios available emulator list!', this.consoleType.info);
            const iosAvailableEmulatorList = await this.childManager.executeCommand(
                mainWindow,
                'xcrun simctl list --json',
                null,
                'When try to get available emulator list. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: false,
                    endError: true,
                    info: true
                }
            );
            if (iosAvailableEmulatorList.error) {
                return resolve(iosAvailableEmulatorList);
            }
            const deviceCodes = [];
            const data = JSON.parse(iosAvailableEmulatorList.data);
            const runtime = data.runtimes.length > 0 ? data.runtimes[data.runtimes.length - 1] : {};
            const identifier = runtime.identifier;
            const devices = data.devices[identifier];
            runtime && runtime.supportedDeviceTypes.map(async (r, index, array) => {
                const findIndex = devices.findIndex(o => o.deviceTypeIdentifier === r.identifier);
                const udid = findIndex !== -1 ? devices[findIndex].udid : null;
                /*   if (r.identifier === 'com.apple.CoreSimulator.SimDeviceType.iPhone-11-Pro') {
                       this.createIosEmulator(mainWindow, {
                           name: r.name,
                           runtime_identifier: identifier,
                           identifier: r.identifier,
                           udid: udid
                       });
                   }*/
                deviceCodes.push({
                    name: r.name,
                    runtime_identifier: identifier,
                    identifier: r.identifier,
                    udid: udid
                });
            });

            return resolve({ error: false, data: deviceCodes });
        });
    }


    async getIosAvailableEmulatorIdentifier(mainWindow, identifier) {
        return new Promise(async (resolve) => {
            const iosAvailableEmulatorList = await this.getIosAvailableEmulatorList(mainWindow);
            const find = iosAvailableEmulatorList.data.find(o => o.identifier === identifier);
            return resolve({
                error: false, data: find
            });
        });
    }

    async startIosDevice(mainWindow, value = {
        device: null,
        uninstall: null,
        live_reload: null,
        server: null
    }) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Starting Ios Device!', this.consoleType.info);
            await this.setConfigXMLContent(mainWindow, value.live_reload);
            await this.killPorts(mainWindow);
            const device = await this.getIosAvailableEmulatorIdentifier(mainWindow, value.device);
            if (!device.data.udid) {
                const createEmulator = await this.createEmulator(mainWindow, device.data.name, device.data.identifier, device.data.runtime_identifier);
                if (!createEmulator.error) {
                    device.data = createEmulator.data;
                }
            }
            await this.bootOnEmulator(mainWindow, device.data.udid);
            setTimeout(async () => {
                if (value.uninstall) {
                    await this.uninstallOnEmulator(mainWindow, device.data.udid);
                }
            }, 20000);
            const startBuildApp = await this.startBuildApp(mainWindow, device.data.udid, device.data.identifier, value.server, value.live_reload);
            return resolve({ error: false, data: startBuildApp });
        });
    };

    async killPorts(mainWindow, port = '8100', data = {
        device: null,
        shutdown: true
    }) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking port is running?!', this.consoleType.info);
            if (data.device && data.shutdown) {
                await this.sendListen(mainWindow, 'Trying to shutdown?!', this.consoleType.info);
                const device = await this.getIosAvailableEmulatorIdentifier(mainWindow, data.device);
                const shutdown = await this.childManager.executeCommand(
                    mainWindow,
                    this.getShutDownCommand(device.data.udid),
                    null,
                    'When try to shutdown. Something get wrong!', () => {
                    }
                );
            }
            const checkPortExist = await this.childManager.executeCommand(
                mainWindow,
                'lsof -i tcp:' + port,
                null,
                'When try to checking running port. Something get wrong!', () => {
                }
            );
            const pids = [];
            const promises = [];
            if (!checkPortExist.error) {
                let split = checkPortExist.data.split('\n');
                split.splice(0, 1);
                split.forEach((match, groupIndex) => {
                    if (match) {
                        const s = +match.split(' ').filter(o => !!o)[1].trim();
                        if (s) {
                            pids.push(s);
                            promises.push(new Promise(function (r) {
                                r(new ChildProcess().executeCommand(
                                    mainWindow,
                                    'kill -9 ' + s,
                                    null,
                                    'When try to killing port. Something get wrong!', () => {
                                    }
                                ));
                            }));
                        }
                    }
                });
                //Then this returns a promise that will resolve when ALL are so.
                await Promise.all(promises);
            }
            return resolve({ error: false, data: pids });
        });
    }

    async startBuildApp(mainWindow, udid, identifier, server, live_reload) {
        return new Promise(async (resolve) => {
            const cmd_node = 'export NODE_ENV=' + (!server ? 'dev' : server) + '&&' + this.getBuildAppCommand(udid, identifier, live_reload);
            const buildApp = await new ChildProcess().executeCommand(
                mainWindow,
                cmd_node,
                null,
                'When try to build app. Something get wrong!', async (ev) => {
                    if (!live_reload) {
                        if (ev.data.includes('BUILD SUCCEEDED')) {
                            return resolve({ error: false, data: null });
                        }
                    } else {
                        if (ev.data.includes('lint&nbsp;finished&nbsp;in')) {
                            return resolve({ error: false, data: null });
                        }
                    }

                }, {
                    command: true,
                    liveOutput: true,
                    endOutput: false,
                    endError: true,
                    info: true
                }
            );
            if (buildApp.error) {
                return resolve(buildApp);
            }
        });
    }

    async createEmulator(mainWindow, name, identifier, runtime_identifier) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying creating Emulator!', this.consoleType.info);
            const createCommand = this.getCreateCommand(name, identifier, runtime_identifier);
            const createEmulator = await this.childManager.executeCommand(
                mainWindow,
                createCommand,
                null,
                'When try to creating Emulator. Something get wrong!', () => {
                }
            );
            if (!createEmulator.error) {
                const device = await this.getIosAvailableEmulatorIdentifier(mainWindow, identifier);
                resolve({
                    error: false, data: {
                        name: device.data.name,
                        identifier: device.data.identifier,
                        runtime_identifier: device.data.target,
                        udid: device.data.udid
                    }
                });
            } else {
                resolve(createEmulator);
            }
        });
    }

    async bootOnEmulator(mainWindow, udid) {
        await this.sendListen(mainWindow, 'Trying to boot Emulator!', this.consoleType.info);
        return await this.childManager.executeCommand(
            mainWindow,
            this.getBootCommand(udid),
            null,
            'When try to boot Emulator. Something get wrong!', () => {
            }
        );
    }

    async openOnEmulator(mainWindow, udid) {
        await this.sendListen(mainWindow, 'Trying to open Emulator!', this.consoleType.info);
        return await this.childManager.executeCommand(
            mainWindow,
            this.getOpenCommand(udid),
            null,
            'When try to open emulator. Something get wrong!', () => {
            }
        );
    }

    async installOnEmulator(mainWindow, udid) {
        await this.sendListen(mainWindow, 'Trying to install app on Emulator!', this.consoleType.info);
        const project_path = await globalFunctions.getProjectPath;
        return await this.childManager.executeCommand(
            mainWindow,
            this.getInstallCommand(udid, project_path),
            null,
            'When try to install app on Emulator. Something get wrong!', () => {
            }
        );
    }

    async uninstallOnEmulator(mainWindow, udid) {
        await this.sendListen(mainWindow, 'Trying to uninstall app on Emulator!', this.consoleType.info);
        const ios_package_name = await globalFunctions.getIosPackageName;
        return await this.childManager.executeCommand(
            mainWindow,
            this.getUninstallCommand(udid, ios_package_name),
            null,
            'When try to uninstall app on Emulator. Something get wrong!', () => {
            }
        );
    }

    async launchOnEmulator(mainWindow, udid) {
        await this.sendListen(mainWindow, 'Trying to launch App!', this.consoleType.info);
        const ios_package_name = await globalFunctions.getIosPackageName;
        return await this.childManager.executeCommand(
            mainWindow,
            this.getLaunchCommand(udid, ios_package_name),
            null,
            'When try to launch App. Something get wrong!', () => {
            }
        );
    }

    async setConfigXMLContent(mainWindow, liveReload = true) {
        return new Promise(async (resolve) => {
            const global_ip = await globalFunctions.getIpAddress;
            const content = await globalFunctions.getContent;
            const ip_address = 'http://' + global_ip + ':8100';
            if (liveReload) {
                content[0].$.src = ip_address;
                content[0].$['original-src'] = 'index.html';
            } else {
                content[0].$.src = 'index.html';
                delete content[0].$['original-src'];
            }
            await this.sendListen(mainWindow, 'Config Content Is Set: ' + content[0].$.src, this.consoleType.info);
            globalFunctions.setContent = content;
            const navigations = await globalFunctions.getNavigations;
            const findIndex = navigations.findIndex((n) => n.$.href === ip_address);
            if (liveReload) {
                findIndex === -1 && navigations.push({ '$': { href: content[0].$.src } });
            } else {
                findIndex !== -1 && navigations.splice(findIndex, 1);
            }
            globalFunctions.setNavigations = navigations;
            resolve(null);
        });
    }

    getBuildAppCommand(udid, identifier, liveReload) {
        if (!liveReload) {
            return 'ionic cordova run ios --emulator --consolelogs --aot --nobrowser --iscordovaserve --target ' + udid + ' -- --target ' + identifier.replace('com.apple.CoreSimulator.SimDeviceType.', '') + ' --consolelogs --aot';
        }
        return 'ionic cordova run ios --emulator -l --consolelogs --aot --nobrowser --iscordovaserve --target ' + udid + ' --host 0.0.0.0 --port 8100 --livereload-port 35729 --dev-logger-port 53703 -- --target ' + identifier.replace('com.apple.CoreSimulator.SimDeviceType.', '') + ' --consolelogs --aot -l';
    }

    getShutDownCommand(udid) {
        return 'xcrun simctl shutdown ' + udid;
    }

    getBootCommand(udid) {
        return 'xcrun simctl boot ' + udid;
    }

    getCreateCommand(name, device_identifier, runtime_identifier) {
        return 'xcrun simctl create "' + name + '" "' + device_identifier + '" "' + runtime_identifier + '"';
    }

    getUninstallCommand(udid, ios_package_name) {
        return 'xcrun simctl uninstall \'' + udid + '\' ' + ios_package_name;
    }

    getLaunchCommand(udid, ios_package_name) {
        return 'xcrun simctl launch \'' + udid + '\' ' + ios_package_name;
    }

    getInstallCommand(udid, project_path) {
        return 'xcrun simctl install  \'' + udid + '\' ' + project_path + '/platforms/ios/build/emulator/SkillCat.app  --forward 8100:8100 --forward 35729:35729 --forward 53703:53703';
    }

    getOpenCommand(udid) {
        return 'open -a \'Simulator\' --args -CurrentDeviceUDID ' + udid;
    }

    async sendListen(mainWindow, text, type = null, error = false) {
        return new Promise(async (resolve) => {
            mainWindow.webContents.send('command:listen', {
                data: text,
                type: type,
                error: error
            });
            resolve(true);
        });
    }
}


module.exports = { XcodeManager };
