const { ChildProcess } = require('./child_process');
const { BrewManager } = require('./brew-manager');

class NodeManager {
    BrewManager = new BrewManager();
    childManager = new ChildProcess();
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {
    }

    async getNodeVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Node version!', this.consoleType.info);
            const nodeVersion = await this.childManager.executeCommand(
                mainWindow,
                'node -v',
                null,
                'You do not have a Node version installed on your computer.'
            );
            if (!nodeVersion.error) {
                nodeVersion.data = nodeVersion.data.trim().replace('v', '');
            }
            return resolve(nodeVersion);
        });
    }

    async getNvmVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Nvm version!', this.consoleType.info);
            const nvmVersion = await this.childManager.executeCommand(
                mainWindow,
                'nvm -v',
                null,
                'You do not have a NVM version installed on your computer.'
            );
            return resolve(nvmVersion);
        });
    }

    async installNvm(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Nvm is installing!', this.consoleType.info);
            const installNvm = await this.childManager.executeCommand(
                mainWindow,
                'curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash',
                null,
                'When try to install Nvm. Something get wrong!'
            );
            return resolve(installNvm);
        });
    }

    async installNode(mainWindow, node_version) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Node is installing!', this.consoleType.info);
            const installNode = await this.childManager.executeCommand(
                mainWindow,
                'nvm install  --default ' + node_version,// + '&&nvm use ' + node_version + '&&nvm alias default ' + node_version
                null,
                'When try to install Node. Something get wrong!'
            );
            return resolve(installNode);
        });
    }


    async exportNvmDirToProfile(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Nvm is exporting!', this.consoleType.info);
            const exportNvmDir = await this.childManager.executeCommand(
                mainWindow,
                `echo 'export NVM_DIR="$HOME/.nvm"
                        [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm
                        [ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion' >> ~/.zprofile`,
                null,
                'When try to export Nvm. Something get wrong!'
            );
            return resolve(exportNvmDir);
        });

    }

    async removeNodes(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Removing Node versions!', this.consoleType.info);
            const removeNodes = await this.childManager.executeCommand(
                mainWindow,
                'rm -rf ~/.nvm/versions/node/*',
                null,
                'When try to remove ~/.nvm/versions/node/* folder. Something get wrong!'
            );
            return resolve(removeNodes);
        });
    }

    async cacheClearNvm(mainWindow, node_version) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Clear nvm cache!', this.consoleType.info);
            const cacheClearNvm = await this.childManager.executeCommand(
                mainWindow,
                'nvm cache clear',
                null,
                'When try to clear cache. Something get wrong!'
            );
            return resolve(cacheClearNvm);
        });
    }

    async changeNodeVersionTo(mainWindow, node_version) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying install Node with nvm!', this.consoleType.info);
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
            const removeNodes = await this.removeNodes(mainWindow);
            if (removeNodes.error) {
                return resolve(removeNodes);
            }

            const installNode = await this.installNode(mainWindow, node_version);
            if (installNode.error) {
                return resolve(installNode);
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
}


module.exports = { NodeManager };
