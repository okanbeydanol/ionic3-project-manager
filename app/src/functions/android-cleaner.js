const {ChildProcess} = require('./child_process');
const {IonicManager} = require('./ionic-manager');
const {CordovaManager} = require('./cordova-manager');
const {BrewManager} = require('./brew-manager');
const {GradleManager} = require('./gradle-manager');
const {NodeManager} = require('./node-manager');
const {JavaManager} = require('./java-manager');
const {FsManager} = require("./fs-manager");
const path = require("path");
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
            await this.sendListen(mainWindow, 'Deleting the www folder!');
            await this.remove_folder_if_exist(this.config.project_path + '/' + this.config.folders.WWW);
            await this.sendListen(mainWindow, 'Deleting the node_modules folder!');
            await this.remove_folder_if_exist(this.config.project_path + '/' + this.config.folders.NODE_MODULES);
            await this.sendListen(mainWindow, 'Deleting the package_lock.json folder!');
            await this.remove_file_if_exist(this.config.project_path + '/' + this.config.folders.PACKAGE_LOCK_JSON);
            await this.sendListen(mainWindow, "Npm cache verifying");
            const cache_verify = await this.execute_command(mainWindow, this.config.scripts.cache_verify);
            if (cache_verify.error) {
                return resolve(cache_verify);
            }
            await this.sendListen(mainWindow, "Npm packages is installing");
            const npm_install = await this.execute_command(mainWindow, this.config.scripts.npm_install);
            if (npm_install.error) {
                return resolve(npm_install);
            }

            const editFiles = await this.editFiles(mainWindow);
            if (editFiles.error) {
                return resolve(editFiles);
            }
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

    async editFiles(mainWindow, type = 'node_modules') {
        return new Promise(async (resolve) => {
            console.log('%c BYRDAAA', 'background: #222; color: #bada55',);
            const node_modules_fixes = await new FsManager().readFile(config_path + '/node_modules_fixes.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            }).then((d) => {
                return JSON.parse(d.data);
            });
            console.log('%c node_modules_fixes', 'background: #222; color: #bada55', node_modules_fixes);
            const android_fixes = await new FsManager().readFile(config_path + '/android_fixes.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            }).then((d) => {
                return JSON.parse(d.data);
            });
            const ios_fixes = await new FsManager().readFile(config_path + '/ios_fixes.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            }).then((d) => {
                return JSON.parse(d.data);
            });
            console.log('%c android_fixes', 'background: #222; color: #bada55', android_fixes);
            /*  await array.reduce((lastPromise, file_info) => {
                  return lastPromise.then(async () => {
                      if (order === file_info.order && existsSync(file_info.path)) {
                          const fileContent = readFileSync(file_info.path, 'utf8').toString();
                          const isFile = lstatSync(file_info.path).isFile();
                          if (isFile) {
                              if (!file_info.multiple) {
                                  const match = fileContent.match(file_info.regex);
                                  if (match) {
                                      console.log('------ Editing ' + file_info.path + ' ------');
                                      const newFileContent = fileContent.replace(file_info.regex, +file_info.type === 0 ? '' : +file_info.type === 1 ? '' : +file_info.type === 2 ? file_info.text : '');
                                      await writeFileF(file_info.path, newFileContent);
                                  }
                              } else {
                                  let newFileContent = fileContent;
                                  for (let i = 0; i < file_info.data.length; i++) {
                                      const data = file_info.data[i];
                                      const match = data.regex.exec(newFileContent);
                                      if (match) {
                                          console.log('------ Editing ' + file_info.path + ' ------');
                                          newFileContent = newFileContent.replace(data.regex, +file_info.type === 0 ? '' : +file_info.type === 1 ? '' : +file_info.type === 2 ? data.text : '');
                                      }
                                  }
                                  await writeFileF(file_info.path, newFileContent);
                              }
                          }
                      }
                  });
              }, Promise.resolve());*/
        });
    }

    compareVersions(version, minVersion, maxVersion) {
        const len = Math.min(minVersion.length, maxVersion.length, version.length);
        for (let i = 0; i < len; i++) {
            if (parseInt(version[i]) > parseInt(maxVersion[i])) {
                return -1;
            }
        }

        for (let i = 0; i < len; i++) {
            if (parseInt(version[i]) < parseInt(minVersion[i])) {
                return -1;
            }
        }
        return 0;
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
