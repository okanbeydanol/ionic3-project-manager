const { ChildProcess } = require('./child_process');

class BrewManager {
    childManager = new ChildProcess();
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {
    }

    async getBrewVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Homebrew version!', this.consoleType.info);
            const brewVersion = await this.childManager.executeCommand(
                mainWindow,
                'brew -v',
                null,
                'You do not have a Brew version installed on your computer.'
            );
            if (!brewVersion.error) {
                brewVersion.data = new RegExp(/(\/*Homebrew \S+\/*)/).exec(brewVersion.data.trim())[0].split(' ')[1].trim();
            }
            return resolve(brewVersion);
        });
    }

    async updateBrew(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Homebrew is updating.', this.consoleType.info);
            const updateBrew = await this.childManager.executeCommand(
                mainWindow,
                'chmod -R go-w "$(brew --prefix)/completions/zsh"&&brew update --force',
                null,
                'When try to update Homebrew. Something get wrong!'
            );
            return resolve(updateBrew);
        });
    }

    async cloneBrew(mainWindow) {
        return new Promise(async (resolve) => {
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

    async cloneBrewSettings(mainWindow, value) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Homebrew is cloning from github.', this.consoleType.info);
            const cloneBrew = await this.childManager.executeCommand(
                mainWindow,
                'git clone -b ' + value + ' https://github.com/Homebrew/brew.git ~/homebrew',
                null,
                'When try to clone Homebrew from github. Something get wrong!'
            );
            return resolve(cloneBrew);
        });
    }

    async brewTapCask(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Tapping Homebrew casks!', this.consoleType.info);
            const brewTabCask = await this.childManager.executeCommand(
                mainWindow,
                'brew tap homebrew/cask',
                null,
                'When try to tapping brew cask. Something get wrong!'
            );
            return resolve(brewTabCask);
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

    async exportBrewEcho(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Exporting Homebrew to ~/.zprofile.', this.consoleType.info);
            const exportBrew = await this.childManager.executeCommand(
                mainWindow,
                `echo 'eval "$(~/homebrew/bin/brew shellenv)"' >> ~/.zprofile`,
                null,
                'When try to export Homebrew to ~/.zprofile. Something get wrong!'
            );
            await this.sendListen(mainWindow, 'Exporting Homebrew to ~/.szshrc.', this.consoleType.info);
            const exportBrewZshrc = await this.childManager.executeCommand(
                mainWindow,
                `echo 'eval "$(~/homebrew/bin/brew shellenv)"' >> ~/.szshrc`,
                null,
                'When try to export Homebrew to ~/.szshrc. Something get wrong!'
            );
            return resolve(exportBrewZshrc);
        });
    }

    async installBrewSettings(mainWindow, value) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying install Homebrew!', this.consoleType.info);
            const removeFolder = await this.removeFolder(mainWindow);
            if (removeFolder.error) {
                return resolve(removeFolder);
            }
            const createFolder = await this.createFolder(mainWindow);
            if (createFolder.error) {
                return resolve(createFolder);
            }
            const cloneBrew = await this.cloneBrewSettings(mainWindow, value);
            if (cloneBrew.error) {
                return resolve(cloneBrew);
            }
            const exportBrewEcho = await this.exportBrewEcho(mainWindow);
            if (exportBrewEcho.error) {
                return resolve(exportBrewEcho);
            }
            const updateBrew = await this.updateBrew(mainWindow);
            if (updateBrew.error) {
                return resolve(updateBrew);
            }
            const brewTapCask = await this.brewTapCask(mainWindow);
            if (brewTapCask.error) {
                return resolve(brewTapCask);
            }
            await this.sendListen(mainWindow, 'Homebrew install successfully.', this.consoleType.info);
            return resolve(updateBrew);
        });
    }

    async installBrew(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying install Homebrew!', this.consoleType.info);
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
            const exportBrewEcho = await this.exportBrewEcho(mainWindow);
            if (exportBrewEcho.error) {
                return resolve(exportBrewEcho);
            }
            const updateBrew = await this.updateBrew(mainWindow);
            if (updateBrew.error) {
                return resolve(updateBrew);
            }
            const brewTapCask = await this.brewTapCask(mainWindow);
            if (brewTapCask.error) {
                return resolve(brewTapCask);
            }
            await this.sendListen(mainWindow, 'Homebrew install successfully.', this.consoleType.info);
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


module.exports = { BrewManager };
