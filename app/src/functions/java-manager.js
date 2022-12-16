const {ChildProcess} = require('./child_process');
const {NodeManager} = require("./node-manager");
const {FsManager} = require("./fs-manager");

class JavaManager {
    childManager = new ChildProcess();
    nodeManager = new NodeManager();
    fsManager = new FsManager();
    consoleType = {
        command: "command",
        output: "output",
        error: "error",
        info: "info"
    }

    constructor() {
    }

    async getJavaVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Java version!', this.consoleType.info);
            const javaVersion = await this.childManager.executeCommand(
                mainWindow,
                'javac -version',
                'export JAVA_HOME="$(/usr/libexec/java_home)"',
                'You do not have a Java version installed on your computer.'
            );
            return resolve(javaVersion);
        });
    }

    async setJavaVersion(mainWindow, java_version) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Java is exporting to ~/.zprofile file!', this.consoleType.info);
            const setJavaVersion = await this.childManager.executeCommand(
                mainWindow,
                `echo 'export JAVA_HOME="$(/usr/libexec/java_home -v ${ java_version })"' >> ~/.zprofile`,
                null,
                'When try to export Java version to ~/.zprofile file. Something get wrong!'
            );
            return resolve(setJavaVersion);
        });
    }

    async checkJavaVersionExist(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking java version is exist!', this.consoleType.info);
            const checkJavaVersionExist = await this.childManager.executeCommand(
                mainWindow,
                '/usr/libexec/java_home -V',
                'eval "$(~/homebrew/bin/brew shellenv)"',
                'You do not have any installed Java Virtual Machine on your computer.'
            );
            const replace = checkJavaVersionExist.data ? checkJavaVersionExist.data.replace(/(\/*Matching Java Virtual Machines \(4\):\n +\/*)/, '') : '';
            const split = replace.split('\n    ');
            const filter = split.filter((o) => o !== '\n    ');
            checkJavaVersionExist.data = filter.map((d) => {
                return new RegExp(/(\/*\S+\/*)/).exec(d)[0];
            }).find((o) => o.startsWith('1.8'));
            return resolve(checkJavaVersionExist);
        });
    }

    async brewInstallZulu8(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Zulu is installing', this.consoleType.info);
            const brewTabCask = await this.childManager.executeCommand(
                mainWindow,
                'echo "oksn1234" | brew reinstall --cask zulu8',
                'eval "$(~/homebrew/bin/brew shellenv)"',
                'When try to install Zulu8. Something get wrong!'
            );
            return resolve(brewTabCask);
        });
    }

    async brewTapCask(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Tapping Homebrew casks!', this.consoleType.info);
            const brewTabCask = await this.childManager.executeCommand(
                mainWindow,
                'brew tap homebrew/cask-versions',
                'eval "$(~/homebrew/bin/brew shellenv)"',
                'When try to tapping brew cask. Something get wrong!'
            );
            return resolve(brewTabCask);
        });
    }


    async installJavaWithAzul(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying install Java with Azul!', this.consoleType.info);
            let wgetVersion = await this.nodeManager.wgetVersion(mainWindow);
            if (wgetVersion.error) {
                const installWgetWithBrew = await this.nodeManager.installWgetWithBrew(mainWindow);
                if (installWgetWithBrew.error) {
                    return resolve(installWgetWithBrew);
                }

                wgetVersion = await this.nodeManager.wgetVersion(mainWindow);
                if (wgetVersion.error) {
                    return resolve(wgetVersion);
                }
            }

            const mkdir = await this.childManager.executeCommand(
                mainWindow,
                'echo "oksn1234" | sudo -S -k mkdir -p /Library/Java/JavaVirtualMachines',
                null,
                'When try to install Nvm. Something get wrong!'
            );
            console.log('%c mkdir', 'background: #222; color: #bada55', mkdir);

            if (mkdir.error && mkdir.data.includes('Password:Sorry')) {
                console.log('%c PASSWORD IS WRONG!!!!', 'background: #222; color: #bada55', mkdir);
            }

            const wget = await this.childManager.executeCommand(
                mainWindow,
                'echo "oksn1234" | sudo -S -k wget -O /Library/Java/JavaVirtualMachines/zulu-8.zip  https://cdn.azul.com/zulu/bin/zulu8.66.0.15-ca-jdk8.0.352-macosx_aarch64.zip',
                'eval "$(~/homebrew/bin/brew shellenv)"',
                'When try to install Nvm. Something get wrong!'
            );
            console.log('%c wget', 'background: #222; color: #bada55', wget);

            const unzip = await this.childManager.executeCommand(
                mainWindow,
                'echo "oksn1234" | sudo -S -k unzip -qq /Library/Java/JavaVirtualMachines/zulu-8.zip -d /Library/Java/JavaVirtualMachines',
                null,
                'When try to install Nvm. Something get wrong!'
            );
            console.log('%c unzip', 'background: #222; color: #bada55', unzip);

            const move = await this.childManager.executeCommand(
                mainWindow,
                'echo "oksn1234" | sudo -S -k mv /Library/Java/JavaVirtualMachines/zulu8.66.0.15-ca-jdk8.0.352-macosx_aarch64/zulu-8.jdk /Library/Java/JavaVirtualMachines/zulu-8.jdk/',
                null,
                'When try to install Nvm. Something get wrong!'
            );
            console.log('%c move', 'background: #222; color: #bada55', move);

            const remove = await this.childManager.executeCommand(
                mainWindow,
                'echo "oksn1234" | sudo -S -k rm -rf /Library/Java/JavaVirtualMachines/zulu8.zip',
                null,
                'When try to install Nvm. Something get wrong!'
            );
            console.log('%c remove', 'background: #222; color: #bada55', remove);

            const javaVersion = await this.getJavaVersion(mainWindow);
            return resolve(javaVersion);
        });
    }

    async installJavaWithBrew(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying install Java with brew!', this.consoleType.info);
            //todo find how to enter password using terminal when brew ask => brew install --cask zulu8 -> its showing password prompt
            const brewTapCask = await this.brewTapCask(mainWindow);
            if (brewTapCask.error) {
                return resolve(brewTapCask);
            }
            const brewInstallZulu8 = await this.brewInstallZulu8(mainWindow);// ->Password prompt doesnt work!!!
            if (brewInstallZulu8.error) {
                return resolve(brewInstallZulu8);
            }
            const javaVirtualMachine = await this.checkJavaVersionExist(mainWindow, '1.8');
            if (javaVirtualMachine.error) {
                return resolve(javaVirtualMachine);
            }
            const setJavaVersion = await this.setJavaVersion(mainWindow, javaVirtualMachine.data);
            if (setJavaVersion.error) {
                return resolve(setJavaVersion);
            }
            await this.sendListen(mainWindow, 'Java is installed!', this.consoleType.info);
            return resolve(javaVirtualMachine);
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


module.exports = {JavaManager};
