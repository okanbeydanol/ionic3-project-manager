const { ChildProcess } = require('./child_process');
const { PasswordManager } = require('./password-manager');
const { value } = require('yarn/lib/cli');
const { ZshrcManager } = require('./zshrc-manager');
const { FsManager } = require('./fs-manager');

class JavaManager {
    childManager = new ChildProcess();
    passwordManager = new PasswordManager();
    zshrcManager = new ZshrcManager();
    fsManager = new FsManager();
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {
    }

    async getJavaVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Java version!', this.consoleType.info);
            const javaVersion = await this.childManager.executeCommand(
                mainWindow,
                'javac -version',
                null,
                'You do not have a Java version installed on your computer.'
            );
            if (!javaVersion.error) {
                javaVersion.data = javaVersion.data.trim().split(' ')[1].trim();
            }
            return resolve(javaVersion);
        });
    }

    async checkAnySetJavaVersionAndRemove(mainWindow) {
        return new Promise(async (resolve) => {
            const regex = /(\/*export JAVA_HOME="\$\(\/usr\/libexec\/java_home -v \S+\)"\/*)/g;
            await this.sendListen(mainWindow, 'Trying to check any set java version exist and remove!', this.consoleType.info);
            let zshrcContent = await this.zshrcManager.getZshrcContent();
            if (zshrcContent.error) {
                return resolve(zshrcContent);
            }
            const match = regex.exec(zshrcContent);
            if (match) {
                await this.sendListen(mainWindow, 'Exported Java Found! Removing: ' + match[0], this.consoleType.info);
                zshrcContent = zshrcContent.replace(match[0], '');
                const writeFile = await this.fsManager.writeFile(this.zshrcManager.getZshrcPath(), zshrcContent);
                if (writeFile.error) {
                    return resolve(writeFile);
                }
            }
            return resolve({ data: false, error: false });
        });
    }

    async setJavaVersion(mainWindow, java_version) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Java is exporting to ~/.zprofile file!', this.consoleType.info);
            let setJavaVersion = await this.childManager.executeCommand(
                mainWindow,
                `echo 'export JAVA_HOME="$(/usr/libexec/java_home -v ${ java_version })"' >> ~/.zprofile`,
                null,
                'When try to export Java version to ~/.zprofile file. Something get wrong!'
            );
            if (setJavaVersion.error) {
                return resolve(setJavaVersion);
            }
            await this.sendListen(mainWindow, 'Java is exporting to ~/.szshrc file!', this.consoleType.info);
            setJavaVersion = await this.childManager.executeCommand(
                mainWindow,
                `echo 'export JAVA_HOME="$(/usr/libexec/java_home -v ${ java_version })"' >> ~/.szshrc`,
                null,
                'When try to export Java version to ~/.szshrc file. Something get wrong!'
            );
            return resolve(setJavaVersion);
        });
    }

    async checkJavaVersionVirtualMachineExist(mainWindow, value) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking java version is exist!', this.consoleType.info);
            const checkJavaVersionVirtualMachineExist = await this.childManager.executeCommand(
                mainWindow,
                '/usr/libexec/java_home -V',
                null,
                'You do not have any installed Java Virtual Machine on your computer.'
            );
            const replace = checkJavaVersionVirtualMachineExist.data ? checkJavaVersionVirtualMachineExist.data.replace(/(\/*Matching Java Virtual Machines \(\d+\):\n +\/*)/, '') : '';
            const split = replace.split('\n    ');
            const filter = split.filter((o) => o !== '\n    ');
            checkJavaVersionVirtualMachineExist.data = filter.map((d) => {
                return new RegExp(/(\/*\S+ \/*)/).exec(d)[0].trim();
            }).find((o) => o.includes(value));
            return resolve(checkJavaVersionVirtualMachineExist);
        });
    }

    async getJavaVersionVirtualMachines(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking java version is exist!', this.consoleType.info);
            const getJavaVersionVirtualMachines = await this.childManager.executeCommand(
                mainWindow,
                '/usr/libexec/java_home -V',
                null,
                'You do not have any installed Java Virtual Machine on your computer.'
            );
            const replace = getJavaVersionVirtualMachines.data ? getJavaVersionVirtualMachines.data.replace(/(\/*Matching Java Virtual Machines \(\d+\):\n +\/*)/, '') : '';
            const split = replace.split('\n    ');
            const filter = split.filter((o) => o !== '\n    ');
            getJavaVersionVirtualMachines.data = [];
            filter.map((d) => {
                const match = new RegExp(/(\/*\S+ \/*)/).exec(d);
                if (match) {
                    getJavaVersionVirtualMachines.data.push(match[0].trim());
                }
            });
            return resolve(getJavaVersionVirtualMachines);
        });
    }

    async getJavaVersionVirtualMachine(mainWindow, value = '') {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking java version is exist!', this.consoleType.info);
            const getJavaVersionVirtualMachine = await this.childManager.executeCommand(
                mainWindow,
                '/usr/libexec/java_home -V',
                null,
                'You do not have any installed Java Virtual Machine on your computer.'
            );
            const replace = getJavaVersionVirtualMachine.data ? getJavaVersionVirtualMachine.data.replace(/(\/*Matching Java Virtual Machines \(\d+\):\n +\/*)/, '') : '';
            const split = replace.split('\n    ');
            const filter = split.filter((o) => o !== '\n    ');
            getJavaVersionVirtualMachine.data = null;
            filter.map((d) => {
                const match = new RegExp(/(\/*\S+ \/*)/).exec(d);
                if (match && d.includes(value)) {
                    getJavaVersionVirtualMachine.data = match[0].trim();
                }
            });
            return resolve(getJavaVersionVirtualMachine);
        });
    }

    async installJavaWithAzulSettings(mainWindow, value) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying fetch about latest build json information:  ' + value + ' version!', this.consoleType.info);
            const base_url = 'https://api.azul.com/zulu/download/community/v1.0/bundles/latest/';
            const jdk_version = value;
            const arch = 'arm64';
            const bundle_type = 'jdk';
            const ext = 'zip';
            const os = 'macos';
            const downloadJson = await this.childManager.executeCommand(
                mainWindow,
                'curl -s "' + base_url + '?jdk_version=' + jdk_version + '&bundle_type=' + bundle_type + '&ext=' + ext + '&os=' + os + '&arch=' + arch + '&javafx=false"',
                null,
                'When try to install Nvm. Something get wrong!'
            );
            if (downloadJson.error) {
                return resolve(downloadJson);
            } else if (Object.hasOwn(JSON.parse(downloadJson.data), 'code')) {
                return resolve(downloadJson);
            }

            if (!Object.hasOwn(JSON.parse(downloadJson.data), 'url')) {
                return resolve(downloadJson);
            }
            const jsonData = JSON.parse(downloadJson.data);
            const javaName = jsonData.name.replace('.zip', '');
            await this.sendListen(mainWindow, 'Trying create JavaVirtualMachines folder!', this.consoleType.info);

            const password = await this.passwordManager.getUserPassword(mainWindow, false);

            await this.sendListen(mainWindow, 'Trying create JavaVirtualMachines folder!', this.consoleType.info);
            const mkdir = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k mkdir -p /Library/Java/JavaVirtualMachines',
                null,
                'When try to create JavaVirtualMachines folder. Something get wrong!'
            );

            if (mkdir.error) {
                await this.sendListen(mainWindow, 'Password is wrong!!!  Terminal will prompt the password if you run it again!', this.consoleType.info);
                return mkdir.message.includes('Password:Sorry') ? await this.passwordManager.getUserPassword(mainWindow, true) : resolve(mkdir);
            }

            await this.sendListen(mainWindow, 'Trying download Java jdk!', this.consoleType.info);
            const download = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k curl -L ' + jsonData.url + ' --output /Library/Java/JavaVirtualMachines/' + jsonData.name,
                null,
                'When try to download Java jdk. Something get wrong!'
            );

            if (download.error) {
                resolve(download);
            }
            console.log('%c download', 'background: #222; color: #bada55', download);

            await this.sendListen(mainWindow, 'Trying unzip Java jdk!', this.consoleType.info);
            const unzip = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k unzip -qq /Library/Java/JavaVirtualMachines/' + jsonData.name + ' -d /Library/Java/JavaVirtualMachines',
                null,
                'When try to unzip Java jdk. Something get wrong!'
            );
            if (unzip.error) {
                resolve(unzip);
            }
            console.log('%c unzip', 'background: #222; color: #bada55', unzip);

            await this.sendListen(mainWindow, 'Trying move Java jdk!', this.consoleType.info);
            const move = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k mv /Library/Java/JavaVirtualMachines/' + javaName + '/*.jdk /Library/Java/JavaVirtualMachines/',
                null,
                'When try to move Java jdk. Something get wrong!'
            );
            console.log('%c move', 'background: #222; color: #bada55', move);

            await this.sendListen(mainWindow, 'Trying remove unnecessary Java jdk zip!', this.consoleType.info);
            const removeZip = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k rm -rf /Library/Java/JavaVirtualMachines/' + jsonData.name,
                null,
                'When try to remove unnecessary Java jdk zip. Something get wrong!'
            );
            console.log('%c removeZip', 'background: #222; color: #bada55', removeZip);

            await this.sendListen(mainWindow, 'Trying remove unnecessary Java jdk folder!', this.consoleType.info);
            const removeFolder = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k rm -rf /Library/Java/JavaVirtualMachines/' + javaName,
                null,
                'When try to remove unnecessary Java jdk folder. Something get wrong!'
            );
            console.log('%c removeFolder', 'background: #222; color: #bada55', removeFolder);

            let checkVersion = jdk_version;
            if (checkVersion.startsWith('1.')) {
                checkVersion = jdk_version.replace('1.', '');
            }

            const javaVirtualMachine = await this.checkJavaVersionVirtualMachineExist(mainWindow, checkVersion + '.');
            if (javaVirtualMachine.error) {
                return resolve(javaVirtualMachine);
            }

            const checkAnySetJavaVersionAndRemove = await this.checkAnySetJavaVersionAndRemove(mainWindow);
            if (checkAnySetJavaVersionAndRemove.error) {
                return resolve(checkAnySetJavaVersionAndRemove);
            }

            const setJavaVersion = await this.setJavaVersion(mainWindow, javaVirtualMachine.data);
            if (setJavaVersion.error) {
                return resolve(setJavaVersion);
            }

            const javaVersion = await this.getJavaVersion(mainWindow);
            return resolve(javaVersion);
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


module.exports = { JavaManager };
