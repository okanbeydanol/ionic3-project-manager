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
    NodeMin = '12.20.0';
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
            /*   const environmentCheck = await this.environmentCheck(mainWindow);
               if (environmentCheck.error) {
                   return resolve(environmentCheck);
               }*/


            /*


               if (command.includes('node_modules')) {
                   const refreshNodeModules = await this.refresh_only_node_modules(mainWindow);
                   console.log('%c refreshNodeModules', 'background: #222; color: #bada55', refreshNodeModules);
               }*/
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


            // Ionic Version
            await this.sendListen(mainWindow, 'Checking ionic version!')
            let ionicVersion = await this.ionicCli.getIonicVersion(mainWindow);
            if (ionicVersion.error) {
                await this.sendListen(mainWindow, 'Trying install ionic!')
                const installIonic = await this.tryInstallIonic(mainWindow);
                if (installIonic.error) {
                    return resolve(installIonic);
                }
                ionicVersion = await this.ionicCli.getIonicVersion(mainWindow);
                if (ionicVersion.error) {
                    return resolve(installIonic);
                }
            }
            this.IONIC_VERSION = ionicVersion.data;
            await this.sendListen(mainWindow, 'Ionic is installed! Version: ' + ionicVersion.data);

            await this.sendListen(mainWindow, 'Checking cordova version!');
            // Cordova Version
            let cordovaError = null;
            let fixed = null;
            let cordovaVersion = await this.CordovaManager.getCordovaVersion(mainWindow);
            if (cordovaVersion.error) {
                await this.sendListen(mainWindow, 'Cordova not found!');
                if (cordovaVersion.message === 'nameMap ERROR') {
                    await this.sendListen(mainWindow, 'nameMap ERROR!');
                    cordovaError = 'nameMap';
                    await this.sendListen(mainWindow, 'Try to fix nameMap!');
                    fixed = await this.CordovaManager.fixMacOsReleaseName(mainWindow, true);
                    if (fixed.error) {
                        return resolve(fixed);
                    }
                } else {
                    await this.sendListen(mainWindow, 'Trying install cordova!');
                    cordovaError = 'notFound';
                    const installCordova = await this.tryInstallCordova(mainWindow);
                    if (installCordova.error) {
                        return resolve(installCordova);
                    }
                }

                if (cordovaError === 'nameMap') {
                    cordovaVersion = fixed;
                } else {
                    cordovaVersion = await this.CordovaManager.getCordovaVersion(mainWindow);
                    if (cordovaVersion.error) {
                        if (cordovaVersion.message === 'nameMap ERROR') {
                            await this.sendListen(mainWindow, 'nameMap ERROR!');
                            await this.sendListen(mainWindow, 'Try to fix nameMap!');
                            fixed = await this.CordovaManager.fixMacOsReleaseName(mainWindow, true);
                            if (fixed.error) {
                                return resolve(fixed);
                            }
                            cordovaVersion = fixed;
                        } else {
                            return resolve(cordovaVersion);
                        }
                    }
                }
            }
            this.CORDOVA_VERSION = cordovaVersion.data;
            await this.sendListen(mainWindow, 'Cordova is installed! Version: ' + cordovaVersion.data);
            await this.sendListen(mainWindow, 'Checking cordova resources version!');
            // Cordova Resources Version
            let cordovaResourcesVersion = await this.CordovaManager.getCordovaResVersion(mainWindow);
            if (cordovaResourcesVersion.error) {
                await this.sendListen(mainWindow, 'Trying install cordova resources!');
                const installCordovaResources = await this.tryInstallCordovaResources(mainWindow);
                if (installCordovaResources.error) {
                    return resolve(installCordovaResources);
                }
                cordovaResourcesVersion = await this.CordovaManager.getCordovaResVersion(mainWindow);
                if (cordovaResourcesVersion.error) {
                    return resolve(cordovaResourcesVersion);
                }
            }
            this.CORDOVA_RES_VERSION = cordovaResourcesVersion.data;
            await this.sendListen(mainWindow, 'Cordova resources is installed! Version: ' + cordovaResourcesVersion.data);


            await this.sendListen(mainWindow, 'Checking gradle version!');
            // Gradle Version
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
            this.GRADLE_VERSION = gradleVersion.data;
            await this.sendListen(mainWindow, 'Gradle is installed! Version: ' + gradleVersion.data);

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
            const v = nodeVersion.data;
            const replace = v.replace('v', '').split('.');
            await this.sendListen(mainWindow, 'Compare project required node version!');
            const compareVersions = this.compareVersions(replace, this.NodeMin.split('.'), this.NodeMax.split('.'))
            if (+compareVersions === -1) {
                const changeNodeVersion = await this.NodeManager.changeNodeVersionTo(mainWindow, this.NodeMax);
                if (changeNodeVersion.error) {
                    return resolve(changeNodeVersion);
                }
            }
            nodeVersion = await this.NodeManager.getNodeVersion(mainWindow);
            return resolve(nodeVersion);
        });
    }

    async handleJava(mainWindow) {
        return new Promise(async (resolve) => {
            let javaVersion = await this.JavaManager.getJavaVersion(mainWindow);
            if (javaVersion.error) {
                const installJavaWithBrew = await this.tryInstallJavaWithBrew(mainWindow);
                if (installJavaWithBrew.error) {
                    return resolve(installJavaWithBrew);
                }

                javaVersion = await this.JavaManager.getJavaVersion(mainWindow);
                if (javaVersion.error) {
                    return resolve(javaVersion);
                }
            }

            if (!javaVersion.data.replace('javac ', '').trim().startsWith('1.8')) {
                const javaVirtualMachine = await this.JavaManager.checkJavaVersionExist(mainWindow, '1.8');
                if (javaVirtualMachine.error) {
                    await this.sendListen(mainWindow, 'Trying install java!');
                    const installJavaWithBrew = await this.tryInstallJavaWithBrew(mainWindow);
                    if (installJavaWithBrew.error) {
                        return resolve(installJavaWithBrew);
                    }
                    javaVersion.data = installJavaWithBrew.data;
                } else {
                    const setJavaVersion = await this.JavaManager.setJavaVersion(mainWindow, javaVirtualMachine.data);
                    if (setJavaVersion.error) {
                        return resolve(setJavaVersion);
                    }
                    javaVersion.data = javaVirtualMachine.data;
                }
            }
            this.JAVA_VERSION = javaVersion.data;
            await this.sendListen(mainWindow, 'Java is installed! Version: ' + javaVersion.data);

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
        console.log('%c minVersion.length', 'background: #222; color: #bada55', minVersion.length);
        console.log('%c maxVersion.length', 'background: #222; color: #bada55', maxVersion.length);
        console.log('%c version.length', 'background: #222; color: #bada55', version.length);

        const len = Math.min(minVersion.length, maxVersion.length, version.length);
        //12.20
        //12.20.3
        //14.17.0
        console.log('%c len', 'background: #222; color: #bada55', len);
        for (let i = 0; i < len; i++) {
            console.log('%c version[i]', 'background: #222; color: #bada55', version[i]);
            console.log('%c maxVersion[i]', 'background: #222; color: #bada55', maxVersion[i]);
            console.log('%c minVersion[i]', 'background: #222; color: #bada55', minVersion[i]);

            if (parseInt(version[i]) < parseInt(maxVersion[i]) && parseInt(version[i]) > parseInt(minVersion[i])) {
                return 1;
            }

            if (parseInt(version[i]) > parseInt(maxVersion[i]) || parseInt(version[i]) < parseInt(minVersion[i])) {
                return -1;
            }
        }

        if (version.length > minVersion.length && version.length > maxVersion.length) {
            return 1;
        }

        if (version.length < minVersion.length && version.length < maxVersion.length) {
            return -1;
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
