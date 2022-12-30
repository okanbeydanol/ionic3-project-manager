const { ChildProcess } = require('./child_process');
const { BrewManager } = require('./brew-manager');

class GitManager {
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

    async getGitVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking git version!', this.consoleType.info);
            const gitVersion = await this.childManager.executeCommand(
                mainWindow,
                'git --version',
                null,
                'You do not have a git version installed on your computer.'
            );
            if (!gitVersion.error) {
                gitVersion.data = gitVersion.data.trim().split(' ')[2].trim();
            }
            return resolve(gitVersion);
        });
    }

    async installGitWithBrew(mainWindow) {
        return new Promise(async (resolve) => {
            let brewVersion = await this.brewManager.getBrewVersion(mainWindow);
            if (brewVersion.error) {
                const installBrew = await this.brewManager.installBrew(mainWindow);
                if (installBrew.error) {
                    return resolve(installBrew);
                }
                brewVersion = await this.brewManager.getBrewVersion(mainWindow);
                return resolve(brewVersion);
            }
            await this.sendListen(mainWindow, 'Trying to install Git!', this.consoleType.info);
            const installGit = await this.childManager.executeCommand(
                mainWindow,
                'brew reinstall git',
                null,
                'When try to install git. Something get wrong!'
            );
            if (installGit.error) {
                return resolve(installGit);
            }
            const gitVersion = await this.getGitVersion(mainWindow);
            return resolve(gitVersion);
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


module.exports = { GitManager };
