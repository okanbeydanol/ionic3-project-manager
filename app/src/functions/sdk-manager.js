const { ChildProcess } = require('./child_process');
const { app } = require('electron');
const { ZshrcManager } = require('./zshrc-manager');
const { FsManager } = require('./fs-manager');
const { globalFunctions } = require('./global-shared');
const path = require('path');
const config_path = path.join(__dirname, '../config');

class SdkManager {
    childManager = new ChildProcess();
    zshrcManager = new ZshrcManager();
    fsManager = new FsManager();
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {
    }

    async getAndroidAvailableAvdManagerList(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking android available avd manager list!', this.consoleType.info);
            const androidAvailableVirtualList = await this.childManager.executeCommand(
                mainWindow,
                'avdmanager list  | awk \'/Available Android Virtual Devices:/{flag=1; next} /Available devices definitions:/{flag=0} flag\'',
                null,
                'When try to get available avd manager list. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: false,
                    endError: true,
                    info: true
                }
            );
            if (androidAvailableVirtualList.error) {
                return resolve(androidAvailableVirtualList);
            }
            const regexVirtual = /Name: ([\S|\ |\d]+)\n +Device: (\S+)/g;
            regexVirtual.lastIndex = 0;
            let m;
            let data = null;
            const lists = [];
            while ((m = regexVirtual.exec(androidAvailableVirtualList.data)) !== null) {
                if (m.index === regexVirtual.lastIndex) {
                    regexVirtual.lastIndex++;
                }
                data = { id: null, device: null };
                m.forEach((match, groupIndex) => {
                    if (match && groupIndex === 0) {
                    } else if (match && groupIndex === 1) {
                        data.id = match;
                    } else if (match && groupIndex === 2) {
                        data.device = match;
                        lists.push({ id: data.id, device: data.device });
                    }
                });
            }


            const androidAvailableDeviceDefinitions = await this.childManager.executeCommand(
                mainWindow,
                'avdmanager list  | awk \'/Available devices definitions:/{flag=1; next} /Available Android targets:/{flag=0} flag\'',
                null,
                'When try to get available avd manager list. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: false,
                    endError: true,
                    info: true
                }
            );
            if (androidAvailableDeviceDefinitions.error) {
                return resolve(androidAvailableDeviceDefinitions);
            }

            const regexDefinition = /id: \d+ or "([\S|\ |\d]+)"\n +Name: ([\S|\ |\d]+)\n/g;
            regexDefinition.lastIndex = 0;
            while ((m = regexDefinition.exec(androidAvailableDeviceDefinitions.data)) !== null) {
                if (m.index === regexDefinition.lastIndex) {
                    regexDefinition.lastIndex++;
                }
                data = { id: null, name: null };
                m.forEach((match, groupIndex) => {
                    if (match && groupIndex === 0) {
                    } else if (match && groupIndex === 1) {
                        data.id = match;
                    } else if (match && groupIndex === 2) {
                        data.name = match;
                        lists.push({ id: data.id, name: data.name });
                    }
                });
            }


            return resolve({ error: false, data: lists });
        });
    }

    async getAndroidAvailableEmulatorList(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking android available emulator list!', this.consoleType.info);
            const androidAvailableEmulatorList = await this.childManager.executeCommand(
                mainWindow,
                'emulator -list-avds',
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
            if (androidAvailableEmulatorList.error) {
                return resolve(androidAvailableEmulatorList);
            }
            const split = androidAvailableEmulatorList.data.split('\n');
            return resolve({ error: false, data: split.length > 0 ? split : [] });
        });
    }

    async startBuildApp(mainWindow, device, server, live_reload) {
        return new Promise(async (resolve) => {
            const cmd_node = 'export NODE_ENV=' + (!server ? 'dev' : server) + '&&' + this.getBuildAppCommand(device, live_reload);
            let ran = false;
            let lint = false;
            const buildApp = await new ChildProcess().executeCommand(
                mainWindow,
                cmd_node,
                null,
                'When try to build app. Something get wrong!', async (ev) => {
                    console.log('%c ev', 'background: #222; color: #bada55', ev);
                    if (!ev.error) {
                        if (ev.data.includes('lint&nbsp;finished&nbsp;in')) {
                            ran = true;
                        }
                        if (ev.data.includes('Run&nbsp;Successful')) {
                            lint = true;
                        }
                        if (ran && lint) {
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

    async startAndroidDevice(mainWindow, value = {
        device: null,//Android ID
        uninstall: null,
        live_reload: null,
        server: null,
        avdName: null,//ANDROID DISPLAY NAME
        createAvd: null
    }) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Starting Android Device!', this.consoleType.info);
            await this.setConfigXMLContent(mainWindow, value.live_reload);
            await this.killPorts(mainWindow);
            if (value.live_reload) {
                const currentPath = await globalFunctions.getCurrentPath;
                const manifestXml = await this.fsManager.readFile(currentPath + '/platforms/android/app/src/main/AndroidManifest.xml', {
                    encoding: 'utf8',
                    flag: 'r',
                    signal: null
                });
                console.log('%c manifestXml', 'background: #222; color: #bada55', manifestXml);
                const findLiveReLoadConfigExistRegex = /(\/*android:networkSecurityConfig="@xml\/network_security_config"\/*)/;
                console.log('%c findLiveReLoadConfigExistRegex', 'background: #222; color: #bada55', findLiveReLoadConfigExistRegex);
                const match = manifestXml.data.match(findLiveReLoadConfigExistRegex);
                if (!match) {
                    await this.editFiles(mainWindow);
                }
            }
            //avdmanager -s create avd -k "system-images;android-31;google_apis;arm64-v8a" -n "Pixel_2" -d "pixel_2" -f
            //emulator -avd Pixel_2 -no-snapshot-save -no-snapshot-load -no-boot-anim -netdelay none -no-snapshot -wipe-data
            //emulator -list-avds
            //adb -s emulator-5554 emu kill
            //adb devices
            if (value.createAvd) {
                //Find available system images
                const systemImage = 'system-images;android-31;google_apis_playstore;arm64-v8a';
                await this.createAvd(mainWindow, systemImage, value.avdName, value.device);
            }

            await this.bootOnEmulator(mainWindow, value.createAvd ? value.avdName : value.device);
            if (value.uninstall) {
                setTimeout(async () => {
                    const packageName = await globalFunctions.getAndroidPackageName;
                    await this.uninstallOnEmulator(mainWindow, packageName);
                }, 20000);

            }

            const startBuildApp = await this.startBuildApp(mainWindow, value.createAvd ? value.avdName : value.device, value.server, value.live_reload);
            return resolve(startBuildApp);
        });
    }

    async uninstallOnEmulator(mainWindow, packageName) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Booting avd manager!', this.consoleType.info);
            const uninstall = 'adb shell pm uninstall --user 0 ' + packageName;
            const createAvd = await new ChildProcess().executeCommand(
                mainWindow,
                uninstall,
                null,
                'Application is not installed!.'
            );

            return resolve(createAvd);
        });
    }

    async bootOnEmulator(mainWindow, device) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Booting avd manager!', this.consoleType.info);
            const boot = 'emulator -avd ' + device + ' -no-snapshot-save -no-snapshot-load -no-boot-anim -netdelay none -no-snapshot'; // -wipe-data
            const createAvd = await new ChildProcess().executeCommand(
                mainWindow,
                boot,
                null,
                'When try to boot avd manager. Something went go wrong!.',
                (ev) => {
                    console.log('%c ev', 'background: #222; color: #bada55', ev);
                    if (ev.data.includes('boot&nbsp;completed')) {
                        return resolve({ error: false, data: null });
                    }
                }
            );

            return resolve(createAvd);
        });
    }


    async createAvd(mainWindow, systemImage, avdName, device) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Creating avd manager!', this.consoleType.info);
            const run = 'avdmanager -s create avd -k "' + systemImage + '" -n "' + avdName + '" -d "' + device + '" -f';
            const createAvd = await this.childManager.executeCommand(
                mainWindow,
                run,
                null,
                'When try to create avd manager. Something went go wrong!.'
            );

            return resolve(createAvd);
        });
    }

    getBuildAppCommand(name, liveReload) {
        if (!liveReload) {
            return 'ionic cordova run android --emulator --consolelogs --aot --nobrowser --iscordovaserve --target ' + name + '  -- --target ' + name + '  --consolelogs --aot';
        }
        return 'ionic cordova run android --emulator -l --consolelogs --aot --nobrowser --iscordovaserve --target ' + name + ' --host 0.0.0.0 --port 8100 --livereload-port 35729 --dev-logger-port 53703 -- --target ' + name + ' --consolelogs --aot -l';
    }

    async editFiles(mainWindow) {
        return new Promise(async (resolve) => {
            let d = [];
            let json = await new FsManager().readFile(config_path + '/android_live_fixes.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            });
            d = JSON.parse(json.data);
            const currentPath = await globalFunctions.getCurrentPath;
            await d.reduce((lastPromise, file_info) => {
                return lastPromise.then(async () => {
                    if (file_info.type === 'create') {
                        await new FsManager().writeFile(currentPath + '/' + file_info.folder + file_info.path, '#', {
                            encoding: 'utf8',
                            flag: 'w',
                            mode: 0o666,
                            signal: null
                        }, true);
                    }
                    const pathExist = await new FsManager().pathExist(currentPath + '/' + file_info.folder + file_info.path);
                    if (!pathExist.error && pathExist.data) {
                        const fileContent = await new FsManager().readFile(currentPath + '/' + file_info.folder + file_info.path, {
                            encoding: 'utf8',
                            flag: 'r',
                            signal: null
                        });
                        if (!fileContent.error) {
                            let newFileContent = fileContent.data;
                            for (let i = 0; i < file_info.data.length; i++) {
                                const data = file_info.data[i];
                                const match = new RegExp(data.regex, '').exec(newFileContent);
                                if (match) {
                                    await this.sendListen(mainWindow, '-------- EDITING ' + file_info.path + ' ----------', this.consoleType.info);
                                    console.log('%c MATCH:', 'background: #222; color: #bada55', file_info.path);
                                    newFileContent = newFileContent.replace(new RegExp(data.regex, ''), file_info.type === 'remove' ? '' : file_info.type === 'add' ? '' : file_info.type === 'replace' ? data.text : file_info.type === 'create' ? data.text : '');
                                    await new FsManager().writeFile(currentPath + '/' + file_info.folder + file_info.path, newFileContent);
                                } else {
                                    console.log('%c NOT MATCH:', 'background: #222; color: #bada55', file_info.path);
                                }
                            }
                        }
                    }
                });
            }, Promise.resolve());
            return resolve(true);
        });
    }


    async killPorts(mainWindow, port = '8100', data = {
        device: null,
        shutdown: true
    }) {
        return new Promise(async (resolve) => {

            const checkPortExist = await new ChildProcess().executeCommand(
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
                if (data.device && data.shutdown) {
                    await this.sendListen(mainWindow, 'Checking adb devices!', this.consoleType.info);
                    const openDevices = await new ChildProcess().executeCommand(
                        mainWindow,
                        'adb devices  | awk \'/List of devices attached/{flag=1; next} /next/{flag=0} flag\'',
                        null,
                        'When try to get adb devices. Something get wrong!', () => {
                        }
                    );
                    if (!openDevices.error && !!openDevices.data.trim()) {
                        openDevices.data.split('\n').reduce((promise, data, index, array) => {
                            promise.then(async () => {
                                const emulatorID = data.split('device')[0].trim();
                                await this.sendListen(mainWindow, 'Killing adb device: ' + emulatorID, this.consoleType.info);
                                const killDevices = await new ChildProcess().executeCommand(
                                    mainWindow,
                                    'adb -s ' + emulatorID + ' emu kill',
                                    null,
                                    'When try to kill adb devices. Something get wrong!', () => {
                                    }
                                );
                            });
                        }, Promise.resolve());
                    }
                }
            }
            return resolve({ error: false, data: pids });
        });
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

    async getAndroidSdkVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Sdk Manager version!', this.consoleType.info);
            const javaVersion = await this.childManager.executeCommand(
                mainWindow,
                'sdkmanager --version',
                null,
                'You do not have a sdkmanager version installed on your computer.'
            );

            return resolve(javaVersion);
        });
    }

    async installBuildTools(mainWindow, buildToolsVersionText) {
        return new Promise(async (resolve) => {
            let androidSdkManagerVersion = await this.getAndroidSdkVersion(mainWindow);
            if (androidSdkManagerVersion.error) {
                await this.sendListen(mainWindow, 'Trying install Android-Sdk with brew!', this.consoleType.info);
                const brewInstallAndroidSdk = await this.brewInstallAndroidSdk(mainWindow);
                if (brewInstallAndroidSdk.error) {
                    return resolve(brewInstallAndroidSdk);
                }
                const brewExceptLicensesAndroidSdk = await this.brewExceptLicensesAndroidSdk(mainWindow);
                if (brewExceptLicensesAndroidSdk.error) {
                    return resolve(brewExceptLicensesAndroidSdk);
                }
                const checkExportedAndroidHomeOrAndroidRootAndRemove = await this.checkExportedAndroidHomeOrAndroidRootAndRemove(mainWindow);
                if (checkExportedAndroidHomeOrAndroidRootAndRemove.error) {
                    return resolve(checkExportedAndroidHomeOrAndroidRootAndRemove);
                }
                const exportAndroidSdkRoot = await this.exportAndroidSdkRoot(mainWindow);
                if (exportAndroidSdkRoot.error) {
                    return resolve(exportAndroidSdkRoot);
                }
            }
            await this.sendListen(mainWindow, 'Checking android available build tools versions!', this.consoleType.info);
            const availableToolsVersion = await this.childManager.executeCommand(
                mainWindow,
                'sdkmanager  --list | awk \'/Available Packages:/{flag=1; next} /Installed/{flag=0} flag\'',
                null,
                'When try to get available build tools versions. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: false,
                    endError: true,
                    info: true
                }
            );
            if (availableToolsVersion.error) {
                return resolve(availableToolsVersion);
            }

            const splitVersions = buildToolsVersionText.split(',');
            let installText = '';
            const buildToolsVersions = [];
            splitVersions.map((currentValue) => {
                if (availableToolsVersion.data.includes('build-tools;' + currentValue)) {
                    if (installText === '') {
                        installText = `echo yes | sdkmanager "build-tools;${ currentValue }" \\
                    `;
                    } else {
                        installText = installText + `"build-tools;${ currentValue }" \\
                    `;
                    }
                    buildToolsVersions.push(currentValue);
                }
            });
            if (installText === '') {
                return resolve({ error: true, data: false, message: 'Could not find available build tools!' });
            }

            await this.sendListen(mainWindow, 'Trying install build-tools!', this.consoleType.info);
            const installBuildTools = await this.childManager.executeCommand(
                mainWindow,
                installText,
                null,
                'When try to install build-tools. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: true,
                    endError: true,
                    info: true
                }
            );
            const checkExportedBuildToolsVersionAndRemove = await this.checkExportedBuildToolsVersionAndRemove(mainWindow);
            if (checkExportedBuildToolsVersionAndRemove.error) {
                return resolve(checkExportedBuildToolsVersionAndRemove);
            }

            const exportAndroidBuildTools = await this.exportAndroidBuildTools(mainWindow, buildToolsVersions);
            return resolve(exportAndroidBuildTools);
        });
    }

    async installPlatforms(mainWindow, platformsVersionText) {
        return new Promise(async (resolve) => {
            let androidSdkManagerVersion = await this.getAndroidSdkVersion(mainWindow);
            if (androidSdkManagerVersion.error) {
                await this.sendListen(mainWindow, 'Trying install Android-Sdk with brew!', this.consoleType.info);
                const brewInstallAndroidSdk = await this.brewInstallAndroidSdk(mainWindow);
                if (brewInstallAndroidSdk.error) {
                    return resolve(brewInstallAndroidSdk);
                }
                const brewExceptLicensesAndroidSdk = await this.brewExceptLicensesAndroidSdk(mainWindow);
                if (brewExceptLicensesAndroidSdk.error) {
                    return resolve(brewExceptLicensesAndroidSdk);
                }
                const checkExportedAndroidHomeOrAndroidRootAndRemove = await this.checkExportedAndroidHomeOrAndroidRootAndRemove(mainWindow);
                if (checkExportedAndroidHomeOrAndroidRootAndRemove.error) {
                    return resolve(checkExportedAndroidHomeOrAndroidRootAndRemove);
                }
                const exportAndroidSdkRoot = await this.exportAndroidSdkRoot(mainWindow);
                if (exportAndroidSdkRoot.error) {
                    return resolve(exportAndroidSdkRoot);
                }
            }
            await this.sendListen(mainWindow, 'Checking android available platforms versions!', this.consoleType.info);
            const availableToolsVersion = await this.childManager.executeCommand(
                mainWindow,
                'sdkmanager  --list | awk \'/Available Packages:/{flag=1; next} /Installed/{flag=0} flag\'',
                null,
                'When try to get available platforms versions. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: false,
                    endError: true,
                    info: true
                }
            );
            if (availableToolsVersion.error) {
                return resolve(availableToolsVersion);
            }

            const splitVersions = platformsVersionText.split(',');
            let installText = '';
            const platformsVersions = [];
            splitVersions.map((currentValue) => {
                if (availableToolsVersion.data.includes('platforms;' + currentValue)) {
                    if (installText === '') {
                        installText = `echo yes | sdkmanager "platforms;${ currentValue }" \\
                    `;
                        installText = installText + `"sources;${ currentValue }" \\
                    `;
                    } else {
                        installText = installText + `"platforms;${ currentValue }" \\
                    `;
                        installText = installText + `"sources;${ currentValue }" \\
                    `;
                    }
                    platformsVersions.push(currentValue);
                }
            });
            if (installText === '') {
                return resolve({ error: true, data: false, message: 'Could not find available platforms tools!' });
            }

            await this.sendListen(mainWindow, 'Trying install platforms!', this.consoleType.info);
            const installPlatforms = await this.childManager.executeCommand(
                mainWindow,
                installText,
                null,
                'When try to install platforms. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: true,
                    endError: true,
                    info: true
                }
            );

            const checkExportedPlatformsVersionAndRemove = await this.checkExportedPlatformsVersionAndRemove(mainWindow);
            if (checkExportedPlatformsVersionAndRemove.error) {
                return resolve(checkExportedPlatformsVersionAndRemove);
            }

            const exportAndroidPlatforms = await this.exportAndroidPlatforms(mainWindow, platformsVersions);
            return resolve(exportAndroidPlatforms);
        });
    }

    async installPlatformTools(mainWindow) {
        return new Promise(async (resolve) => {
            let androidSdkManagerVersion = await this.getAndroidSdkVersion(mainWindow);
            if (androidSdkManagerVersion.error) {
                await this.sendListen(mainWindow, 'Trying install Android-Sdk with brew!', this.consoleType.info);
                const brewInstallAndroidSdk = await this.brewInstallAndroidSdk(mainWindow);
                if (brewInstallAndroidSdk.error) {
                    return resolve(brewInstallAndroidSdk);
                }
                const brewExceptLicensesAndroidSdk = await this.brewExceptLicensesAndroidSdk(mainWindow);
                if (brewExceptLicensesAndroidSdk.error) {
                    return resolve(brewExceptLicensesAndroidSdk);
                }
                const checkExportedAndroidHomeOrAndroidRootAndRemove = await this.checkExportedAndroidHomeOrAndroidRootAndRemove(mainWindow);
                if (checkExportedAndroidHomeOrAndroidRootAndRemove.error) {
                    return resolve(checkExportedAndroidHomeOrAndroidRootAndRemove);
                }
                const exportAndroidSdkRoot = await this.exportAndroidSdkRoot(mainWindow);
                if (exportAndroidSdkRoot.error) {
                    return resolve(exportAndroidSdkRoot);
                }
            }

            await this.sendListen(mainWindow, 'Trying install platforms!', this.consoleType.info);
            const installPlatforms = await this.childManager.executeCommand(
                mainWindow,
                'echo yes | sdkmanager "platform-tools"',
                null,
                'When try to install platforms. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: true,
                    endError: true,
                    info: true
                }
            );
            const checkExportedPlatformToolsVersionAndRemove = await this.checkExportedPlatformToolsVersionAndRemove(mainWindow);
            if (checkExportedPlatformToolsVersionAndRemove.error) {
                return resolve(checkExportedPlatformToolsVersionAndRemove);
            }

            const exportAndroidPlatformTools = await this.exportAndroidPlatformTools(mainWindow);
            return resolve(exportAndroidPlatformTools);
        });
    }

    async installSystemImages(mainWindow, systemImages) {
        return new Promise(async (resolve) => {
            let androidSdkManagerVersion = await this.getAndroidSdkVersion(mainWindow);
            if (androidSdkManagerVersion.error) {
                await this.sendListen(mainWindow, 'Trying install Android-Sdk with brew!', this.consoleType.info);
                const brewInstallAndroidSdk = await this.brewInstallAndroidSdk(mainWindow);
                if (brewInstallAndroidSdk.error) {
                    return resolve(brewInstallAndroidSdk);
                }
                const brewExceptLicensesAndroidSdk = await this.brewExceptLicensesAndroidSdk(mainWindow);
                if (brewExceptLicensesAndroidSdk.error) {
                    return resolve(brewExceptLicensesAndroidSdk);
                }
                const checkExportedAndroidHomeOrAndroidRootAndRemove = await this.checkExportedAndroidHomeOrAndroidRootAndRemove(mainWindow);
                if (checkExportedAndroidHomeOrAndroidRootAndRemove.error) {
                    return resolve(checkExportedAndroidHomeOrAndroidRootAndRemove);
                }
                const exportAndroidSdkRoot = await this.exportAndroidSdkRoot(mainWindow);
                if (exportAndroidSdkRoot.error) {
                    return resolve(exportAndroidSdkRoot);
                }
            }

            await this.sendListen(mainWindow, 'Trying install system Images!', this.consoleType.info);
            const installSystemImages = await this.childManager.executeCommand(
                mainWindow,
                `echo yes | sdkmanager "system-images;${ systemImages.android };${ systemImages.type };${ systemImages.core }"`,
                null,
                'When try to install system images. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: true,
                    endError: true,
                    info: true
                }
            );

            const checkExportedSystemImagesVersionAndRemove = await this.checkExportedSystemImagesVersionAndRemove(mainWindow);
            if (checkExportedSystemImagesVersionAndRemove.error) {
                return resolve(checkExportedSystemImagesVersionAndRemove);
            }

            const exportSystemImages = await this.exportSystemImages(mainWindow, systemImages);
            return resolve(exportSystemImages);
        });
    }

    async installEmulator(mainWindow) {
        return new Promise(async (resolve) => {
            let androidSdkManagerVersion = await this.getAndroidSdkVersion(mainWindow);
            if (androidSdkManagerVersion.error) {
                await this.sendListen(mainWindow, 'Trying install Android-Sdk with brew!', this.consoleType.info);
                const brewInstallAndroidSdk = await this.brewInstallAndroidSdk(mainWindow);
                if (brewInstallAndroidSdk.error) {
                    return resolve(brewInstallAndroidSdk);
                }
                const brewExceptLicensesAndroidSdk = await this.brewExceptLicensesAndroidSdk(mainWindow);
                if (brewExceptLicensesAndroidSdk.error) {
                    return resolve(brewExceptLicensesAndroidSdk);
                }
                const checkExportedAndroidHomeOrAndroidRootAndRemove = await this.checkExportedAndroidHomeOrAndroidRootAndRemove(mainWindow);
                if (checkExportedAndroidHomeOrAndroidRootAndRemove.error) {
                    return resolve(checkExportedAndroidHomeOrAndroidRootAndRemove);
                }
                const exportAndroidSdkRoot = await this.exportAndroidSdkRoot(mainWindow);
                if (exportAndroidSdkRoot.error) {
                    return resolve(exportAndroidSdkRoot);
                }
            }

            await this.sendListen(mainWindow, 'Trying install emulator!', this.consoleType.info);
            const installEmulator = await this.childManager.executeCommand(
                mainWindow,
                `echo yes | sdkmanager "emulator"`,
                null,
                'When try to install emulator. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: true,
                    endError: true,
                    info: true
                }
            );

            const checkExportedEmulatorVersionAndRemove = await this.checkExportedEmulatorVersionAndRemove(mainWindow);
            if (checkExportedEmulatorVersionAndRemove.error) {
                return resolve(checkExportedEmulatorVersionAndRemove);
            }

            const exportAndroidEmulator = await this.exportAndroidEmulator(mainWindow);
            return resolve(exportAndroidEmulator);
        });
    }

    async checkExportedAndroidHomeOrAndroidRootAndRemove(mainWindow) {
        return new Promise(async (resolve) => {
            const regexANDROID_SDK_ROOT = /(\/*export ANDROID_SDK_ROOT=\S+\n?\/*)/g;
            const regexANDROID_HOME = /(\/*export ANDROID_HOME=\S+\n?\/*)/g;
            await this.sendListen(mainWindow, 'Trying to check any exist $ANDROID_SDK_ROOT!', this.consoleType.info);
            let zshrcContent = await this.zshrcManager.getZshrcContent();
            if (zshrcContent.error) {
                return resolve(zshrcContent);
            }
            const matchANDROID_SDK_ROOT = regexANDROID_SDK_ROOT.exec(zshrcContent.data);
            const matchANDROID_HOME = regexANDROID_HOME.exec(zshrcContent.data);
            if (matchANDROID_SDK_ROOT) {
                await this.sendListen(mainWindow, 'Exported ANDROID_SDK_ROOT Found! Removing: ' + matchANDROID_SDK_ROOT[0], this.consoleType.info);
                zshrcContent.data = zshrcContent.data.replace(regexANDROID_SDK_ROOT, '');
                const writeFile = await this.fsManager.writeFile(this.zshrcManager.getZshrcPath(), zshrcContent.data);
                if (writeFile.error) {
                    return resolve(writeFile);
                }
            }
            if (matchANDROID_HOME) {
                await this.sendListen(mainWindow, 'Exported ANDROID_HOME Found! Removing: ' + matchANDROID_HOME[0], this.consoleType.info);
                zshrcContent.data = zshrcContent.data.replace(regexANDROID_HOME, '');
                const writeFile = await this.fsManager.writeFile(this.zshrcManager.getZshrcPath(), zshrcContent.data);
                if (writeFile.error) {
                    return resolve(writeFile);
                }
            }
            return resolve({ data: false, error: false });
        });
    }

    async checkExportedBuildToolsVersionAndRemove(mainWindow) {
        return new Promise(async (resolve) => {
            const regex = /(\/*export PATH=\$PATH:\$ANDROID_SDK_ROOT\/build-tools?\S+\/*)/g;
            await this.sendListen(mainWindow, 'Trying to check any set build tools version exist and remove!', this.consoleType.info);
            let zshrcContent = await this.zshrcManager.getZshrcContent();
            if (zshrcContent.error) {
                return resolve(zshrcContent);
            }
            const match = regex.exec(zshrcContent.data);
            if (match) {
                await this.sendListen(mainWindow, 'Exported Build Tools Found! Removing: ' + match[0], this.consoleType.info);
                zshrcContent.data = zshrcContent.data.replace(regex, '');
                const writeFile = await this.fsManager.writeFile(this.zshrcManager.getZshrcPath(), zshrcContent.data);
                if (writeFile.error) {
                    return resolve(writeFile);
                }
            }
            return resolve({ data: false, error: false });
        });
    }

    async checkExportedPlatformsVersionAndRemove(mainWindow) {
        return new Promise(async (resolve) => {
            const regexPlatforms = /(\/*export PATH=\$PATH:\$ANDROID_SDK_ROOT\/platforms\S+\/*)/g;
            const regexSources = /(\/*export PATH=\$PATH:\$ANDROID_SDK_ROOT\/sources\S+\/*)/g;
            await this.sendListen(mainWindow, 'Trying to check any set platforms version exist and remove!', this.consoleType.info);
            let zshrcContent = await this.zshrcManager.getZshrcContent();
            if (zshrcContent.error) {
                return resolve(zshrcContent);
            }
            let match = regexPlatforms.exec(zshrcContent.data);
            if (match) {
                await this.sendListen(mainWindow, 'Exported Platforms Found! Removing: ' + match[0], this.consoleType.info);
                zshrcContent.data = zshrcContent.data.replace(regexPlatforms, '');
                const writeFile = await this.fsManager.writeFile(this.zshrcManager.getZshrcPath(), zshrcContent.data);
                if (writeFile.error) {
                    return resolve(writeFile);
                }
            }
            match = regexSources.exec(zshrcContent.data);
            if (match) {
                await this.sendListen(mainWindow, 'Exported Sources Found! Removing: ' + match[0], this.consoleType.info);
                zshrcContent.data = zshrcContent.data.replace(regexSources, '');
                const writeFile = await this.fsManager.writeFile(this.zshrcManager.getZshrcPath(), zshrcContent.data);
                if (writeFile.error) {
                    return resolve(writeFile);
                }
            }
            return resolve({ data: false, error: false });
        });
    }

    async checkExportedPlatformToolsVersionAndRemove(mainWindow) {
        return new Promise(async (resolve) => {
            const regexPlatformTools = /(\/*export PATH=\$PATH:\$ANDROID_SDK_ROOT\/platform-tools\/*)/g;
            await this.sendListen(mainWindow, 'Trying to check any set platforms version exist and remove!', this.consoleType.info);
            let zshrcContent = await this.zshrcManager.getZshrcContent();
            if (zshrcContent.error) {
                return resolve(zshrcContent);
            }
            let match = regexPlatformTools.exec(zshrcContent.data);
            if (match) {
                await this.sendListen(mainWindow, 'Exported Platform Tools Found! Removing: ' + match[0], this.consoleType.info);
                zshrcContent.data = zshrcContent.data.replace(regexPlatformTools, '');
                const writeFile = await this.fsManager.writeFile(this.zshrcManager.getZshrcPath(), zshrcContent.data);
                if (writeFile.error) {
                    return resolve(writeFile);
                }
            }
            return resolve({ data: false, error: false });
        });
    }

    async checkExportedSystemImagesVersionAndRemove(mainWindow) {
        return new Promise(async (resolve) => {
            const regexSystemImages = /(\/*export PATH=\$PATH:\$ANDROID_SDK_ROOT\/system-images\/\S+\/*)/g;
            await this.sendListen(mainWindow, 'Trying to check any set system images version exist and remove!', this.consoleType.info);
            let zshrcContent = await this.zshrcManager.getZshrcContent();
            if (zshrcContent.error) {
                return resolve(zshrcContent);
            }
            let match = regexSystemImages.exec(zshrcContent.data);
            if (match) {
                await this.sendListen(mainWindow, 'Exported system images Found! Removing: ' + match[0], this.consoleType.info);
                zshrcContent.data = zshrcContent.data.replace(regexSystemImages, '');
                const writeFile = await this.fsManager.writeFile(this.zshrcManager.getZshrcPath(), zshrcContent.data);
                if (writeFile.error) {
                    return resolve(writeFile);
                }
            }
            return resolve({ data: false, error: false });
        });
    }

    async checkExportedEmulatorVersionAndRemove(mainWindow) {
        return new Promise(async (resolve) => {
            const regexEmulator = /(\/*export PATH=\$PATH:\$ANDROID_SDK_ROOT\/emulator\/*)/g;
            await this.sendListen(mainWindow, 'Trying to check any set emulator version exist and remove!', this.consoleType.info);
            let zshrcContent = await this.zshrcManager.getZshrcContent();
            if (zshrcContent.error) {
                return resolve(zshrcContent);
            }
            let match = regexEmulator.exec(zshrcContent.data);
            if (match) {
                await this.sendListen(mainWindow, 'Exported emulator Found! Removing: ' + match[0], this.consoleType.info);
                zshrcContent.data = zshrcContent.data.replace(regexEmulator, '');
                const writeFile = await this.fsManager.writeFile(this.zshrcManager.getZshrcPath(), zshrcContent.data);
                if (writeFile.error) {
                    return resolve(writeFile);
                }
            }
            return resolve({ data: false, error: false });
        });
    }

    async exportAndroidSdkRoot(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying export ANDROID SDK ROOT to ~/.zprofile!', this.consoleType.info);
            let setAndroidSdkRoot = await this.childManager.executeCommand(
                mainWindow,
                `echo 'export ANDROID_SDK_ROOT=$HOME/homebrew/share/android-commandlinetools
export ANDROID_HOME=$HOME/homebrew/share/android-commandlinetools' >> ~/.zprofile`,
                null,
                'When try to export ANDROID SDK ROOT to ~/.zprofile. Something get wrong!'
            );
            if (setAndroidSdkRoot.error) {
                return resolve(setAndroidSdkRoot);
            }
            await this.sendListen(mainWindow, 'Trying export ANDROID SDK ROOT to ~/.szshrc!', this.consoleType.info);
            setAndroidSdkRoot = await this.childManager.executeCommand(
                mainWindow,
                `echo 'export ANDROID_SDK_ROOT=$HOME/homebrew/share/android-commandlinetools
export ANDROID_HOME=$HOME/homebrew/share/android-commandlinetools' >> ~/.szshrc`,
                null,
                'When try to export ANDROID SDK ROOT to ~/.szshrc. Something get wrong!'
            );
            return resolve(setAndroidSdkRoot);
        });
    }

    async exportAndroidBuildTools(mainWindow, buildToolsVersions = []) {
        return new Promise(async (resolve) => {
            await buildToolsVersions.reduce(async (previousValue, currentValue) => {
                await previousValue.then(async () => {
                    await this.sendListen(mainWindow, 'Trying export build tools to ~/.zprofile!', this.consoleType.info);
                    await this.childManager.executeCommand(
                        mainWindow,
                        `echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/build-tools
export PATH=$PATH:$ANDROID_SDK_ROOT/build-tools/${ currentValue }
export PATH=$PATH:$ANDROID_SDK_ROOT/build-tools/${ currentValue }/lib' >> ~/.zprofile`,
                        null,
                        'When try to export build tools to ~/.zprofile. Something get wrong!'
                    );

                    await this.sendListen(mainWindow, 'Trying export build tools to ~/.szshrc!', this.consoleType.info);
                    await this.childManager.executeCommand(
                        mainWindow,
                        `echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/build-tools
export PATH=$PATH:$ANDROID_SDK_ROOT/build-tools/${ currentValue }
export PATH=$PATH:$ANDROID_SDK_ROOT/build-tools/${ currentValue }/lib' >> ~/.szshrc`,
                        null,
                        'When try to export build tools to ~/.szshrc. Something get wrong!'
                    );
                    await this.sendListen(mainWindow, 'Trying fix d8.jar!', this.consoleType.info);
                    await this.childManager.executeCommand(
                        mainWindow,
                        `cd ${ app.getPath('home') }/homebrew/share/android-commandlinetools/build-tools/${ currentValue } && mv d8 dx && cd lib && mv d8.jar dx.jar`,
                        null,
                        'When try to export fix. Something get wrong!'
                    );
                });
            }, Promise.resolve());

            return resolve({ error: false, data: false });
        });
    }

    async exportAndroidPlatforms(mainWindow, buildToolsVersions = []) {
        return new Promise(async (resolve) => {
            await buildToolsVersions.reduce(async (previousValue, currentValue) => {
                await previousValue.then(async () => {
                    await this.sendListen(mainWindow, 'Trying export platforms to ~/.zprofile!', this.consoleType.info);
                    await this.childManager.executeCommand(
                        mainWindow,
                        `echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/platforms/${ currentValue }
export PATH=$PATH:$ANDROID_SDK_ROOT/sources/${ currentValue }' >> ~/.zprofile`,
                        null,
                        'When try to export platforms to ~/.zprofile. Something get wrong!'
                    );
                    await this.sendListen(mainWindow, 'Trying export platforms to ~/.szshrc!', this.consoleType.info);
                    await this.childManager.executeCommand(
                        mainWindow,
                        `echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/platforms/${ currentValue }
export PATH=$PATH:$ANDROID_SDK_ROOT/sources/${ currentValue }' >> ~/.szshrc`,
                        null,
                        'When try to export platforms to ~/.szshrc. Something get wrong!'
                    );
                });
            }, Promise.resolve());
            return resolve({ error: false, data: false });
        });
    }

    async exportAndroidPlatformTools(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying export platforms to ~/.zprofile!', this.consoleType.info);
            await this.childManager.executeCommand(
                mainWindow,
                `echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools' >> ~/.zprofile`,
                null,
                'When try to export platforms to ~/.zprofile. Something get wrong!'
            );

            await this.sendListen(mainWindow, 'Trying export platforms to ~/.szshrc!', this.consoleType.info);
            await this.childManager.executeCommand(
                mainWindow,
                `echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools' >> ~/.szshrc`,
                null,
                'When try to export platforms to ~/.szshrc. Something get wrong!'
            );
            return resolve({ error: false, data: false });
        });
    }

    async exportSystemImages(mainWindow, systemImages) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying export platforms to ~/.zprofile!', this.consoleType.info);
            await this.childManager.executeCommand(
                mainWindow,
                `echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/system-images/${ systemImages.android }
export PATH=$PATH:$ANDROID_SDK_ROOT/system-images/${ systemImages.android }/${ systemImages.type }
export PATH=$PATH:$ANDROID_SDK_ROOT/system-images/${ systemImages.android }/${ systemImages.type }/${ systemImages.core }' >> ~/.zprofile`,
                null,
                'When try to export system images to ~/.zprofile. Something get wrong!'
            );

            await this.sendListen(mainWindow, 'Trying export platforms to ~/.szshrc!', this.consoleType.info);
            await this.childManager.executeCommand(
                mainWindow,
                `echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/system-images/${ systemImages.android }
export PATH=$PATH:$ANDROID_SDK_ROOT/system-images/${ systemImages.android }/${ systemImages.type }
export PATH=$PATH:$ANDROID_SDK_ROOT/system-images/${ systemImages.android }/${ systemImages.type }/${ systemImages.core }' >> ~/.szshrc`,
                null,
                'When try to export system images to ~/.szshrc. Something get wrong!'
            );
            return resolve({ error: false, data: false });
        });
    }

    async exportAndroidEmulator(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying export emulator to ~/.zprofile!', this.consoleType.info);
            await this.childManager.executeCommand(
                mainWindow,
                `echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/emulator' >> ~/.zprofile`,
                null,
                'When try to export emulator to ~/.zprofile. Something get wrong!'
            );

            await this.sendListen(mainWindow, 'Trying export emulator to ~/.szshrc!', this.consoleType.info);
            await this.childManager.executeCommand(
                mainWindow,
                `echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/emulator' >> ~/.szshrc`,
                null,
                'When try to export emulator to ~/.szshrc. Something get wrong!'
            );
            return resolve({ error: false, data: false });
        });
    }

    async getAndroidToolsVersions(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking android tools versions!', this.consoleType.info);
            const androidToolsVersion = await this.childManager.executeCommand(
                mainWindow,
                'sdkmanager  --list | awk \'/Installed packages:/{flag=1; next} /Available Packages:/{flag=0} flag\'',
                null,
                'When try to get Tools versions. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: false,
                    endError: true,
                    info: true
                }
            );
            if (androidToolsVersion.error) {
                return resolve(androidToolsVersion);
            }
            let m;
            const buildToolsRegex = /(\/*build-tools;\S+\/*)/g;
            const buildTools = [];
            while ((m = buildToolsRegex.exec(androidToolsVersion.data)) !== null) {
                if (m.index === buildToolsRegex.lastIndex) {
                    buildToolsRegex.lastIndex++;
                }
                m.forEach((match) => {
                    if (match && match.split(';').length > 0 && match.split(';')[1].trim() !== '' && !buildTools.includes(match.split(';')[1].trim())) {
                        buildTools.push(match.split(';')[1].trim());
                    }
                });
            }
            const platformToolsRegex = /(\/*platform-tools +\| \S+\/*)/g;
            const platformTools = [];
            while ((m = platformToolsRegex.exec(androidToolsVersion.data)) !== null) {
                if (m.index === platformToolsRegex.lastIndex) {
                    platformToolsRegex.lastIndex++;
                }
                m.forEach((match) => {
                    if (match && match.split('|').length > 0 && match.split('|')[1].trim() !== '' && !platformTools.includes(match.split('|')[1].trim())) {
                        platformTools.push(match.split('|')[1].trim());
                    }
                });
            }
            const platformsAndroidRegex = /(\/*platforms;android-\d+\/*)/g;
            const platformsAndroid = [];
            while ((m = platformsAndroidRegex.exec(androidToolsVersion.data)) !== null) {
                if (m.index === platformsAndroidRegex.lastIndex) {
                    platformsAndroidRegex.lastIndex++;
                }
                m.forEach((match) => {
                    if (match && match.split(';').length > 0 && match.split(';')[1].trim() !== '' && !platformsAndroid.includes(match.split(';')[1].trim())) {
                        platformsAndroid.push(match.split(';')[1].trim());
                    }
                });
            }
            return resolve({ error: false, data: { platformTools, platformsAndroid, buildTools } });
        });
    }

    async brewInstallAndroidSdk(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Android Sdk is installing', this.consoleType.info);
            const cmdCommandLines = await this.childManager.executeCommand(
                mainWindow,
                'brew reinstall --cask android-commandlinetools --force',
                null,
                'When try to install Android Sdk. Something get wrong!'
            );
            return resolve(cmdCommandLines);
        });
    }

    async brewExceptLicensesAndroidSdk(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying to except licences', this.consoleType.info);
            const brewTabCask = await this.childManager.executeCommand(
                mainWindow,
                'echo yes | sdkmanager --licenses',
                null,
                'When try to except licenses. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: false,
                    endError: true,
                    info: true
                }
            );
            return resolve(brewTabCask);
        });
    }

    async installAndroidSdkWithBrew(mainWindow, data = {
        buildTools: '30.0.3',
        platforms: 'android-29',
        systemImages: { type: 'google_apis_playstore', core: 'arm64-v8a', android: 'android-31' }
    }) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying install Android-Sdk with brew!', this.consoleType.info);
            const brewInstallAndroidSdk = await this.brewInstallAndroidSdk(mainWindow);
            if (brewInstallAndroidSdk.error) {
                return resolve(brewInstallAndroidSdk);
            }
            const brewExceptLicensesAndroidSdk = await this.brewExceptLicensesAndroidSdk(mainWindow);
            if (brewExceptLicensesAndroidSdk.error) {
                return resolve(brewExceptLicensesAndroidSdk);
            }

            const checkExportedAndroidHomeOrAndroidRootAndRemove = await this.checkExportedAndroidHomeOrAndroidRootAndRemove(mainWindow);
            if (checkExportedAndroidHomeOrAndroidRootAndRemove.error) {
                return resolve(checkExportedAndroidHomeOrAndroidRootAndRemove);
            }
            const exportAndroidSdkRoot = await this.exportAndroidSdkRoot(mainWindow);
            if (exportAndroidSdkRoot.error) {
                return resolve(exportAndroidSdkRoot);
            }

            await this.sendListen(mainWindow, 'This will take a while! Dont close the app!', this.consoleType.info);

            const installPlatformTools = await this.installPlatformTools(mainWindow);
            if (installPlatformTools.error) {
                return resolve(installPlatformTools);
            }

            const installPlatforms = await this.installPlatforms(mainWindow, data.platforms);
            if (installPlatforms.error) {
                return resolve(installPlatforms);
            }

            const installBuildTools = await this.installBuildTools(mainWindow, data.buildTools);
            if (installBuildTools.error) {
                return resolve(installBuildTools);
            }

            const installSystemImages = await this.installSystemImages(mainWindow, data.systemImages);
            if (installSystemImages.error) {
                return resolve(installSystemImages);
            }

            const installEmulator = await this.installEmulator(mainWindow);
            if (installEmulator.error) {
                return resolve(installEmulator);
            }

            const androidSdkManagerVersion = await this.getAndroidSdkVersion(mainWindow);
            await this.sendListen(mainWindow, 'Android Sdk is installed!', this.consoleType.info);
            return resolve(androidSdkManagerVersion);
        });
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


module.exports = { SdkManager };
