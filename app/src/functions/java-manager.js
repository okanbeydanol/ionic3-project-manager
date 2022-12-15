const {ChildProcess} = require('./child_process');

class JavaManager {
    childManager = new ChildProcess();
    consoleType = {
        command: "command",
        output: "output",
        error: "error",
        info: "info"
    }

    constructor() {
    }

    async getSetJavaVersionTextEcho(java_version) {
        return new Promise((resolve) => {
            const command = `echo 'export JAVA_HOME=$(/usr/libexec/java_home -v ${ java_version })' >> ~/.zprofile`;
            return resolve(command);
        });
    }

    async getSetJavaVersionText(java_version) {
        return new Promise((resolve) => {
            const command = `export JAVA_HOME=$(/usr/libexec/java_home -v ${ java_version })`;
            return resolve(command);
        });
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
            return resolve(javaVersion);
        });
    }

    async setJavaVersion(mainWindow, java_version) {
        return new Promise(async (resolve) => {
            const command = await this.getSetJavaVersionTextEcho(java_version);
            await this.childManager.execCommand(command, (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Java cannot set!'});
                }
                if (event.type === 'stdout:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            }, mainWindow);
        });
    }

    async getJavaVirtualMachines(mainWindow) {
        return new Promise(async (resolve) => {
            await this.childManager.execCommand('eval "$(~/homebrew/bin/brew shellenv)"&&/usr/libexec/java_home -V', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Java not install!'});
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    const replace = event.data.replace(/(\/*Matching Java Virtual Machines \(4\):\n +\/*)/, '');
                    const split = replace.split('\n    ');
                    const filter = split.filter((o) => o !== '\n    ');
                    const versions = filter.map((d) => {
                        return new RegExp(/(\/*\S+\/*)/).exec(d)[0];
                    });
                    return resolve({
                        error: false,
                        data: versions
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    const replace = event.data.replace(/(\/*Matching Java Virtual Machines \(4\):\n +\/*)/, '');
                    const split = replace.split('\n    ');
                    const filter = split.filter((o) => o !== '\n    ');
                    const versions = filter.map((d) => {
                        return new RegExp(/(\/*\S+\/*)/).exec(d)[0];
                    });
                    return resolve({
                        error: false,
                        data: versions
                    });
                }
            }, mainWindow);
        });
    }

    async checkJavaVersionExist(mainWindow, java_version) {
        return new Promise(async (resolve) => {
            const virtualMachines = await this.getJavaVirtualMachines(mainWindow);
            const find = virtualMachines.data.find((o) => o.startsWith(java_version));
            if (find) {
                return resolve({error: false, data: find});
            }
            return resolve({error: true, data: null});
        });
    }

    async getJavaPath(java_version) {
        return new Promise(async (resolve) => {
            await this.childManager.execCommand('/usr/libexec/java_home -V ' + java_version, (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Java not install!'});
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
            });
        });
    }

    async installJavaWithBrew(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying install Java with brew!', this.consoleType.info);
            BURDAAAAAAAASINNNNNNNNN
            //todo try to install with zulu or find how to enter password using terminal
            //https://docs.azul.com/core/zulu-openjdk/install/macos
            const brewTapCask = await this.brewTapCask(mainWindow);
            if (brewTapCask.error) {
                return resolve(brewTapCask);
            }

            const brewInstallZulu8 = await this.brewInstallZulu8(mainWindow);
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

            return resolve({error: false, data: javaVirtualMachine});
        });
    }

    async brewInstallZulu8(mainWindow) {
        return new Promise(async (resolve) => {
            await this.childManager.execCommand('eval "$(~/homebrew/bin/brew shellenv)"&&brew reinstall --cask zulu8', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Brew Java Zulu8 can not install!'});
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

    async removeJava(mainWindow, password) {
        return new Promise(async (resolve) => {
            await this.childManager.execCommand('echo ' + password + ' | sudo -S rm -rf /Library/Java/*&&rm -rf /Library/Internet\\ Plug-Ins/JavaAppletPlugin.plugin&&rm -rf /Library/PreferencePanes/JavaControlPanel.prefPane&&rm -rf /Library/Application\\ Support/Oracle/Java/&&rm -rf /Library/Java/JavaVirtualMachines', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Java can not remove!'});
                }
                if (event.type === 'stdout:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
                if (event.type === 'stderr:end' && !event.error) {
                    return resolve({
                        error: false,
                        data: event.data.trim()
                    });
                }
            }, mainWindow);
        });
    }

    async brewTapCask(mainWindow) {
        return new Promise(async (resolve) => {
            await this.childManager.execCommand('eval "$(~/homebrew/bin/brew shellenv)"&&brew tap homebrew/cask-versions', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Brew Cask can not install!'});
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
