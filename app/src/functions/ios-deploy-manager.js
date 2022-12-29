const { ChildProcess } = require('./child_process');
const { BrewManager } = require('./brew-manager');

class IosDeployManager {
    childManager = new ChildProcess();
    brewManager = new BrewManager();
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {
    }

    async getIosDeployVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking ios-deploy version!', this.consoleType.info);
            const iosDeployVersion = await this.childManager.executeCommand(
                mainWindow,
                'ios-deploy --version',
                null,
                'You do not have a ios-deploy version installed on your computer.'
            );
            return resolve(iosDeployVersion);
        });
    }

    async installIosDeploy(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying to install ios-deploy!', this.consoleType.info);
            const iosDeployVersion = await this.childManager.executeCommand(
                mainWindow,
                'unset npm_config_prefix&&npm install -g ios-deploy',
                null,
                'When try to install ios-deploy. Something get wrong!'
            );
            return resolve(iosDeployVersion);
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


module.exports = { IosDeployManager };
