const { ChildProcess } = require('./child_process');

class XcodeManager {
    childManager = new ChildProcess();
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {
    }

    async getXcodeVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking git version!', this.consoleType.info);
            const xcodeVersion = await this.childManager.executeCommand(
                mainWindow,
                '/usr/bin/xcodebuild -version',
                null,
                'You do not have a xcode version installed on your computer.'
            );
            if (!xcodeVersion.error) {
                xcodeVersion.data = new RegExp(/(\/*Xcode \S+\/*)/).exec(xcodeVersion.data.trim())[0].split(' ')[1].trim();
            }
            return resolve(xcodeVersion);
        });
    }

    async installXcode(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying to install Xcode!', this.consoleType.info);
            const installXcode = await this.childManager.executeCommand(
                mainWindow,
                'xcode-select --install',
                null,
                'When try to install xcode. Something get wrong!'
            );
            if (installXcode.error) {
                return resolve(installXcode);
            }
            const xcodeVersion = await this.getXcodeVersion(mainWindow);
            return resolve(xcodeVersion);
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


module.exports = { XcodeManager };
