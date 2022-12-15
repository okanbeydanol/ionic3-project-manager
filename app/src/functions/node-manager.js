const {ChildProcess} = require('./child_process');
const {BrewManager} = require('./brew-manager');
const {app} = require('electron');
const {dialog} = require('electron')

class NodeManager {
    BrewManager = new BrewManager();
    childManager = new ChildProcess();
    consoleType = {
        command: "command",
        output: "output",
        error: "error",
        info: "info"
    }

    constructor() {
    }

    async getNodeVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Node version!', this.consoleType.info);
            const nodeVersion = await this.childManager.executeCommand(
                mainWindow,
                'node -v',
                'eval "$(~/homebrew/bin/brew shellenv)"&&export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                'You do not have a Node version installed on your computer.'
            );
            return resolve(nodeVersion);
        });
    }

    async getNvmVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Nvm version!', this.consoleType.info);
            const nvmVersion = await this.childManager.executeCommand(
                mainWindow,
                'nvm -v',
                'eval "$(~/homebrew/bin/brew shellenv)"&&export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                'You do not have a NVM version installed on your computer.'
            );
            return resolve(nvmVersion);
        });
    }

    async installNvm(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying to install NVM!', this.consoleType.info);
            let wgetVersion = await this.wgetVersion(mainWindow);
            if (wgetVersion.error) {
                const installWgetWithBrew = await this.installWgetWithBrew(mainWindow);
                if (installWgetWithBrew.error) {
                    return resolve(installWgetWithBrew);
                }

                wgetVersion = await this.wgetVersion(mainWindow);
                if (wgetVersion.error) {
                    return resolve(wgetVersion);
                }
            }
            await this.sendListen(mainWindow, 'Nvm is installing!', this.consoleType.info);
            const installNvm = await this.childManager.executeCommand(
                mainWindow,
                'wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash',
                null,
                'When try to install Nvm. Something get wrong!'
            );
            return resolve(installNvm);
        });
    }

    async installWgetWithBrew(mainWindow) {
        return new Promise(async (resolve) => {
            let brewVersion = await this.BrewManager.getBrewVersion(mainWindow);
            if (brewVersion.error) {
                const installBrew = await this.BrewManager.installBrew(mainWindow)
                if (installBrew.error) {
                    return resolve(installBrew);
                }
                brewVersion = await this.BrewManager.getBrewVersion(mainWindow);
                if (brewVersion.error) {
                    return resolve(installBrew);
                }
            }
            await this.sendListen(mainWindow, 'Wget is installing!', this.consoleType.info);
            const installWget = await this.childManager.executeCommand(
                mainWindow,
                'brew install wget',
                'eval "$(~/homebrew/bin/brew shellenv)"',
                'When try to install Wget with Homebrew. Something get wrong!'
            );
            return resolve(installWget);
        });
    }

    async wgetVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Wget version!', this.consoleType.info);
            const wgetVersion = await this.childManager.executeCommand(
                mainWindow,
                'wget -V',
                null,
                'You do not have a Wget version installed on your computer.'
            );
            return resolve(wgetVersion);
        });
    }


    async installNode(mainWindow, node_version) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Node is installing!', this.consoleType.info);
            const installNode = await this.childManager.executeCommand(
                mainWindow,
                'nvm install  --default ' + node_version + '&&nvm use ' + node_version + '&&nvm alias default ' + node_version,
                'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                'When try to install Node. Something get wrong!'
            );
            return resolve(installNode);
        });
    }


    async exportNvmDirToProfile(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Nvm is exporting!', this.consoleType.info);
            const installWget = await this.childManager.executeCommand(
                mainWindow,
                `echo 'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"' >> ~/.zprofile`,
                null,
                'When try to export Nvm. Something get wrong!'
            );
            return resolve(installWget);
        });

    }

    async setNodeVersionWithNvm(mainWindow, node_version) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Nvm is exporting!', this.consoleType.info);
            const setNodeVersion = await this.childManager.executeCommand(
                mainWindow,
                'nvm use ' + node_version + '&&nvm alias default ' + node_version,
                'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                'When try to export set Node with nvm. Something get wrong!'
            );
            return resolve(setNodeVersion);
        });

    }

    async removeNodes(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Removing Node versions!', this.consoleType.info);
            const removeNodes = await this.childManager.executeCommand(
                mainWindow,
                'rm -rf ~/.nvm/versions/node/*',
                'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"&&nvm deactivate',
                'When try to remove ~/.nvm/versions/node/* folder. Something get wrong!'
            );
            return resolve(removeNodes);
        });
    }

    async sendListen(mainWindow, text, error = false, type = null) {
        return new Promise(async (resolve) => {
            mainWindow.webContents.send('command:listen', {
                data: text,
                error: error,
                type: type
            });
            resolve(true);
        });
    }

    async cacheClearNvm(mainWindow, node_version) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Clear nvm cache!', this.consoleType.info);
            const cacheClearNvm = await this.childManager.executeCommand(
                mainWindow,
                'nvm cache clear',
                'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"',
                'When try to clear cache. Something get wrong!'
            );
            return resolve(cacheClearNvm);
        });
    }


    async changeNodeVersionTo(mainWindow, node_version) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying install Node with nvm!', this.consoleType.info);
            const removeNodes = await this.removeNodes(mainWindow);
            if (removeNodes.error) {
                return resolve(removeNodes);
            }
            let nvmVersion = await this.getNvmVersion(mainWindow);
            if (nvmVersion.error) {
                const installNvm = await this.installNvm(mainWindow);
                if (installNvm.error) {
                    return resolve(installNvm);
                }
                nvmVersion = await this.getNvmVersion(mainWindow);
                if (nvmVersion.error) {
                    return resolve(nvmVersion);
                }
                const exportNvm = await this.exportNvmDirToProfile(mainWindow);
                if (exportNvm.error) {
                    return resolve(exportNvm);
                }
            }
            const installNode = await this.installNode(mainWindow, node_version);
            if (installNode.error) {
                return resolve(installNode);
            }
            const setNodeVersionWithNvm = await this.setNodeVersionWithNvm(mainWindow, node_version);
            if (setNodeVersionWithNvm.error) {
                return resolve(setNodeVersionWithNvm);
            }
            let cacheClearNvm = await this.cacheClearNvm(mainWindow);
            if (cacheClearNvm.error) {
                return resolve(cacheClearNvm);
            }

            let nodeVersion = await this.getNodeVersion(mainWindow);
            if (nodeVersion.error) {
                return resolve(nodeVersion);
            }
            await this.sendListen(mainWindow, 'Node install successfully!', this.consoleType.info);
            return resolve(nodeVersion);

        });
    }
}


module.exports = {NodeManager};
