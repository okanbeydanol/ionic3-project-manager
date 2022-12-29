const { ChildProcess } = require('./child_process');
const { BrewManager } = require('./brew-manager');

class NativeRunManager {
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

    async getNativeRunVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking native-run version!', this.consoleType.info);
            const nativeRunVersion = await this.childManager.executeCommand(
                mainWindow,
                'native-run --version',
                null,
                'You do not have a native-run version installed on your computer.'
            );
            return resolve(nativeRunVersion);
        });
    }

    async installNativeRun(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying to install native-run!', this.consoleType.info);
            const nativeRunVersion = await this.childManager.executeCommand(
                mainWindow,
                'unset npm_config_prefix&&npm install -g native-run',
                null,
                'When try to install native-run. Something get wrong!'
            );
            return resolve(nativeRunVersion);
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


module.exports = { NativeRunManager };
