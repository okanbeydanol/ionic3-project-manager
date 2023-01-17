const { ChildProcess } = require('./child_process');
const { PasswordManager } = require('./password-manager');
const { ZshrcManager } = require('./zshrc-manager');
const { FsManager } = require('./fs-manager');

class GradleManager {
    childManager = new ChildProcess();
    passwordManager = new PasswordManager();
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

    async getGradleVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Gradle version!', this.consoleType.info);
            const gradleVersion = await this.childManager.executeCommand(
                mainWindow,
                'gradle -v',
                null,
                'You do not have a Gradle version installed on your computer.'
            );
            if (!gradleVersion.error) {
                gradleVersion.data = new RegExp(/(\/*Gradle \S+\/*)/).exec(gradleVersion.data.trim())[0].split('Gradle ')[1];
            }
            return resolve(gradleVersion);
        });
    }

    async installGradleManually(mainWindow, value = '6.5') {
        return new Promise(async (resolve) => {

            await this.sendListen(mainWindow, 'Trying to fetch all gradle versions!', this.consoleType.info);
            const downloadJson = await this.childManager.executeCommand(
                mainWindow,
                'curl -s "https://services.gradle.org/versions/all"',
                null,
                'When try to fetch about latest build json information. Something get wrong!'
            );
            if (downloadJson.error) {
                return resolve(downloadJson);
            }
            const data = JSON.parse(downloadJson.data);
            let find = data.find(o => o.version === value);
            if (!find) {
                find = data.find(o => o.version.includes(value));
                if (!find) {
                    return resolve({ error: true, data: null, message: 'Gradle version doesnt exist' });
                }
                await this.sendListen(mainWindow, 'You specified version doesnt exist. We found this instead: ' + find.version, this.consoleType.info);
            }

            if (find.broken) {
                return resolve({
                    error: true,
                    data: null,
                    message: 'Gradle version is broken. Choose different version'
                });
            }

            const gradleJsonVersion = find.version;
            const gradleJsonDownloadURL = find.downloadUrl;


            await this.sendListen(mainWindow, 'Trying prompt computer password!', this.consoleType.info);
            const password = await this.passwordManager.getUserPassword(mainWindow, false);

            await this.sendListen(mainWindow, 'Trying create /opt/gradle folder!', this.consoleType.info);
            const mkdir = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k mkdir -p /opt/gradle',
                null,
                'When try to create /opt/gradle folder. Something get wrong!'
            );

            if (mkdir.error) {
                await this.sendListen(mainWindow, 'Password is wrong!!!  Terminal will prompt the password if you run it again!', this.consoleType.info);
                return mkdir.message.includes('Password:Sorry') ? await this.passwordManager.getUserPassword(mainWindow, true) : resolve(mkdir);
            }
            console.log('%c mkdir', 'background: #222; color: #bada55', mkdir);

            await this.sendListen(mainWindow, 'Trying download gradle-' + gradleJsonVersion + '-bin.zip!', this.consoleType.info);
            const download = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k curl -L ' + gradleJsonDownloadURL + ' --output /opt/gradle/gradle-' + gradleJsonVersion + '-bin.zip',
                null,
                'When try to download gradle-' + gradleJsonVersion + '-bin.zip. Something get wrong!'
            );
            console.log('%c download', 'background: #222; color: #bada55', download);

            await this.sendListen(mainWindow, 'Trying unzip gradle-' + gradleJsonVersion + '-bin.zip!', this.consoleType.info);
            const unzip = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k unzip -qq /opt/gradle/gradle-' + gradleJsonVersion + '-bin.zip -d /opt/gradle',
                null,
                'When try to unzip gradle-' + gradleJsonVersion + '-bin.zip. Something get wrong!'
            );
            console.log('%c unzip', 'background: #222; color: #bada55', unzip);

            await this.sendListen(mainWindow, 'Trying remove gradle-' + gradleJsonVersion + '-bin.zip!', this.consoleType.info);
            const remove = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k rm -rf /opt/gradle/gradle-' + gradleJsonVersion + '-bin.zip',
                null,
                'When try to remove gradle-' + gradleJsonVersion + '-bin.zip. Something get wrong!'
            );
            console.log('%c remove', 'background: #222; color: #bada55', remove);

            const checkAnySetGradleVersionAndRemove = await this.checkAnySetGradleVersionAndRemove(mainWindow);
            if (checkAnySetGradleVersionAndRemove.error) {
                return resolve(checkAnySetGradleVersionAndRemove);
            }

            const setGradleVersion = await this.setGradleVersion(mainWindow, gradleJsonVersion);
            if (setGradleVersion.error) {
                return resolve(setGradleVersion);
            }
            const gradleVersion = await this.getGradleVersion(mainWindow);
            if (gradleVersion.error) {
                return resolve(gradleVersion);
            }
            return resolve(gradleVersion);
        });
    }

    async checkAnySetGradleVersionAndRemove(mainWindow) {
        return new Promise(async (resolve) => {
            const regex = /(\/*export PATH=\$PATH:\/opt\/gradle\/gradle-\S+\/bin\/*)/g;
            await this.sendListen(mainWindow, 'Trying to check any set gradle version exist and remove!', this.consoleType.info);
            let zshrcContent = await this.zshrcManager.getZshrcContent();
            if (zshrcContent.error) {
                return resolve(zshrcContent);
            }
            const match = regex.exec(zshrcContent.data);
            if (match) {
                await this.sendListen(mainWindow, 'Exported Gradle Found! Removing: ' + match[0], this.consoleType.info);
                zshrcContent.data = zshrcContent.data.replace(match[0], '');
                const writeFile = await this.fsManager.writeFile(this.zshrcManager.getZshrcPath(), zshrcContent.data);
                if (writeFile.error) {
                    return resolve(writeFile);
                }
            }
            return resolve({ data: false, error: false });
        });
    }

    async setGradleVersion(mainWindow, gradle_version) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Gradle is exporting to ~/.zprofile file!', this.consoleType.info);
            let setGradleVersion = await this.childManager.executeCommand(
                mainWindow,
                `echo 'export PATH=$PATH:/opt/gradle/gradle-${ gradle_version }/bin' >> ~/.zprofile`,
                null,
                'When try to export Java version to ~/.zprofile file. Something get wrong!'
            );
            if (setGradleVersion.error) {
                return resolve(setGradleVersion);
            }
            await this.sendListen(mainWindow, 'Gradle is exporting to ~/.szshrc file!', this.consoleType.info);
            setGradleVersion = await this.childManager.executeCommand(
                mainWindow,
                `echo 'export PATH=$PATH:/opt/gradle/gradle-${ gradle_version }/bin' >> ~/.szshrc`,
                null,
                'When try to export Gradle version to ~/.szshrc file. Something get wrong!'
            );

            return resolve(setGradleVersion);
        });
    }

    async installGradle(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Homebrew is updating.', this.consoleType.info);
            const updateBrew = await this.childManager.executeCommand(
                mainWindow,
                'brew reinstall gradle --force',
                null,
                'When try to install Gradle. Something get wrong!'
            );
            if (updateBrew.error) {
                return resolve(updateBrew);
            }
            const gradleVersion = await this.getGradleVersion(mainWindow);
            if (gradleVersion.error) {
                return resolve(gradleVersion);
            }
            return resolve(gradleVersion);
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


module.exports = { GradleManager };
