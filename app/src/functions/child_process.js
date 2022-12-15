const {exec, execSync} = require('child_process');
const path = require('path');
const {FsManager} = require('./fs-manager');
const config_path = path.join(__dirname, '../config');

class ChildProcess {
    colors = [
        {
            code: '[0m',
            color: 'none',
        },
        {
            code: '[0;30m',
            color: '#000000',
        },
        {
            code: '[0;31m',
            color: '#FF0000',
        },
        {
            code: '[1;30m',
            color: '#808080',
        },
        {
            code: '[1;31m',
            color: '#FFCCCB',
        },
        {
            code: '[0;32m',
            color: '#008000',
        },
        {
            code: '[1;32m',
            color: '#90EE90',
        },
        {
            code: '[0;33m',
            color: '#A52A2A',
        },
        {
            code: '[1;33m',
            color: '#FFFF00',
        },
        {
            code: '[0;34m',
            color: '#0000FF',
        },
        {
            code: '[1;34m',
            color: '#ADD8E6',
        },
        {
            code: '[0;35m',
            color: '#800080',
        },
        {
            code: '[1;35m',
            color: '#8467D7',
        },
        {
            code: '[0;36m',
            color: '#00FFFF',
        },
        {
            code: '[1;36m',
            color: '#E0FFFF',
        },
        {
            code: '[0;37m',
            color: '#D3D3D3',
        },
        {
            code: '[1;37m',
            color: '#FFFFFF',
        }
    ]

    config_path = path.join(__dirname, '../config');
    stdoutOn = null;
    stderrOn = null;
    execClose = null;
    config = null;
    childProcessExec;
    consoleType = {
        command: "command",
        output: "output",
        error: "error",
        info: "info"
    }

    constructor() {
    }


    async execCommandPrivate(command, callback = () => {
    }, mainWindow, options = {
        stdout: 'inherit',
        encoding: 'utf8',
        signal: null,
        timeout: 0,
        maxBuffer: 200 * 1024, //increase here
        killSignal: 'SIGTERM',
        cwd: null,
        env: null
    }) {

        return new Promise(async (resolve) => {
            await this.checkCommand(command, mainWindow);
            this.controller = new AbortController();
            const {signal} = this.controller;
            options.signal = options.signal ? options.signal : signal;
            this.childProcessExec = exec
            (
                command,
                options
                , async (error, stdout, stderr) => {
                    if (error) {
                        callback({
                            data: false,
                            error: true,
                            type: 'error:end',
                            message: error.message,
                            road: 'child_process.js:execCommand:exec',
                        });
                        return resolve(false);
                    }

                    callback({
                        data: stderr,
                        error: false,
                        type: 'stdout:end',
                        signal: options.signal,
                        road: 'child_process.js:execCommand:exec',
                    });
                    callback({
                        data: stdout,
                        error: false,
                        type: 'stderr:end',
                        signal: options.signal,
                        road: 'child_process.js:execCommand:exec',
                    });
                    return resolve(true);
                });
            this.childProcessExec.stdout.setEncoding('utf8');
            this.childProcessExec.stderr.setEncoding('utf8');

            if (this.stdoutOn !== null) {
                await this.childProcessExec.stdout.removeListener('data');
                this.stdoutOn = null;
            }
            this.stdoutOn = this.childProcessExec.stdout.on('data', async (data) => {
                const dat = await this.coloredTerminal(data);
                callback({
                    data: dat.join('\n').trimStart(),
                    error: false,
                    signal: options.signal,
                    type: 'stdout',
                });
            });

            if (this.stderrOn !== null) {
                await this.childProcessExec.stderr.removeListener('data');
                this.stderrOn = null;
            }
            this.stderrOn = this.childProcessExec.stderr.on('data', async (data) => {
                const dat = await this.coloredTerminal(data);
                callback({
                    data: dat.join('\n').trimStart(),
                    error: false,
                    signal: options.signal,
                    type: 'stderr',
                });
            });
            if (this.execClose !== null) {
                await this.childProcessExec.removeListener('close');
                this.execClose = null;
            }
            this.execClose = this.childProcessExec.on('close', exitCode => {
                callback({
                    data: false,
                    error: false,
                    type: 'close'
                });
                this.execClose = null;
                this.stdoutOn = null;
                this.stderrOn = null;
            });

        });
    }

    async coloredTerminal(data) {
        return new Promise((resolve) => {
            const split = data.trimStart().split('\n');
            const dat = [];
            split.map((s) => {
                const regexFind = /(\/*\[[0-1];[0-9][0-9]m\/*)/g.exec(s.trimStart());
                if (regexFind) {
                    const find = this.colors.find(o => o.code === regexFind[0]);
                    if (find) {
                        dat.push('<label id="color-label" style="color:' + find.color + '">' + s.replace(/(\/*\[[0-1];[0-9][0-9]m\/*)/g, '').replace(/(\/*\[[0-1]m\/*)/g, '').trimStart() + '</label>');
                    } else {
                        dat.push('<label id="color-label" style="color:#a39f9f">' + s.replace(/(\/*\[[0-1];[0-9][0-9]m\/*)/g, '').replace(/(\/*\[[0-1]m\/*)/g, '').trimStart() + '</label>');
                    }
                } else {
                    dat.push('<label id="color-label-no-color" style="color:#a39f9f">' + s.trimStart() + '</label>');
                }
            });
            return resolve(dat);
        });
    }

    async checkCommand(command, mainWindow) {
        return new Promise(async (resolve) => {
            this.config = await new FsManager().readFile(config_path + '/settings.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            }).then((d) => {
                return JSON.parse(d.data);
            });
            const cdRegex = /((cd +~[^&]+))|((cd +~))|((cd +.[(\/\S+)][^&]+))|((cd +[.][.][(\/\w+)]+))|((cd [(\/\w+)]+))|((cd [(\/\w+)]+))|((cd +[.][.]))/g;
            let m;
            const paths = [];
            console.log('%c command', 'background: #222; color: #bada55', command);
            while ((m = cdRegex.exec(command.trimStart())) !== null) {
                if (m.index === cdRegex.lastIndex) {
                    cdRegex.lastIndex++;
                }
                m.forEach((match, groupIndex) => {
                    if (match && !paths.find(o => o === match)) {
                        paths.push(match)
                    }
                });
            }
            if (paths.length > 0) {
                for await (let path of paths) {
                    let replace = path.trim().replace('cd ', '').trim();
                    if (replace[replace.length - 1] === '/') {
                        replace = replace.slice(0, replace.length - 2);
                    }
                    const split = replace.split('/');
                    await split.reduce((lastPromise, s, currentIndex, array) => {
                        return lastPromise.then(async () => {
                            if (s === '') {
                                this.config.currentPath = split.join('/');
                                await new FsManager().writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                            } else if (s === '..') {
                                this.config.currentPath = '/' + this.config.currentPath.split('/').slice(1, this.config.currentPath.split('/').length - 1).join('/');
                                await new FsManager().writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                            } else if (s === '~') {
                                const checkH = await this.checkHome();
                                this.config.currentPath = checkH.data;
                                await new FsManager().writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                            } else {
                                const currentDir = await new FsManager().readDir(this.config.currentPath)
                                const findIndex = currentDir.data.findIndex((o) => o.name.trim() === s.trim());
                                if (findIndex !== -1 && currentDir.data[findIndex].isDirectory) {
                                    this.config.currentPath = this.config.currentPath + '/' + s;
                                    await new FsManager().writeFile(this.config_path + '/settings.json', JSON.stringify(this.config));
                                }
                            }
                            return resolve(this.config.currentPath);
                        })
                    }, Promise.resolve()).finally(async () => {
                        mainWindow.webContents.send('command:listen', {
                            error: false,
                            data: this.config.currentPath,
                            type: 'folder_change'
                        });
                    });
                }
            } else {
                this.config = await new FsManager().readFile(this.config_path + '/settings.json');
                return resolve({error: false, data: 'cd ' + this.config.currentPath + '&&' + command})
            }
        });
    }

    async checkHome() {
        return new Promise((resolve) => {
            const home = execSync('echo ~', {encoding: 'utf8'});
            if (home === '') {
                return resolve({
                    data: home,
                    error: true,
                    type: 'stdout:end',
                    road: 'child_process.js:execCommand:exec'
                });
            }
            return resolve({
                data: home,
                error: false,
                type: 'stdout:end',
                road: 'child_process.js:execCommand:exec'
            });
        });
    }


    async executeCommand(mainWindow, command, exCommand = null, errorMessage = null, callback = () => {
    }, print = {
        command: true,
        liveOutput: true,
        endOutput: false,
        endError: true,
        info: true
    }) {
        return new Promise(async (resolve) => {
            if (print.command) {
                await this.sendListen(mainWindow, command, this.consoleType.command, false)
            }
            const outputs = {
                stderrEnd: null,
                stdoutEnd: null,
                errorEnd: null,
                error: false,
            }
            await this.execCommandPrivate(exCommand !== null ? exCommand + '&&' + command : command, async (event) => {
                if (event.error) {
                    if (print.endError && errorMessage) {
                        await this.sendListen(mainWindow, errorMessage, this.consoleType.error, true)
                    }

                    outputs.error = true;
                    outputs.errorEnd = event.message;
                    callback({
                        data: false,
                        error: true,
                        type: 'error:end',
                        message: event.message,
                    });
                }

                if (event.type === 'stdout') {
                    if (print.liveOutput) {
                        await this.sendListen(mainWindow, event.data.trim(), this.consoleType.output, true)
                    }
                    callback({
                        data: event.data.trim(),
                        error: false,
                        type: 'stdout',
                    });
                }

                if (event.type === 'stderr') {
                    if (print.liveOutput) {
                        await this.sendListen(mainWindow, event.data.trim(), this.consoleType.output, true)
                    }
                    callback({
                        data: event.data.trim(),
                        error: false,
                        type: 'stderr',
                    });
                }

                if (event.type === 'stdout:end') {
                    outputs.stdoutEnd = event.data.trim();
                    if (print.endOutput) {
                        await this.sendListen(mainWindow, event.data.trim(), this.consoleType.output, true)
                    }

                    callback({
                        data: event.data.trim(),
                        error: false,
                        type: 'stdout:end',
                    });
                }

                if (event.type === 'stderr:end') {
                    outputs.stderrEnd = event.data.trim();
                    if (print.endOutput) {
                        await this.sendListen(mainWindow, event.data.trim(), this.consoleType.output, true)
                    }
                    callback({
                        data: event.data.trim(),
                        error: false,
                        type: 'stderr:end',
                    });
                }
                if (event.type === 'close') {
                    let data = '';
                    if (outputs.stdoutEnd && outputs.stderrEnd) {
                        data = outputs.stdoutEnd + '\n' + outputs.stderrEnd;
                    } else if (outputs.stdoutEnd) {
                        data = outputs.stdoutEnd;
                    } else {
                        data = outputs.stderrEnd;
                    }
                    return resolve({error: outputs.error, data: data, message: outputs.errorEnd})
                }
            }, mainWindow)
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


module.exports = {ChildProcess};
