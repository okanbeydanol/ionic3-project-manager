const { ChildProcess } = require('./child_process');
const { app } = require('electron');
const { ZshrcManager } = require('./zshrc-manager');
const { FsManager } = require('./fs-manager');

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
                'sdkmanager  --list | awk \'/Available/{flag=1; next} /Installed/{flag=0} flag\'',
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
                'sdkmanager  --list | awk \'/Available/{flag=1; next} /Installed/{flag=0} flag\'',
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

    async exportSystemImages(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying export platforms to ~/.zprofile!', this.consoleType.info);
            await this.childManager.executeCommand(
                mainWindow,
                `echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/system-images/android-21' >> ~/.zprofile`,
                null,
                'When try to export system images to ~/.zprofile. Something get wrong!'
            );

            await this.sendListen(mainWindow, 'Trying export platforms to ~/.szshrc!', this.consoleType.info);
            await this.childManager.executeCommand(
                mainWindow,
                `echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/system-images/android-21' >> ~/.szshrc`,
                null,
                'When try to export system images to ~/.szshrc. Something get wrong!'
            );
            return resolve({ error: false, data: false });
        });
    }

    async getAndroidToolsVersions(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking android tools versions!', this.consoleType.info);
            const androidToolsVersion = await this.childManager.executeCommand(
                mainWindow,
                'sdkmanager  --list | awk \'/Installed/{flag=1; next} /Available/{flag=0} flag\'',
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
        buildTools: '31.0.0',
        platforms: 'android-31'
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

            const installSystemImages = await this.childManager.executeCommand(
                mainWindow,
                `echo yes | sdkmanager "system-images;android-21;google_apis;armeabi-v7a"`,
                null,
                'When try to install system images. Something get wrong!', () => {
                }, {
                    command: true,
                    liveOutput: false,
                    endOutput: false,
                    endError: true,
                    info: true
                }
            );

            const checkExportedSystemImagesVersionAndRemove = await this.checkExportedSystemImagesVersionAndRemove(mainWindow);
            if (checkExportedSystemImagesVersionAndRemove.error) {
                return resolve(checkExportedSystemImagesVersionAndRemove);
            }

            const exportSystemImages = await this.exportSystemImages(mainWindow);
            if (exportSystemImages.error) {
                return resolve(exportSystemImages);
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
