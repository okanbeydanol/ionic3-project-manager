const {ChildProcess} = require('./child_process');
const {IonicManager} = require('./ionic-manager');
const {CordovaManager} = require('./cordova-manager');
const {BrewManager} = require('./brew-manager');
const {GradleManager} = require('./gradle-manager');
const {NodeManager} = require('./node-manager');
const {JavaManager} = require('./java-manager');
const {FsManager} = require("./fs-manager");
const path = require("path");
const {PackageJsonManager} = require("./package_json_control");
const config_path = path.join(__dirname, '../config');

class AndroidCleaner {
    ionicCli = new IonicManager();
    CordovaManager = new CordovaManager();
    BrewManager = new BrewManager();
    GradleManager = new GradleManager();
    NodeManager = new NodeManager();
    JavaManager = new JavaManager();
    childManager = new ChildProcess();
    NodeMin = '12.22.0';
    NodeMax = '14.17.0';
    consoleType = {
        command: "command",
        output: "output",
        error: "error",
        info: "info"
    }

    constructor() {
    }

    async startAndroidCleaner(command, mainWindow) {
        return new Promise(async (resolve) => {
            const environmentCheck = await this.environmentCheck(mainWindow);
            if (environmentCheck.error) {
                return resolve(environmentCheck);
            }
            if (command.includes('node_modules')) {
                const refreshNodeModules = await this.refresh_only_node_modules(mainWindow);
                console.log('%c refreshNodeModules', 'background: #222; color: #bada55', refreshNodeModules);
            }
            if (command.includes('prepare')) {
                const refreshAndroid = await this.refresh_only_android(mainWindow);
                console.log('%c refreshAndroid', 'background: #222; color: #bada55', refreshAndroid);
            }
        });
    }

    async environmentCheck(mainWindow) {
        return new Promise(async (resolve) => {
            const handleBrew = await this.handleBrew(mainWindow);
            if (handleBrew.error) {
                return resolve(handleBrew);
            }
            const handleNode = await this.handleNode(mainWindow);
            if (handleNode.error) {
                return resolve(handleNode);
            }
            const handleJava = await this.handleJava(mainWindow);
            if (handleJava.error) {
                return resolve(handleJava);
            }
            const handleGradle = await this.handleGradle(mainWindow);
            if (handleGradle.error) {
                return resolve(handleGradle);
            }
            const handleIonic = await this.handleIonic(mainWindow);
            if (handleIonic.error) {
                return resolve(handleIonic);
            }
            const handleCordova = await this.handleCordova(mainWindow);
            if (handleCordova.error) {
                return resolve(handleCordova);
            }
            const handleCordovaRes = await this.handleCordovaRes(mainWindow);
            if (handleCordovaRes.error) {
                return resolve(handleCordovaRes);
            }
            return resolve({error: false});
        });
    }

    async handleBrew(mainWindow) {
        return new Promise(async (resolve) => {
            let brewVersion = await this.BrewManager.getBrewVersion(mainWindow);
            if (brewVersion.error) {
                const installBrew = await this.tryInstallBrew(mainWindow);
                if (installBrew.error) {
                    return resolve(installBrew);
                }
                brewVersion = await this.BrewManager.getBrewVersion(mainWindow);
            }
            return resolve(brewVersion)
        });
    }

    async handleNode(mainWindow) {
        return new Promise(async (resolve) => {
            let nodeVersion = await this.NodeManager.getNodeVersion(mainWindow);
            if (nodeVersion.error) {
                nodeVersion = await this.NodeManager.changeNodeVersionTo(mainWindow, this.NodeMax)
                if (nodeVersion.error) {
                    return resolve(nodeVersion);
                }
            }
            const v = nodeVersion.data.replace('v', '');
            const split = v.split('.');
            await this.sendListen(mainWindow, 'Compare project required node version!');
            const compareVersions = this.compareVersions(split, this.NodeMin.split('.'), this.NodeMax.split('.'));
            console.log('%c compareVersions', 'background: #222; color: #bada55', compareVersions);
            if (+compareVersions === -1) {
                nodeVersion = await this.NodeManager.changeNodeVersionTo(mainWindow, this.NodeMax);
                if (nodeVersion.error) {
                    return resolve(nodeVersion);
                }
            }
            return resolve(nodeVersion);
        });
    }

    async handleJava(mainWindow) {
        return new Promise(async (resolve) => {
            let javaVersion = await this.JavaManager.getJavaVersion(mainWindow);
            if (javaVersion.error || (!javaVersion.error && !javaVersion.data.replace('javac ', '').trim().startsWith('1.8'))) {
                const installJavaWithBrew = await this.tryInstallJavaWithAzul(mainWindow);
                if (installJavaWithBrew.error) {
                    return resolve(installJavaWithBrew);
                }
                javaVersion = await this.JavaManager.getJavaVersion(mainWindow);
            }
            return resolve(javaVersion);
        });
    }

    async handleIonic(mainWindow) {
        return new Promise(async (resolve) => {
            let ionicVersion = await this.ionicCli.getIonicVersion(mainWindow);
            if (ionicVersion.error) {
                const installIonic = await this.tryInstallIonic(mainWindow);
                if (installIonic.error) {
                    return resolve(installIonic);
                }
                ionicVersion = await this.ionicCli.getIonicVersion(mainWindow);
            }
            return resolve(ionicVersion);
        });
    }

    async handleCordova(mainWindow) {
        return new Promise(async (resolve) => {
            let cordovaVersion = await this.CordovaManager.getCordovaVersion(mainWindow);
            if (cordovaVersion.error) {
                if (cordovaVersion.message.includes('nameMap')) {
                    cordovaVersion = await this.CordovaManager.fixMacOsReleaseName(mainWindow, true);
                }
                if (cordovaVersion.error) {
                    const installCordova = await this.tryInstallCordova(mainWindow);
                    if (installCordova.error) {
                        return resolve(installCordova);
                    }
                    cordovaVersion = await this.CordovaManager.getCordovaVersion(mainWindow);
                    if (cordovaVersion.error && cordovaVersion.message.includes('nameMap')) {
                        cordovaVersion = await this.CordovaManager.fixMacOsReleaseName(mainWindow, true);
                    }
                }
            }
            return resolve(cordovaVersion);
        });
    }

    async handleCordovaRes(mainWindow) {
        return new Promise(async (resolve) => {
            let cordovaResourcesVersion = await this.CordovaManager.getCordovaResVersion(mainWindow);
            if (cordovaResourcesVersion.error) {
                const installCordovaResources = await this.tryInstallCordovaResources(mainWindow);
                if (installCordovaResources.error) {
                    return resolve(installCordovaResources);
                }
                cordovaResourcesVersion = await this.CordovaManager.getCordovaResVersion(mainWindow);
            }
            return resolve(cordovaResourcesVersion);
        });
    }

    async handleGradle(mainWindow) {
        return new Promise(async (resolve) => {
            let gradleVersion = await this.GradleManager.getGradleVersion(mainWindow);
            if (gradleVersion.error) {
                await this.sendListen(mainWindow, 'Trying install gradle!');
                const installGradleWithBrew = await this.tryInstallGradleWithBrew(mainWindow);
                if (installGradleWithBrew.error) {
                    if (!installGradleWithBrew.message.includes('Brew')) {
                        return resolve(installGradleWithBrew);
                    }
                }
                gradleVersion = await this.GradleManager.getGradleVersion(mainWindow);
                if (gradleVersion.error) {
                    return resolve(gradleVersion);
                }
            }
            return resolve(gradleVersion);
        });
    }

    async tryInstallBrew(mainWindow) {
        return new Promise(async (resolve) => {
            const installBrew = await this.BrewManager.installBrew(mainWindow);
            return resolve(installBrew);
        });
    }

    async tryInstallJavaWithBrew(mainWindow) {
        return new Promise(async (resolve) => {
            const installJavaWithBrew = await this.JavaManager.installJavaWithBrew(mainWindow);
            return resolve(installJavaWithBrew);
        });
    }


    async tryInstallJavaWithAzul(mainWindow) {
        return new Promise(async (resolve) => {
            const installJavaWithBrew = await this.JavaManager.installJavaWithAzul(mainWindow);
            return resolve(installJavaWithBrew);
        });
    }

    async tryInstallIonic(mainWindow) {
        return new Promise(async (resolve) => {
            const installIonic = await this.ionicCli.installIonic(mainWindow);
            return resolve(installIonic);
        });
    }

    async tryInstallCordova(mainWindow) {
        return new Promise(async (resolve) => {
            const installCordova = await this.CordovaManager.installCordova(mainWindow, 10);
            return resolve(installCordova);
        });
    }

    async tryInstallCordovaResources(mainWindow) {
        return new Promise(async (resolve) => {
            const installCordovaRes = await this.CordovaManager.installCordovaRes(mainWindow);
            return resolve(installCordovaRes);
        });
    }

    async tryInstallGradleWithBrew(mainWindow) {
        return new Promise(async (resolve) => {
            const brewVersion = await this.BrewManager.getBrewVersion(mainWindow);
            if (brewVersion.error) {
                return resolve(brewVersion);
            }
            const installGradle = await this.GradleManager.installGradle(mainWindow);
            return resolve(installGradle);
        });
    }

    async refresh_only_node_modules(mainWindow) {
        return new Promise(async (resolve) => {
            this.config = await new FsManager().readFile(config_path + '/settings.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            }).then((d) => {
                return JSON.parse(d.data);
            });
            await this.sendListen(mainWindow, 'Deleting the www folder!', this.consoleType.info);
            await this.remove_folder_if_exist(this.config.project_path + '/' + this.config.folders.WWW);
            await this.sendListen(mainWindow, 'Deleting the node_modules folder!', this.consoleType.info);
            await this.remove_folder_if_exist(this.config.project_path + '/' + this.config.folders.NODE_MODULES);
            await this.sendListen(mainWindow, 'Deleting the package_lock.json folder!', this.consoleType.info);
            await this.remove_file_if_exist(this.config.project_path + '/' + this.config.folders.PACKAGE_LOCK_JSON);

            await this.sendListen(mainWindow, 'Npm Cache is verifying!', this.consoleType.info);
            const npmCacheVerify = await this.childManager.executeCommand(
                mainWindow,
                'unset npm_config_prefix&&npm cache verify',
                'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                'When try to npm cache verify. Something get wrong!'
            );
            if (npmCacheVerify.error) {
                return resolve(npmCacheVerify);
            }

            await this.sendListen(mainWindow, 'Npm packages is installing!', this.consoleType.info);
            const npmInstall = await this.childManager.executeCommand(
                mainWindow,
                'unset npm_config_prefix&&npm install',
                'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                'When try to npm install. Something get wrong!'
            );
            if (npmInstall.error) {
                return resolve(npmInstall);
            }

            await this.sendListen(mainWindow, '--------BEFORE BUILD NODE MODULES FIXES----------', this.consoleType.info);
            const editFiles = await this.editFiles(mainWindow, 'before_build', 'node_modules', this.config.project_path);
            if (editFiles.error) {
                return resolve(editFiles);
            }

            await this.sendListen(mainWindow, '--------BEFORE BUILD NODE MODULES FIXES END----------', this.consoleType.info);
            return resolve({error: false, data: null});


        });
    }

    async refresh_only_android(mainWindow) {
        return new Promise(async (resolve) => {
            this.config = await new FsManager().readFile(config_path + '/settings.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            }).then((d) => {
                return JSON.parse(d.data);
            });
            await this.sendListen(mainWindow, 'Deleting the www folder!', this.consoleType.info);
            await this.remove_folder_if_exist(this.config.project_path + '/' + this.config.folders.WWW);
            await this.sendListen(mainWindow, 'Deleting the plugins folder!', this.consoleType.info);
            await this.remove_folder_if_exist(this.config.project_path + '/' + this.config.folders.PLUGINS);
            await this.sendListen(mainWindow, 'Deleting the android folder!', this.consoleType.info);
            await this.remove_folder_if_exist(this.config.project_path + '/' + this.config.folders.ANDROID);
            await this.sendListen(mainWindow, 'Deleting the ios folder!', this.consoleType.info);
            await this.remove_folder_if_exist(this.config.project_path + '/' + this.config.folders.IOS);

            await this.CordovaManager.fixMacOsReleaseName(mainWindow, false);

            const check_webview_exist = await this.check_plugin_exist('cordova-plugin-ionic-webview');
            if (check_webview_exist) {
                await this.sendListen(mainWindow, 'Cordova webview plugin is removing!', this.consoleType.info);
                const removeCordovaWebview = await this.childManager.executeCommand(
                    mainWindow,
                    'unset npm_config_prefix&&npm uninstall cordova-plugin-ionic-webview',
                    'export NVM_DIR="$HOME/.nvm"\n' +
                    '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                    '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                    'When try to remove webview. Something get wrong!'
                );
                if (removeCordovaWebview.error) {
                    return resolve(removeCordovaWebview);
                }
            }

            const check_native_webview_exist = await this.check_plugin_exist('@ionic-native/ionic-webview');
            if (check_native_webview_exist) {
                await this.sendListen(mainWindow, 'Cordova native webview plugin is removing!', this.consoleType.info);
                const removeCordovaNativeWebview = await this.childManager.executeCommand(
                    mainWindow,
                    'unset npm_config_prefix&&npm uninstall @ionic-native/ionic-webview',
                    'export NVM_DIR="$HOME/.nvm"\n' +
                    '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                    '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                    'When try to remove webview. Something get wrong!'
                );
                if (removeCordovaNativeWebview.error) {
                    return resolve(removeCordovaNativeWebview);
                }
            }


            await this.sendListen(mainWindow, 'Remove android platform!', this.consoleType.info);
            const removeAndroidPlatform = await this.childManager.executeCommand(
                mainWindow,
                'ionic cordova platform remove android',
                'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                'When try to remove android platform. Something get wrong!'
            );
            if (removeAndroidPlatform.error) {
                return resolve(removeAndroidPlatform);
            }

            const addAndroidPlatform = await this.childManager.executeCommand(
                mainWindow,
                'ionic cordova resources android --force',
                'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                'When try to add android platform. Something get wrong!'
            );
            if (addAndroidPlatform.error) {
                return resolve(addAndroidPlatform);
            }

            const addAndroidResources = await this.childManager.executeCommand(
                mainWindow,
                'ionic cordova platform add android',
                'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                'When try to add android platform. Something get wrong!'
            );
            if (addAndroidResources.error) {
                return resolve(addAndroidResources);
            }

            let server = 'dev';
            const cmd_node = 'export NODE_ENV=' + (!server ? "dev" : server);

            const cmd_prepare_android = cmd_node + ' && ionic cordova prepare android';
            await this.sendListen(mainWindow, 'Preparing android!', this.consoleType.info);
            const prepareAndroid = await this.childManager.executeCommand(
                mainWindow,
                cmd_prepare_android,
                'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                'When try to remove webview. Something get wrong!'
            );
            if (prepareAndroid.error) {
                return resolve(prepareAndroid);
            }

            await this.sendListen(mainWindow, '--------BEFORE BUILD ANDROID FIXES----------', this.consoleType.info);
            const editFilesBefore = await this.editFiles(mainWindow, 'before_build', 'platforms/android', this.config.project_path);
            if (editFilesBefore.error) {
                return resolve(editFilesBefore);
            }
            await this.sendListen(mainWindow, '--------BEFORE BUILD ANDROID FIXES END----------', this.consoleType.info);

            const cmd_build_aot_android = cmd_node + ' && ionic cordova build android --release --aot';
            await this.sendListen(mainWindow, 'Build android!', this.consoleType.info);
            const buildAndroid = await this.childManager.executeCommand(
                mainWindow,
                cmd_build_aot_android,
                'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                'When try to remove webview. Something get wrong!'
            );
            if (buildAndroid.error) {
                return resolve(buildAndroid);
            }

            await this.sendListen(mainWindow, '--------AFTER BUILD ANDROID FIXES----------', this.consoleType.info);
            const editFilesAfter = await this.editFiles(mainWindow, 'after_build', 'platforms/android', this.config.project_path);
            if (editFilesAfter.error) {
                return resolve(editFilesAfter);
            }
            await this.sendListen(mainWindow, '--------AFTER BUILD ANDROID FIXES END----------', this.consoleType.info);

            /*            if (keystore_config.path !== null) {
                            const cmd_build_apk = cmd_node + ' && ionic cordova build android --prod --release -- -- --keystore="' + keystore + '" --storePassword="' + keystore_config.pass + '" --alias="' + keystore_config.alias + '" --password="' + keystore_config.pass + '" --packageType=apk';
                            const cmd_build_aab = cmd_node + ' && ionic cordova build android --prod --release -- -- --keystore="' + keystore + '" --storePassword="' + keystore_config.pass + '" --alias="' + keystore_config.alias + '" --password="' + keystore_config.pass + '" --packageType=bundle';
                            await execute_command(cmd_build_apk, "Build Android APK");
                            await execute_command(cmd_build_aab, "Build Android AAB");
                        }*/

            return resolve({error: false, data: null});


        });
    }

    async remove_folder_if_exist(path) {
        return new Promise(async (resolve) => {
            const deleteFolder = await new FsManager().rmDir(path)
            return resolve(deleteFolder);
        });
    }

    async remove_file_if_exist(path) {
        return new Promise(async (resolve) => {
            const deleteFolder = await new FsManager().rmDir(path)
            return resolve(deleteFolder);
        });
    }

    async execute_command(mainWindow, command) {
        return new Promise(async (resolve) => {
            await this.childManager.execCommand('cd ' + this.config.project_path + '&&' + command, (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'npm connot install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            }, mainWindow);
        });
    }

    async editFiles(mainWindow, order, type, projectPath) {
        return new Promise(async (resolve) => {
            let d = [];
            if (type === 'node_modules') {
                let json = await new FsManager().readFile(config_path + '/node_modules_fixes.json', {
                    encoding: 'utf8',
                    flag: 'r',
                    signal: null
                });
                d = JSON.parse(json.data);
            } else if (type === 'platforms/android') {
                let json = await new FsManager().readFile(config_path + '/android_fixes.json', {
                    encoding: 'utf8',
                    flag: 'r',
                    signal: null
                });
                d = JSON.parse(json.data);
            } else if (type === 'platforms/ios') {
                let json = await new FsManager().readFile(config_path + '/ios_fixes.json', {
                    encoding: 'utf8',
                    flag: 'r',
                    signal: null
                });
                d = JSON.parse(json.data);
            }

            await d.reduce((lastPromise, file_info) => {
                return lastPromise.then(async () => {
                    const pathExist = await new FsManager().pathExist(projectPath + '/' + file_info.folder + file_info.path);
                    if (order === file_info.order && !pathExist.error && pathExist.data) {
                        const fileContent = await new FsManager().readFile(projectPath + '/' + file_info.folder + file_info.path, {
                            encoding: 'utf8',
                            flag: 'r',
                            signal: null
                        })
                        if (!fileContent.error) {
                            let newFileContent = fileContent.data;
                            for (let i = 0; i < file_info.data.length; i++) {
                                const data = file_info.data[i];
                                const match = new RegExp(data.regex, '').exec(newFileContent);
                                if (match) {
                                    await this.sendListen(mainWindow, '-------- EDITING ' + file_info.path + ' ----------', this.consoleType.info);
                                    console.log('%c MATCH:', 'background: #222; color: #bada55', file_info.path);
                                    newFileContent = newFileContent.replace(new RegExp(data.regex, ''), file_info.type === 'remove' ? '' : file_info.type === 'add' ? '' : file_info.type === 'replace' ? data.text : '');
                                    await new FsManager().writeFile(projectPath + '/' + file_info.folder + file_info.path, newFileContent);
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

    compareVersions(version, minVersion, maxVersion) {
        const [ minMajor, minMinor = 0, minPatch = 0 ] = minVersion.map(Number);
        const [ curMajor, curMinor = 0, curPatch = 0 ] = version.map(Number);
        const [ maxMajor, maxMinor = 0, maxPatch = 0 ] = maxVersion.map(Number);

        console.log('%c version', 'background: #222; color: #bada55', version);
        console.log('%c minVersion', 'background: #222; color: #bada55', minVersion);
        console.log('%c maxVersion', 'background: #222; color: #bada55', maxVersion);

        if (curMajor < minMajor || curMajor > maxMajor) {
            return -1;
        }

        if (curMajor === minMajor && curMinor < minMinor) {
            return -1;
        }

        if (curMajor === minMajor && curMinor === minMinor && curPatch < minPatch) {
            return -1;
        }

        if (curMajor === maxMajor && curMinor > maxMinor) {
            return -1;
        }

        if (curMajor === maxMajor && curMinor === maxMinor && curPatch > maxPatch) {
            return -1;
        }

        return 0;
    }

    async check_plugin_exist(plugin_name) {
        return new Promise(async (resolve) => {
            let result = false;
            const init = await new PackageJsonManager().init();
            if (init.error) {
                return resolve(false);
            }
            if (init.data.package_json_dependencies[plugin_name]) {
                result = true;
            }
            if (init.data.package_json_devDependencies[plugin_name]) {
                result = true;
            }
            return resolve(result);
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


module.exports = {AndroidCleaner};
