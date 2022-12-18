const {ChildProcess} = require('./child_process');

class GradleManager {
    childManager = new ChildProcess();
    consoleType = {
        command: "command",
        output: "output",
        error: "error",
        info: "info"
    }

    constructor() {
    }

    async getGradleVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Gradle version!', this.consoleType.info);
            const brewVersion = await this.childManager.executeCommand(
                mainWindow,
                'gradle -v',
                'eval "$(~/homebrew/bin/brew shellenv)"',
                'You do not have a Gradle version installed on your computer.'
            );
            if (brewVersion.error) {
                return resolve(brewVersion);
            }
            brewVersion.data = new RegExp(/(\/*Gradle \S+\/*)/).exec(brewVersion.data.trim())[0].split('Gradle ')[1]
            return resolve(brewVersion);
        });
    }

    async installGradle(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Homebrew is updating.', this.consoleType.info);
            const updateBrew = await this.childManager.executeCommand(
                mainWindow,
                'brew reinstall gradle --force',
                'eval "$(~/homebrew/bin/brew shellenv)"',
                'When try to install Gradle. Something get wrong!'
            );
            return resolve(updateBrew);
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


module.exports = {GradleManager};
