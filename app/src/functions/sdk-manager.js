const { ChildProcess } = require('./child_process');
const path = require('path');
const { app } = require('electron');

class SdkManager {
    childManager = new ChildProcess();
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {
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

    async setSdkVersion(mainWindow, java_version) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Paths is exporting!', this.consoleType.info);
            let setAndroidSdkManager = await this.childManager.executeCommand(
                mainWindow,
                `echo 'export ANDROID_SDK_ROOT=$HOME/homebrew/share/android-commandlinetools
export ANDROID_HOME=$HOME/homebrew/share/android-commandlinetools
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/tools
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/tools/bin
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
export PATH=$PATH:$ANDROID_SDK_ROOT/build-tools
export PATH=$PATH:$ANDROID_SDK_ROOT/build-tools/31.0.0
export PATH=$PATH:$ANDROID_SDK_ROOT/emulator
export PATH=$PATH:$ANDROID_SDK_ROOT/tools
export PATH=$PATH:$ANDROID_SDK_ROOT/tools/bin
export PATH=$PATH:$ANDROID_SDK_ROOT/platforms/android-21' >> ~/.zprofile`,
                null,
                'When try to export paths. Something get wrong!'
            );
            if (setAndroidSdkManager.error) {
                return resolve(setAndroidSdkManager);
            }
            await this.sendListen(mainWindow, 'Paths is exporting!', this.consoleType.info);

            setAndroidSdkManager = await this.childManager.executeCommand(
                mainWindow,
                `echo 'export ANDROID_SDK_ROOT=$HOME/homebrew/share/android-commandlinetools
export ANDROID_HOME=$HOME/homebrew/share/android-commandlinetools
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/tools
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/tools/bin
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
export PATH=$PATH:$ANDROID_SDK_ROOT/build-tools
export PATH=$PATH:$ANDROID_SDK_ROOT/build-tools/31.0.0
export PATH=$PATH:$ANDROID_SDK_ROOT/emulator
export PATH=$PATH:$ANDROID_SDK_ROOT/tools
export PATH=$PATH:$ANDROID_SDK_ROOT/tools/bin
export PATH=$PATH:$ANDROID_SDK_ROOT/platforms/android-21' >> ~/.szshrc`,
                null,
                'When try to export paths. Something get wrong!'
            );

            await this.childManager.executeCommand(
                mainWindow,
                `cd ${ app.getPath('home') }/homebrew/share/android-commandlinetools/build-tools/31.0.0 && mv d8 dx && cd lib && mv d8.jar dx.jar`,
                null,
                'When try to export fix. Something get wrong!'
            );

            return resolve(setAndroidSdkManager);
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
                'When try to except licenses. Something get wrong!'
            );
            return resolve(brewTabCask);
        });
    }

    async installAndroidSdkWithBrew(mainWindow) {
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

            await this.sendListen(mainWindow, 'This will take a while! Dont close the app!', this.consoleType.info);
            const downloadSdkManager = await this.childManager.executeCommand(
                mainWindow,
                `echo yes | sdkmanager "platform-tools" \\
       "platforms;android-31" \\
       "build-tools;31.0.0" \\
       "system-images;android-21;google_apis;armeabi-v7a" \\
       "sources;android-31"`,
                null,
                'When try to install SDK MANAGER. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: true,
                    endError: true,
                    info: true
                }
            );
            console.log('%c downloadSdkManager', 'background: #222; color: #bada55', downloadSdkManager);
            const setSdkVersion = await this.setSdkVersion(mainWindow);
            if (setSdkVersion.error) {
                return resolve(setSdkVersion);
            }
            const androidSdkManagerVersion = await this.getAndroidSdkVersion(mainWindow);
            if (androidSdkManagerVersion.error) {
                return resolve(androidSdkManagerVersion);
            }
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
