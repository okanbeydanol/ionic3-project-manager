const { ChildProcess } = require('./child_process');
const { CordovaManager } = require('./cordova-manager');
const { FsManager } = require('./fs-manager');
const path = require('path');
const { PackageJsonManager } = require('./package_json_control');
const { EnvironmentManager } = require('./environment-manager');
const { SdkManager } = require('./sdk-manager');
const config_path = path.join(__dirname, '../config');

class AndroidCleaner {
    CordovaManager = new CordovaManager();
    childManager = new ChildProcess();
    environmentManager = new EnvironmentManager();
    sdkManager = new SdkManager();
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {
    }

    async startAndroidCleaner(command, mainWindow, callback = () => {
    }) {
        return new Promise(async (resolve) => {
            const environmentCheck = await this.environmentManager.environmentCheck(mainWindow, (data) => {
                console.log('%c data', 'background: #222; color: #bada55', data);
                callback({ type: data.data, data: data.type });
            });
            if (environmentCheck.error) {
                return resolve(environmentCheck);
            }
            /*    if (command.includes('node_modules')) {
                       const refreshNodeModules = await this.refresh_only_node_modules(mainWindow);
                       if (refreshNodeModules.error) {
                           return resolve(refreshNodeModules);
                       }
                       console.log('%c refreshNodeModules', 'background: #222; color: #bada55', refreshNodeModules);
                   }
                   if (command.includes('prepare')) {
                       const refreshAndroid = await this.refresh_only_android(mainWindow);
                       if (refreshAndroid.error) {
                           return resolve(refreshAndroid);
                       }
                       console.log('%c refreshAndroid', 'background: #222; color: #bada55', refreshAndroid);
                   }*/
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
                null,
                'When try to npm cache verify. Something get wrong!'
            );
            if (npmCacheVerify.error) {
                return resolve(npmCacheVerify);
            }

            await this.sendListen(mainWindow, 'Npm packages is installing!', this.consoleType.info);
            const npmInstall = await this.childManager.executeCommand(
                mainWindow,
                'unset npm_config_prefix&&npm install',
                null,
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
            return resolve({ error: false, data: null });


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

            await this.CordovaManager.fixMacOsReleaseName(mainWindow, false);

            const check_webview_exist = await this.check_plugin_exist('cordova-plugin-ionic-webview');
            if (check_webview_exist) {
                await this.sendListen(mainWindow, 'Cordova webview plugin is removing!', this.consoleType.info);
                const removeCordovaWebview = await this.childManager.executeCommand(
                    mainWindow,
                    'unset npm_config_prefix&&npm uninstall cordova-plugin-ionic-webview',
                    null,
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
                    null,
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
                null,
                'When try to remove android platform. Something get wrong!'
            );
            if (removeAndroidPlatform.error) {
                return resolve(removeAndroidPlatform);
            }

            const addAndroidResources = await this.childManager.executeCommand(
                mainWindow,
                'ionic cordova resources android --force',
                null,
                'When try to add android platform. Something get wrong!'
            );
            if (addAndroidResources.error) {
                return resolve(addAndroidResources);
            }

            const addAndroidPlatform = await this.childManager.executeCommand(
                mainWindow,
                'ionic cordova platform add android',
                null,
                'When try to add android platform. Something get wrong!'
            );
            if (addAndroidPlatform.error) {
                return resolve(addAndroidPlatform);
            }

            let server = 'stg';
            const cmd_node = 'export NODE_ENV=' + (!server ? 'dev' : server);

            const cmd_prepare_android = cmd_node + ' && ionic cordova prepare android';
            await this.sendListen(mainWindow, 'Preparing android!', this.consoleType.info);
            const prepareAndroid = await this.childManager.executeCommand(
                mainWindow,
                cmd_prepare_android,
                null,
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
                null,
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
            /*
            if (keystore_config.path !== null) {
                const cmd_build_apk = cmd_node + ' && ionic cordova build android --prod --release -- -- --keystore="' + keystore + '" --storePassword="' + keystore_config.pass + '" --alias="' + keystore_config.alias + '" --password="' + keystore_config.pass + '" --packageType=apk';
                const cmd_build_aab = cmd_node + ' && ionic cordova build android --prod --release -- -- --keystore="' + keystore + '" --storePassword="' + keystore_config.pass + '" --alias="' + keystore_config.alias + '" --password="' + keystore_config.pass + '" --packageType=bundle';
                await execute_command(cmd_build_apk, "Build Android APK");
                await execute_command(cmd_build_aab, "Build Android AAB");
            }
            */
            return resolve({ error: false, data: null });


        });
    }

    async remove_folder_if_exist(path) {
        return new Promise(async (resolve) => {
            const deleteFolder = await new FsManager().rmDir(path);
            return resolve(deleteFolder);
        });
    }

    async remove_file_if_exist(path) {
        return new Promise(async (resolve) => {
            const deleteFolder = await new FsManager().rmDir(path);
            return resolve(deleteFolder);
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
                        });
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


module.exports = { AndroidCleaner };
