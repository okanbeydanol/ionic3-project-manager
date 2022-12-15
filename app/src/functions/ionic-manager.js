const {ChildProcess} = require('./child_process');

class IonicManager {
    childManager = new ChildProcess();

    constructor() {
    }

    async getIonicVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.childManager.execCommand('ionic -v', (event) => {
                if (event.error) {
                    return resolve({
                        error: true,
                        data: null,
                        message: 'Ionic is not installed on your computer!',
                    });
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim(),
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim(),
                    });
                }
            }, mainWindow);
        });
    }

    async getIonicInfo() {
        return new Promise(async (resolve) => {
            await this.childManager.execCommand('ionic info --json', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Ionic not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data
                    });
                }
            });
        });
    }

    async installIonic(mainWindow) {
        return new Promise(async (resolve) => {
            const command = 'export NVM_DIR="$HOME/.nvm"\n' +
                '[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"\n' +
                '[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"&&npm install -g @ionic/cli';
            await this.childManager.execCommand(command, (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Ionic can`t be install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            }, mainWindow);
        });
    }

}


module.exports = {IonicManager};
