const { ChildProcess } = require('./child_process');
const { CordovaManager } = require('./cordova-manager');
const { FsManager } = require('./fs-manager');
const path = require('path');
const { PackageJsonManager } = require('./package_json_control');
const { EnvironmentManager } = require('./environment-manager');
const config_path = path.join(__dirname, '../config');

class IosCleaner {
    CordovaManager = new CordovaManager();
    childManager = new ChildProcess();
    environmentManager = new EnvironmentManager();
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {
    }

    async startIosCleaner(command, mainWindow) {
        return new Promise(async (resolve) => {
            const environmentCheck = await this.environmentManager.environmentCheck(mainWindow);
            if (environmentCheck.error) {
                return resolve(environmentCheck);
            }
            if (command.includes('node_modules')) {
                const refreshNodeModules = await this.refresh_only_node_modules(mainWindow);
                console.log('%c refreshNodeModules', 'background: #222; color: #bada55', refreshNodeModules);
            }
            if (command.includes('prepare')) {
                const refreshIos = await this.refresh_only_ios(mainWindow);
                console.log('%c refreshIos', 'background: #222; color: #bada55', refreshIos);
            }
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

    async refresh_only_ios(mainWindow) {
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
            await this.sendListen(mainWindow, 'Deleting the ios folder!', this.consoleType.info);
            await this.remove_folder_if_exist(this.config.project_path + '/' + this.config.folders.IOS);

            await this.CordovaManager.fixMacOsReleaseName(mainWindow, false);

            const check_webview_exist = await this.check_plugin_exist('cordova-plugin-ionic-webview');
            if (!check_webview_exist) {
                await this.sendListen(mainWindow, 'Cordova webview plugin is adding!', this.consoleType.info);
                const addCordovaWebview = await this.childManager.executeCommand(
                    mainWindow,
                    'unset npm_config_prefix&&npm install cordova-plugin-ionic-webview',
                    'export NVM_DIR="$HOME/.nvm"\n' +
                    '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                    '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                    'When try to adding webview. Something get wrong!'
                );
                if (addCordovaWebview.error) {
                    return resolve(addCordovaWebview);
                }
            }

            const check_native_webview_exist = await this.check_plugin_exist('@ionic-native/ionic-webview');
            if (!check_native_webview_exist) {
                await this.sendListen(mainWindow, 'Cordova native webview plugin is adding!', this.consoleType.info);
                const addCordovaNativeWebview = await this.childManager.executeCommand(
                    mainWindow,
                    'unset npm_config_prefix&&npm install @ionic-native/ionic-webview',
                    'export NVM_DIR="$HOME/.nvm"\n' +
                    '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                    '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                    'When try to adding webview. Something get wrong!'
                );
                if (addCordovaNativeWebview.error) {
                    return resolve(addCordovaNativeWebview);
                }
            }


            await this.sendListen(mainWindow, 'Remove ios platform!', this.consoleType.info);
            const removeIosPlatform = await this.childManager.executeCommand(
                mainWindow,
                'ionic cordova platform remove ios',
                null,
                'When try to remove ios platform. Something get wrong!'
            );
            if (removeIosPlatform.error) {
                return resolve(removeIosPlatform);
            }

            await this.sendListen(mainWindow, 'Add ios resources!', this.consoleType.info);
            const addIosResources = await this.childManager.executeCommand(
                mainWindow,
                'ionic cordova resources ios --force',
                null,
                'When try to add android platform. Something get wrong!'
            );
            if (addIosResources.error) {
                return resolve(addIosResources);
            }

            await this.sendListen(mainWindow, 'Add ios platform!', this.consoleType.info);
            const addIosPlatform = await this.childManager.executeCommand(
                mainWindow,
                'ionic cordova platform add ios',
                null,
                'When try to add ios platform. Something get wrong!'
            );
            if (addIosPlatform.error) {
                return resolve(addIosPlatform);
            }

            await this.sendListen(mainWindow, 'Ios preparing!', this.consoleType.info);
            const IosPrepare = await this.childManager.executeCommand(
                mainWindow,
                'ionic cordova prepare ios',
                null,
                'When try to add prepare ios. Something get wrong!'
            );
            if (IosPrepare.error) {
                return resolve(IosPrepare);
            }


            await this.sendListen(mainWindow, '--------BEFORE BUILD IOS FIXES----------', this.consoleType.info);
            const editFilesBefore = await this.editFiles(mainWindow, 'before_build', 'platforms/ios', this.config.project_path);
            if (editFilesBefore.error) {
                return resolve(editFilesBefore);
            }
            await this.sendListen(mainWindow, '--------BEFORE BUILD ANDROID FIXES END----------', this.consoleType.info);


            await this.sendListen(mainWindow, 'Build Ios!', this.consoleType.info);
            let server = 'dev';
            const cmd_node = 'export NODE_ENV=' + (!server ? 'dev' : server);
            const buildIos = await this.childManager.executeCommand(
                mainWindow,
                cmd_node + '&&ionic cordova build ios --aot',
                null,
                'When try to build ios. Something get wrong!'
            );
            if (buildIos.error) {
                return resolve(buildIos);
            }

            await this.sendListen(mainWindow, '--------AFTER BUILD IOS FIXES----------', this.consoleType.info);
            const editFilesAfter = await this.editFiles(mainWindow, 'before_build', 'platforms/ios', this.config.project_path);
            if (editFilesAfter.error) {
                return resolve(editFilesAfter);
            }
            await this.sendListen(mainWindow, '--------AFTER BUILD ANDROID FIXES END----------', this.consoleType.info);
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


module.exports = { IosCleaner };
