const {FsManager} = require("./fs-manager");
const path = require("path");
const config_path = path.join(__dirname, '../config');
const {homedir} = require('os');

class ZshrcManager {
    fsManager = new FsManager();
    zshrc;
    consoleType = {
        command: "command",
        output: "output",
        error: "error",
        info: "info"
    }

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
                    'export NVM_DIR="$HOME/.nvm"&&[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm&&[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion'
                zshrc = await this.fsManager.writeFile(path, append, {
                    encoding: 'utf8',
                    flag: 'w',
                    mode: 0o666,
                    signal: null
                }, true);
                console.log('%c zshrc', 'background: #222; color: #bada55', zshrc);

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
            let ex = '';
            init.data.split('\n').map((e) => {
                if (ex === '') {
                    ex = e;
                } else {
                    ex = ex + '&&' + e;
                }
            })
            return resolve(ex);
        });
    }

    getZshrcPath() {
        return homedir() + '/.szshrc';
    }

}


module.exports = {ZshrcManager};

