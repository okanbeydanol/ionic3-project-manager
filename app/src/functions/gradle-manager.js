const { ChildProcess } = require('./child_process');

class GradleManager {
    childManager = new ChildProcess();
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

    async installGradleManually(mainWindow) {
        return new Promise(async (resolve) => {
            const mkdir = await this.childManager.executeCommand(
                mainWindow,
                'echo "oksn1234" | sudo -S -k mkdir -p /opt/gradle',
                null,
                'When try to install Nvm. Something get wrong!'
            );
            console.log('%c mkdir', 'background: #222; color: #bada55', mkdir);

            if (mkdir.error && mkdir.data.includes('Password:Sorry')) {
                console.log('%c PASSWORD IS WRONG!!!!', 'background: #222; color: #bada55', mkdir);
            }

            const download = await this.childManager.executeCommand(
                mainWindow,
                'echo "oksn1234" | sudo -S -k curl -L https://services.gradle.org/distributions/gradle-6.9-bin.zip --output /opt/gradle/gradle-6.9-bin.zip',
                null,
                'When try to install Nvm. Something get wrong!'
            );
            console.log('%c download', 'background: #222; color: #bada55', download);

            const unzip = await this.childManager.executeCommand(
                mainWindow,
                'echo "oksn1234" | sudo -S -k unzip -qq /opt/gradle/gradle-6.9-bin.zip -d /opt/gradle',
                null,
                'When try to install Nvm. Something get wrong!'
            );
            console.log('%c unzip', 'background: #222; color: #bada55', unzip);

            const remove = await this.childManager.executeCommand(
                mainWindow,
                'echo "oksn1234" | sudo -S -k rm -rf /opt/gradle/gradle-6.9-bin.zip',
                null,
                'When try to install Nvm. Something get wrong!'
            );

            const setGradleVersion = await this.setGradleVersion(mainWindow, '6.9');
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
