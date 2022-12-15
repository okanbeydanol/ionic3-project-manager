const {ChildProcess} = require('./child_process');

class GradleManager {
    childManager = new ChildProcess();

    constructor() {
    }

    async getGradleVersion(mainWindow) {
        return new Promise(async (resolve) => {
            await this.childManager.execCommand('eval "$(~/homebrew/bin/brew shellenv)"&&gradle -v', (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Gradle not install!'});
                }

                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: new RegExp(/(\/*Gradle \S+\/*)/).exec(event.data.trim())[0].split('Gradle ')[1]
                    });
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return resolve({
                        error: false,
                        data: new RegExp(/(\/*Gradle \S+\/*)/).exec(event.data.trim())[0].split('Gradle ')[1]
                    });
                }
            }, mainWindow);
        });
    }

    async installGradle(mainWindow) {
        return new Promise(async (resolve) => {
            const command = 'eval "$(~/homebrew/bin/brew shellenv)"&&brew reinstall gradle --force';
            await this.childManager.execCommand(command, (event) => {
                if (event.error) {
                    return resolve({error: true, data: null, message: 'Gradle not install!'});
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


module.exports = {GradleManager};
