const { FsManager } = require('./fs-manager');
const { app } = require('electron');

class ZshrcManager {
    fsManager = new FsManager();
    zshrc;
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {

    }

    async init() {
        return new Promise(async (resolve) => {
            const path = this.getZshrcPath();
            let zshrc = await this.fsManager.readFile(path, {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            });
            if (zshrc.error) {
                const append = 'eval "$(~/homebrew/bin/brew shellenv)"\n' +
                    'export NVM_DIR="$HOME/.nvm"&&[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm&&[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion';
                zshrc = await this.fsManager.writeFile(path, append, {
                    encoding: 'utf8',
                    flag: 'w',
                    mode: 0o666,
                    signal: null
                }, true);
            }
            this.zshrc = zshrc;
            return resolve(this.zshrc);
        });
    }

    async getExports() {
        return new Promise(async (resolve) => {
            const init = await this.init();
            if (init.error) {
                return resolve(init);
            }
            const regex = /(\/*eval .+\/*)|(\/*^export.+\n+\[.+\n+\[.+\/*)|(\/*export.*(\n)\/*)/gmi;
            let m;
            let a = [];
            while ((m = regex.exec(init.data)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                m.forEach((match) => {
                    if (typeof match !== 'undefined' && !a.includes(match.trim()) && match.trim() !== '') {
                        a.push(match.trim());
                    }
                });

            }
            const as = a.join('\n');
            return resolve(as);
        });
    }

    getZshrcPath() {
        return app.getPath('home') + '/.szshrc';
    }

    async getZshrcContent() {
        return new Promise(async (resolve) => {
            const path = this.getZshrcPath();
            let zshrc = await this.fsManager.readFile(path, {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            });
            return resolve(zshrc);
        });
    }
}


module.exports = { ZshrcManager };

