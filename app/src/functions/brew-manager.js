const {ChildProcess} = require('./child_process');

class BrewManager {
    childManager = new ChildProcess();
    consoleType = {
        command: "command",
        output: "output",
        error: "error",
        info: "info"
    }

    constructor() {
    }


    async getBrewVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Homebrew version!', this.consoleType.info);
            const brewVersion = await this.childManager.executeCommand(
                mainWindow,
                'brew -v',
                'eval "$(~/homebrew/bin/brew shellenv)"',
                'You do not have a Brew version installed on your computer.'
            );
            return resolve(brewVersion);
        });
    }

    async installBrew(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying install Homebrew!', this.consoleType.info);
            const checkPermission = await this.checkPermission(mainWindow);
            if (checkPermission.error) {
                return resolve(checkPermission);
            }
            const removeFolder = await this.removeFolder(mainWindow);
            if (removeFolder.error) {
                return resolve(removeFolder);
            }
            const createFolder = await this.createFolder(mainWindow);
            if (createFolder.error) {
                return resolve(createFolder);
            }
            const cloneBrew = await this.cloneBrew(mainWindow);
            if (cloneBrew.error) {
                return resolve(cloneBrew);
            }
            const updateBrew = await this.updateBrew(mainWindow);
            if (updateBrew.error) {
                return resolve(updateBrew);
            }
            const exportBrewEcho = await this.exportBrewEcho(mainWindow);
            if (exportBrewEcho.error) {
                return resolve(exportBrewEcho);
            }
            await this.sendListen(mainWindow, 'Homebrew install successfully.', this.consoleType.info);
            return resolve(updateBrew);
        });
    }

    async updateBrew(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Homebrew is updating.', this.consoleType.info);
            const updateBrew = await this.childManager.executeCommand(
                mainWindow,
                'brew update --force&&chmod -R go-w "$(brew --prefix)/share/zsh"',
                'eval "$(homebrew/bin/brew shellenv)"',
                'When try to update Homebrew. Something get wrong!'
            );
            return resolve(updateBrew);
        });
    }

    async cloneBrew(mainWindow) {
        return new Promise(async (resolve) => {
            //todo add git manager to download git
            await this.sendListen(mainWindow, 'Homebrew is cloning from github.', this.consoleType.info);
            const cloneBrew = await this.childManager.executeCommand(
                mainWindow,
                'git clone -q --verbose https://github.com/Homebrew/brew ~/homebrew',
                null,
                'When try to clone Homebrew from github. Something get wrong!'
            );
            return resolve(cloneBrew);
        });
    }

    async removeFolder(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Removing ~/homebrew folder!', this.consoleType.info);
            const removeFolder = await this.childManager.executeCommand(
                mainWindow,
                'rm -rf ~/homebrew',
                null,
                'When try to remove ~/homebrew folder. Something get wrong!'
            );
            return resolve(removeFolder);
        });
    }

    async createFolder(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Creating ~/homebrew folder!', this.consoleType.info);
            const createFolder = await this.childManager.executeCommand(
                mainWindow,
                'mkdir ~/homebrew',
                null,
                'When try to create ~/homebrew folder. Something get wrong!'
            );
            return resolve(createFolder);
        });
    }


    async checkPermission(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking ~/homebrew folder permission!', this.consoleType.info);
            const checkPermission = await this.childManager.executeCommand(
                mainWindow,
                'chmod u+rwx ~/homebrew',
                null,
                'You do not have permission to access ~/homebrew folder.'
            );
            return resolve(checkPermission);
        });
    }

    async exportBrewEcho(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Exporting Homebrew to ~/.zprofile.', this.consoleType.info);
            const exportBrew = await this.childManager.executeCommand(
                mainWindow,
                'git clone -q --verbose https://github.com/Homebrew/brew ~/homebrew',
                null,
                'When try to export Homebrew to ~/.zprofile. Something get wrong!'
            );
            return resolve(exportBrew);
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


module.exports = {BrewManager};
