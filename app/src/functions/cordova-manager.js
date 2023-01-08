const { ChildProcess } = require('./child_process');
const os = require('os');
const { getOSInfo } = require('get-os-info');
const { FsManager } = require('./fs-manager');
const { globalFunctions } = require('./global-shared');

class CordovaManager {
    system_type = { mac: false, windows: false, linux: false };
    system_info = { name: null, version: null };
    osPlatform = os.platform();
    childManager = new ChildProcess();
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {
        if (this.osPlatform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys') {
            this.system_type.windows = true;
        }
        if (this.osPlatform === 'darwin') {
            this.system_type.mac = true;
        }
        if (!(this.osPlatform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys') && !(this.osPlatform === 'darwin')) {
            this.system_type.linux = true;
        }
    }

    async getCordovaVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Cordova version!', this.consoleType.info);
            const cordovaVersion = await this.childManager.executeCommand(
                mainWindow,
                'cordova -v',
                null,
                'You do not have a Cordova version installed on your computer.'
            );
            if (!cordovaVersion.error) {
                cordovaVersion.data = cordovaVersion.data.trim().split(' ')[0].trim();
            }
            return resolve(cordovaVersion);
        });
    }

    async installCordovaRes(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Cordova is installing!', this.consoleType.info);
            const installCordovaRes = await this.childManager.executeCommand(
                mainWindow,
                'unset npm_config_prefix&&npm install -g cordova-res --unsafe-perm=true',
                null,
                'When try to install cordova res. Something get wrong!'
            );
            return resolve(installCordovaRes);
        });
    }

    async installCordova(mainWindow, cordova_version = 10) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Cordova is installing!', this.consoleType.info);
            const installCordova = await this.childManager.executeCommand(
                mainWindow,
                'unset npm_config_prefix&&npm install -g cordova@' + cordova_version + ' --unsafe-perm=true',
                null,
                'When try to install cordova. Something get wrong!'
            );
            return resolve(installCordova);
        });
    }

    async getCordovaResVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Cordova Resources version!!', this.consoleType.info);
            const installCordova = await this.childManager.executeCommand(
                mainWindow,
                'cordova-res -v',
                null,
                'You do not have a Cordova Res version installed on your computer.'
            );
            return resolve(installCordova);
        });
    }

    async getNpmPath(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Npm path is fetching!', this.consoleType.info);
            const getNpmPath = await this.childManager.executeCommand(
                mainWindow,
                'which npm',
                null,
                'When try to get npm path folder. Something get wrong!'
            );
            return resolve(getNpmPath);
        });
    }

    async fixMacOsReleaseName(mainWindow, global = true) {
        return new Promise(async (resolve) => {
            const info = await getOSInfo();
            this.system_info.name = info.name;
            this.system_info.version = info.version;
            const findOsExistRegex = new RegExp('(\\/*\\[\'' + this.system_info.name + '\', \'' + this.system_info.version + '\']\\/*)', '');
            const getLastIndexRegex = /(\/*\[\d+\/*)/;
            const addNewOsNameRegex = /(\/*const nameMap = new Map\(\[\/*)/;
            let macOsReleasePath = '';
            if (global) {
                const getNpmPath = await this.getNpmPath(mainWindow);
                if (getNpmPath.error) {
                    return resolve(getNpmPath);
                }
                const split = getNpmPath.data.split('/');
                const slice = split.slice(0, split.length - 2);
                const join = slice.join('/');
                macOsReleasePath = join + '/lib/node_modules/cordova/node_modules/macos-release/index.js';
            } else {
                this.settingsJSON = await globalFunctions.getSettingsJSON;
                macOsReleasePath = this.settingsJSON.project_path + '/node_modules/macos-release/index.js';
            }
            let indexJs = await new FsManager().readFile(macOsReleasePath, { encoding: 'utf8' });
            if (indexJs.error) {
                return resolve(indexJs);
            }
            const findOsExistRegexMatch = findOsExistRegex.exec(indexJs.data);
            if (!findOsExistRegexMatch) {
                const getLastIndexRegexMatch = getLastIndexRegex.exec(indexJs.data);
                if (getLastIndexRegexMatch && getLastIndexRegexMatch[0].split('[').length > 1) {
                    const lastIndexPlus = +getLastIndexRegexMatch[0].split('[')[1] + 1;
                    const addNewOsNameRegexMatch = addNewOsNameRegex.exec(indexJs.data);
                    if (addNewOsNameRegexMatch) {
                        indexJs.data = indexJs.data.replace(addNewOsNameRegexMatch[0],
                            'const nameMap = new Map([\n' +
                            '\t[' + lastIndexPlus + ', [\'' + this.system_info.name + '\', \'' + this.system_info.version + '\']],'
                        );
                        const writeFile = await new FsManager().writeFile(macOsReleasePath, indexJs.data);
                        if (writeFile.error) {
                            return resolve(writeFile);
                        }
                        const cordovaVersion = await this.getCordovaVersion(mainWindow);
                        return resolve(cordovaVersion);
                    } else {
                        return resolve({ error: true, data: null, message: 'No data to be corrected2!' });
                    }
                } else {
                    return resolve({ error: true, data: null, message: 'No data to be corrected3!' });
                }
            } else {
                return resolve({ error: true, data: null, message: 'No data to be corrected4!' });
            }
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

module.exports = { CordovaManager };
