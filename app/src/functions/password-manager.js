const { globalFunctions } = require('./global-shared');
const { BrowserWindow, app } = require('electron');
const path = require('path');

class PasswordManager {
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };
    passwordWindow;

    constructor() {
    }

    async checkPasswordExist(mainWindow) {
        return !!await globalFunctions.getPassword;
    }

    async getUserPassword(mainWindow, resetPassword = false) {
        return new Promise(async (resolve) => {
            const r = resolve;
            if (resetPassword) {
                globalFunctions.setPassword = null;
                return resolve(true);
            }
            const check = await this.checkPasswordExist(mainWindow);
            if (check) {
                this.sendListen(mainWindow, 'Password found!', this.consoleType.info);
                const password = await globalFunctions.getPassword;
                return resolve(password);
            } else {
                this.sendListen(mainWindow, 'Password cannot found! Please enter password!', this.consoleType.info);
                this.passwordWindow = new BrowserWindow({
                    width: 400,
                    height: 174,
                    webPreferences: {
                        devTools: true,
                        disableHtmlFullscreenWindowResize: true,
                        nodeIntegration: true,
                        enableRemoteModule: true,
                        webSecurity: true,
                        experimentalFeatures: false,
                        contextIsolation: true,
                        preload: path.resolve(app.getAppPath(), 'app/src/preload/preload.js'),
                        show: false
                    }
                });
                await this.passwordWindow.loadFile(path.resolve(app.getAppPath(), 'app/src/frontend/passwordLoad/index.html'));
                this.passwordWindow.webContents.openDevTools({ mode: 'detach' });
                this.passwordWindow.on('close', async function (e) {
                    const password = await globalFunctions.getPassword;
                    r(password);
                });

            }
        });
    }

    async setNewPassword(mainWindow, password) {
        this.sendListen(mainWindow, 'Setting password to json file!', this.consoleType.info);
        return new Promise(async (resolve) => {
            globalFunctions.setPassword = password;
            BrowserWindow.getFocusedWindow().close();
            resolve(true);
        });
    }

    sendListen(mainWindow, text, type = null, error = false) {
        mainWindow.webContents.send('command:listen', {
            data: text,
            type: type,
            error: error
        });
    }
}


module.exports = { PasswordManager };
