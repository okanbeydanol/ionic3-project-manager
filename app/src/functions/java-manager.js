const {ChildProcess} = require('./child_process');
const {PasswordManager} = require('./password-manager');
const {value} = require('yarn/lib/cli');
const {ZshrcManager} = require('./zshrc-manager');
const {FsManager} = require('./fs-manager');
const {app} = require('electron');
const xml2js = require('xml2js');

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
            if (javaVersion.error) {
                await this.cleanJavaVirtualMachinesFolders(mainWindow);
            }
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
            const match = regex.exec(zshrcContent.data);
            if (match) {
                await this.sendListen(mainWindow, 'Exported Java Found! Removing: ' + match[0], this.consoleType.info);
                zshrcContent.data = zshrcContent.data.replace(match[0], '');
                const writeFile = await this.fsManager.writeFile(this.zshrcManager.getZshrcPath(), zshrcContent.data);
                if (writeFile.error) {
                    return resolve(writeFile);
                }
            }
            return resolve({data: false, error: false});
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
            checkJavaVersionVirtualMachineExist.data = null;
            filter.map((d) => {
                const data = new RegExp(/(\/*\S+ \/*)/).exec(d);
                if (data && data[0].includes(value)) {
                    checkJavaVersionVirtualMachineExist.data = data[0].trim();
                }
                return data;
            });
            return resolve({
                error: !checkJavaVersionVirtualMachineExist.data,
                data: checkJavaVersionVirtualMachineExist.data
            });
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


    async getVirtualMachinesFoldersPath(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking java version is exist!', this.consoleType.info);
            const getJavaVersionVirtualMachines = await this.childManager.executeCommand(
                mainWindow,
                '/usr/libexec/java_home -V',
                null,
                'You do not have any installed Java Virtual Machine on your computer.'
            );
            const findJavaVirtualMachinesFolderRegex = /(\/* \/Library\/Java\/JavaVirtualMachines\/\S+\/Contents\/Home\/*)/g;
            let m;
            let paths = [];
            while ((m = findJavaVirtualMachinesFolderRegex.exec(getJavaVersionVirtualMachines.data)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === findJavaVirtualMachinesFolderRegex.lastIndex) {
                    findJavaVirtualMachinesFolderRegex.lastIndex++;
                }
                m.forEach((match) => {
                    if (typeof match !== 'undefined' && !paths.includes(match.trim().replace('/Contents/Home', '')) && match.trim().replace('/Contents/Home', '') !== '') {
                        paths.push(match.trim().replace('/Contents/Home', ''));
                    }
                });

            }
            return resolve(paths);
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

    async getPhysicalPaths(mainWindow) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Physical Java Paths!', this.consoleType.info);
            const getPhysicalPaths = await this.childManager.executeCommand(
                mainWindow,
                'find /Library/Java/JavaVirtualMachines -iregex \'.*\\(jdk\\)\'',
                null,
                'When try to get Physical Java Paths. Something get wrong!'
            );
            if (!getPhysicalPaths.error) {
                getPhysicalPaths.data = getPhysicalPaths.data.trim().split('\n');
                return resolve(getPhysicalPaths.data);
            } else {
                return resolve([]);
            }
        });
    }

    async getPhysicalPath(mainWindow, version) {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Checking Physical Java Path!', this.consoleType.info);
            const paths = await this.getPhysicalPaths(mainWindow);
            const search = paths.find((o) => o.includes(version));
            if (search) {
                return resolve(search);
            } else {
                return resolve(null);
            }
        });
    }

    async cleanJavaVirtualMachinesFolders(mainWindow) {
        return new Promise(async (resolve) => {
            const physicalPaths = await this.getPhysicalPaths(mainWindow);
            await physicalPaths.reduce((lastPromise, path) => {
                return lastPromise.then(async () => {
                    const password = await this.passwordManager.getUserPassword(mainWindow, false);

                    await this.sendListen(mainWindow, 'Trying remove ' + path + ' folder!', this.consoleType.info);
                    const mkdir = await this.childManager.executeCommand(
                        mainWindow,
                        'echo "' + password + '" | sudo -S -k rm -rf ' + path,
                        null,
                        'When try to remove ' + path + ' folder. Something get wrong!'
                    );

                    if (mkdir.error) {
                        await this.sendListen(mainWindow, 'Password is wrong!!!  Terminal will prompt the password if you run it again!', this.consoleType.info);
                        return mkdir.message.includes('Password:Sorry') ? await this.passwordManager.getUserPassword(mainWindow, true) : resolve(mkdir);
                    }
                });
            }, Promise.resolve()).finally(async () => {
                return resolve({error: false, data: false});
            });
        });
    }

    async installJavaWithAzulSettings(mainWindow, value = '1.8') {
        return new Promise(async (resolve) => {
            await this.sendListen(mainWindow, 'Trying fetch about latest build json information:  ' + value + ' version!', this.consoleType.info);
            const base_url = 'https://api.azul.com/zulu/download/community/v1.0/bundles/latest/';
            const jdk_search_version = value;
            const arch = 'arm64';
            const bundle_type = 'jdk';
            const ext = 'zip';
            const os = 'macos';
            const downloadJson = await this.childManager.executeCommand(
                mainWindow,
                'curl -s "' + base_url + '?jdk_version=' + jdk_search_version + '&bundle_type=' + bundle_type + '&ext=' + ext + '&os=' + os + '&arch=' + arch + '&javafx=false"',
                null,
                'When try to fetch about latest build json information. Something get wrong!'
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
            const javaZipName = jsonData.name;

            await this.sendListen(mainWindow, 'Trying prompt computer password!', this.consoleType.info);
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
                'echo "' + password + '" | sudo -S -k curl -L ' + jsonData.url + ' --output /Library/Java/JavaVirtualMachines/' + javaZipName,
                null,
                'When try to download Java jdk. Something get wrong!'
            );
            if (download.error) {
                resolve(download);
            }

            await this.sendListen(mainWindow, 'Trying unzip Java jdk!', this.consoleType.info);
            const unzip = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k unzip -qq /Library/Java/JavaVirtualMachines/' + javaZipName + ' -d /Library/Java/JavaVirtualMachines',
                null,
                'When try to unzip Java jdk. Something get wrong!'
            );
            if (unzip.error) {
                resolve(unzip);
            }

            await this.sendListen(mainWindow, 'Trying move Java jdk!', this.consoleType.info);
            const move = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k mv /Library/Java/JavaVirtualMachines/' + javaName + '/*.jdk /Library/Java/JavaVirtualMachines/',
                null,
                'When try to move Java jdk. Something get wrong!'
            );

            await this.sendListen(mainWindow, 'Trying remove unnecessary Java jdk zip!', this.consoleType.info);
            const removeZip = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k rm -rf /Library/Java/JavaVirtualMachines/' + javaZipName,
                null,
                'When try to remove unnecessary Java jdk zip. Something get wrong!'
            );

            await this.sendListen(mainWindow, 'Trying remove unnecessary Java jdk folder!', this.consoleType.info);
            const removeFolder = await this.childManager.executeCommand(
                mainWindow,
                'echo "' + password + '" | sudo -S -k rm -rf /Library/Java/JavaVirtualMachines/' + javaName,
                null,
                'When try to remove unnecessary Java jdk folder. Something get wrong!'
            );

            const physicalPath = await this.getPhysicalPath(mainWindow, jsonData.java_version[0]);

            const infoPlistExist = await this.fsManager.pathExist(physicalPath.trim() + '/Contents/Info.plist');
            if (!infoPlistExist.data) {
                return resolve(infoPlistExist);
            }

            const readInfoPlist = await this.fsManager.readFile(physicalPath.trim() + '/Contents/Info.plist', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            }).then(async (config) => {
                const parser = new xml2js.Parser({includeWhiteChars: true});
                return await parser.parseStringPromise(config.data);
            });

            let JVMVersion = null;
            readInfoPlist.plist.dict[0].dict[0].key.map((data, index) => {
                if (data === 'JVMVersion') {
                    JVMVersion = readInfoPlist.plist.dict[0].dict[0].string[index - (Object.hasOwn(readInfoPlist.plist.dict[0].dict[0], 'array') ? 1 : 0)];
                }
            });
            if (!JVMVersion) {
                JVMVersion = jsonData.java_version.join('');
            }

            const javaVirtualMachine = await this.checkJavaVersionVirtualMachineExist(mainWindow, JVMVersion);
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

    async sendListen(mainWindow, text, type = null, error = false) {
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
