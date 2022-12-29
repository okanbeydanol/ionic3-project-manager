const {ChildProcess} = require('./child_process');

class IonicManager {
    childManager = new ChildProcess();
    consoleType = {
        command: "command",
        output: "output",
        error: "error",
        info: "info"
    }

    constructor() {
    }

    async getIonicVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Ionic version!', this.consoleType.info);
            const ionicVersion = await this.childManager.executeCommand(
                mainWindow,
                'ionic -v',
                null,
                'You do not have a Ionic version installed on your computer.'
            );
            return resolve(ionicVersion);
        });
    }

    async getIonicInfo(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking ionic info version!', this.consoleType.info);
            const ionicVersion = await this.childManager.executeCommand(
                mainWindow,
                'ionic info --json',
                null,
                'When try to get ionic info. Something get wrong!'
            );
            return resolve(ionicVersion);
        });
    }

    async installIonic(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying to install ionic!', this.consoleType.info);
            const ionicVersion = await this.childManager.executeCommand(
                mainWindow,
                'unset npm_config_prefix&&npm install -g @ionic/cli',
                null,
                'When try to install ionic. Something get wrong!'
            );
            return resolve(ionicVersion);
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


module.exports = {IonicManager};
