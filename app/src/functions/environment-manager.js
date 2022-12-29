const { ChildProcess } = require('./child_process');
const { IonicManager } = require('./ionic-manager');
const { CordovaManager } = require('./cordova-manager');
const { BrewManager } = require('./brew-manager');
const { GradleManager } = require('./gradle-manager');
const { NodeManager } = require('./node-manager');
const { JavaManager } = require('./java-manager');
const { GitManager } = require('./git-manager');
const path = require('path');
const { SdkManager } = require('./sdk-manager');
const { XcodeManager } = require('./xcode-manager');
const { NativeRunManager } = require('./native-run-manager');
const { IosDeployManager } = require('./ios-deploy-manager');

class EnvironmentManager {
    ionicCli = new IonicManager();
    CordovaManager = new CordovaManager();
    BrewManager = new BrewManager();
    GradleManager = new GradleManager();
    NodeManager = new NodeManager();
    JavaManager = new JavaManager();
    childManager = new ChildProcess();
    gitManager = new GitManager();
    sdkManager = new SdkManager();
    xcodeManager = new XcodeManager();
    nativeRunManager = new NativeRunManager();
    iosDeployManager = new IosDeployManager();
    NodeMin = '12.22.0';
    NodeMax = '14.17.0';
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };
    environmentType = {
        brew: 'brew',
        sdk: 'sdk',
        git: 'git',
        node: 'node',
        java: 'java',
        gradle: 'gradle',
        ionic: 'ionic',
        cordova: 'cordova',
        cordovaRes: 'cordovaRes',
        xcode: 'xcode',
        nativeRun: 'nativeRun',
        iosDeploy: 'iosDeploy'
    };

    constructor() {
    }

    async environmentCheck(mainWindow, callback = () => {
    }) {
        return new Promise(async (resolve) => {
            const handleXcode = await this.handleXcode(mainWindow);
            if (handleXcode.error) {
                return resolve(handleXcode);
            }
            callback({ type: this.environmentType.xcode, data: handleXcode.data });
            const handleBrew = await this.handleBrew(mainWindow);
            if (handleBrew.error) {
                return resolve(handleBrew);
            }
            callback({ type: this.environmentType.brew, data: handleBrew.data });
            const handleJava = await this.handleJava(mainWindow);
            if (handleJava.error) {
                return resolve(handleJava);
            }
            callback({ type: this.environmentType.java, data: handleJava.data });
            const handleAndroidSdk = await this.handleAndroidSdk(mainWindow);
            if (handleAndroidSdk.error) {
                return resolve(handleAndroidSdk);
            }
            callback({ type: this.environmentType.sdk, data: handleAndroidSdk.data });
            const handleGit = await this.handleGit(mainWindow);
            if (handleGit.error) {
                return resolve(handleGit);
            }
            callback({ type: this.environmentType.git, data: handleGit.data });
            const handleNode = await this.handleNode(mainWindow);
            if (handleNode.error) {
                return resolve(handleNode);
            }
            callback({ type: this.environmentType.node, data: handleNode.data });
            const handleGradle = await this.handleGradle(mainWindow);
            if (handleGradle.error) {
                return resolve(handleGradle);
            }
            callback({ type: this.environmentType.gradle, data: handleGradle.data });
            const handleIonic = await this.handleIonic(mainWindow);
            if (handleIonic.error) {
                return resolve(handleIonic);
            }
            callback({ type: this.environmentType.ionic, data: handleIonic.data });
            const handleCordova = await this.handleCordova(mainWindow);
            if (handleCordova.error) {
                return resolve(handleCordova);
            }
            callback({ type: this.environmentType.cordova, data: handleCordova.data });
            const handleCordovaRes = await this.handleCordovaRes(mainWindow);
            if (handleCordovaRes.error) {
                return resolve(handleCordovaRes);
            }
            callback({ type: this.environmentType.cordovaRes, data: handleCordovaRes.data });
            const handleNativeRun = await this.handleNativeRun(mainWindow);
            if (handleNativeRun.error) {
                return resolve(handleNativeRun);
            }
            callback({ type: this.environmentType.nativeRun, data: handleNativeRun.data });
            const handleIosDeploy = await this.handleIosDeploy(mainWindow);
            if (handleIosDeploy.error) {
                return resolve(handleIosDeploy);
            }
            callback({ type: this.environmentType.iosDeploy, data: handleIosDeploy.data });
            return resolve({ error: false });
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
            return resolve(brewVersion);
        });
    }

    async handleAndroidSdk(mainWindow) {
        return new Promise(async (resolve) => {
            let sdkManagerVersion = await this.sdkManager.getAndroidSdkVersion(mainWindow);
            if (sdkManagerVersion.error) {
                await this.sendListen(mainWindow, 'Trying install gradle!');
                sdkManagerVersion = await this.sdkManager.installAndroidSdkWithBrew(mainWindow);
                if (sdkManagerVersion.error) {
                    return resolve(sdkManagerVersion);
                }
            }
            return resolve(sdkManagerVersion);
        });
    }

    async handleXcode(mainWindow) {
        return new Promise(async (resolve) => {
            let xcodeVersion = await this.xcodeManager.getXcodeVersion(mainWindow);
            if (xcodeVersion.error) {
                await xcodeVersion.sendListen(mainWindow, 'Trying install xcode!');
                xcodeVersion = await this.xcodeManager.installXcode(mainWindow);
                if (xcodeVersion.error) {
                    return resolve(xcodeVersion);
                }
            }
            return resolve(xcodeVersion);
        });
    }

    async handleGit(mainWindow) {
        return new Promise(async (resolve) => {
            let gitVersion = await this.gitManager.getGitVersion(mainWindow);
            if (gitVersion.error) {
                await this.sendListen(mainWindow, 'Trying install git!');
                gitVersion = await this.gitManager.installGitWithBrew(mainWindow);
                if (gitVersion.error) {
                    return resolve(gitVersion);
                }
            }
            return resolve(gitVersion);
        });
    }

    async handleNode(mainWindow) {
        return new Promise(async (resolve) => {
            let nodeVersion = await this.NodeManager.getNodeVersion(mainWindow);
            if (nodeVersion.error) {
                nodeVersion = await this.NodeManager.changeNodeVersionTo(mainWindow, this.NodeMax);
                if (nodeVersion.error) {
                    return resolve(nodeVersion);
                }
            }
            const split = nodeVersion.data.split('.');
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
            if (javaVersion.error || (!javaVersion.error && !javaVersion.data.trim().startsWith('1.8'))) {
                javaVersion = await this.tryInstallJavaWithAzul(mainWindow);
                if (javaVersion.error) {
                    return resolve(javaVersion);
                }
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

    async handleNativeRun(mainWindow) {
        return new Promise(async (resolve) => {
            let nativeRunVersion = await this.nativeRunManager.getNativeRunVersion(mainWindow);
            if (nativeRunVersion.error) {
                const installNativeRun = await this.tryInstallNativeRun(mainWindow);
                if (installNativeRun.error) {
                    return resolve(installNativeRun);
                }
                nativeRunVersion = await this.CordovaManager.getCordovaResVersion(mainWindow);
            }
            return resolve(nativeRunVersion);
        });
    }

    async handleIosDeploy(mainWindow) {
        return new Promise(async (resolve) => {
            let iosDeployVersion = await this.iosDeployManager.getIosDeployVersion(mainWindow);
            if (iosDeployVersion.error) {
                const installIosDeploy = await this.tryInstallIosDeploy(mainWindow);
                if (installIosDeploy.error) {
                    return resolve(installIosDeploy);
                }
                iosDeployVersion = await this.iosDeployManager.getIosDeployVersion(mainWindow);
            }
            return resolve(iosDeployVersion);
        });
    }


    async handleGradle(mainWindow) {
        return new Promise(async (resolve) => {
            let gradleVersion = await this.GradleManager.getGradleVersion(mainWindow);
            if (gradleVersion.error) {
                await this.sendListen(mainWindow, 'Trying install gradle!');
                gradleVersion = await this.tryInstallGradleWithManually(mainWindow);
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

    async tryInstallJavaWithAzul(mainWindow) {
        return new Promise(async (resolve) => {
            const installJavaWithBrew = await this.JavaManager.installJavaWithAzulSettings(mainWindow, '1.8');
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

    async tryInstallNativeRun(mainWindow) {
        return new Promise(async (resolve) => {
            const installNativeRun = await this.nativeRunManager.installNativeRun(mainWindow);
            return resolve(installNativeRun);
        });
    }

    async tryInstallIosDeploy(mainWindow) {
        return new Promise(async (resolve) => {
            const installIosDeploy = await this.iosDeployManager.installIosDeploy(mainWindow);
            return resolve(installIosDeploy);
        });
    }

    async tryInstallGradleWithManually(mainWindow) {
        return new Promise(async (resolve) => {
            const installGradle = await this.GradleManager.installGradleManually(mainWindow);
            return resolve(installGradle);
        });
    }

    compareVersions(version, minVersion, maxVersion) {
        const [minMajor, minMinor = 0, minPatch = 0] = minVersion.map(Number);
        const [curMajor, curMinor = 0, curPatch = 0] = version.map(Number);
        const [maxMajor, maxMinor = 0, maxPatch = 0] = maxVersion.map(Number);

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


module.exports = { EnvironmentManager };
