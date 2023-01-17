const { exec } = require('child_process');
const { FsManager } = require('./fs-manager');
const { ZshrcManager } = require('./zshrc-manager');
const { app } = require('electron');
const { globalFunctions } = require('./global-shared');

class ChildProcess {
    colors = [
        {
            code: '[0m',
            color: 'none'
        },
        {
            code: '[0;30m',
            color: '#000000'
        },
        {
            code: '[0;31m',
            color: '#FF0000'
        },
        {
            code: '[1;30m',
            color: '#808080'
        },
        {
            code: '[1;31m',
            color: '#FFCCCB'
        },
        {
            code: '[0;32m',
            color: '#008000'
        },
        {
            code: '[1;32m',
            color: '#90EE90'
        },
        {
            code: '[0;33m',
            color: '#A52A2A'
        },
        {
            code: '[1;33m',
            color: '#FFFF00'
        },
        {
            code: '[0;34m',
            color: '#0000FF'
        },
        {
            code: '[1;34m',
            color: '#ADD8E6'
        },
        {
            code: '[0;35m',
            color: '#800080'
        },
        {
            code: '[1;35m',
            color: '#8467D7'
        },
        {
            code: '[0;36m',
            color: '#00FFFF'
        },
        {
            code: '[1;36m',
            color: '#E0FFFF'
        },
        {
            code: '[0;37m',
            color: '#D3D3D3'
        },
        {
            code: '[1;37m',
            color: '#FFFFFF'
        }
    ];

    settingsJSON = null;
    stdoutOn = null;
    stderrOn = null;
    execClose = null;
    childProcessExec;
    consoleType = {
        command: 'command',
        output: 'output',
        error: 'error',
        info: 'info'
    };

    constructor() {
    }


    async execCommandPrivate(command, callback = () => {
    }, mainWindow, options = {
        stdout: 'inherit',
        encoding: 'utf8',
        signal: null,
        timeout: 0,
        maxBuffer: 10000 * 10000, //increase here
        killSignal: 'SIGTERM',
        cwd: null,
        env: null,
        shell: '/bin/zsh'
    }) {
        return new Promise(async (resolve) => {
            this.settingsJSON = await globalFunctions.getSettingsJSON;
            options.cwd = this.settingsJSON.current_path;
            this.controller = new AbortController();
            const { signal } = this.controller;
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
                            road: 'child_process.js:execCommand:exec'
                        });
                        return resolve(false);
                    }
                    callback({
                        data: stderr,
                        error: false,
                        type: 'stdout:end',
                        signal: options.signal,
                        road: 'child_process.js:execCommand:exec'
                    });
                    callback({
                        data: stdout,
                        error: false,
                        type: 'stderr:end',
                        signal: options.signal,
                        road: 'child_process.js:execCommand:exec'
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
                    data: dat.join('\n'),
                    error: false,
                    signal: options.signal,
                    type: 'stdout'
                });
            });

            if (this.stderrOn !== null) {
                await this.childProcessExec.stderr.removeListener('data');
                this.stderrOn = null;
            }
            this.stderrOn = this.childProcessExec.stderr.on('data', async (data) => {
                const dat = await this.coloredTerminal(data);
                callback({
                    data: dat.join('\n'),
                    error: false,
                    signal: options.signal,
                    type: 'stderr'
                });
            });
            if (this.execClose !== null) {
                await this.childProcessExec.removeListener('close');
                this.execClose = null;
            }
            this.execClose = this.childProcessExec.on('close', exitCode => {
                setTimeout(() => {
                    callback({
                        data: false,
                        error: false,
                        type: 'close'
                    });
                    this.execClose = null;
                    this.stdoutOn = null;
                    this.stderrOn = null;
                }, 1000);
            });

        });
    }

    async coloredTerminal(data) {
        return new Promise(async (resolve) => {
            const split = data.replace(/ /g, '&nbsp;').split(/\n/g);
            let coloredText = '';
            const dat = [];
            await split.reduce((lastPromise, s, currentIndex, array) => {
                return lastPromise.then(async () => {
                    let cloneS = s;
                    let text = '';
                    let t = '';
                    const regex = /(\[[0-9][0-9]?m)(?<=\[[0-9][0-9]?m)[\ \.\[\]\:\/\,\&\;\(\)\#\$\}\{\_\+\*\?\%\^\=\"\'\-a-zA-Z0-9]+(?=\[[0-9][0-9]?m)(\[[0-9][0-9]?m)/g;
                    let m;
                    regex.lastIndex = 0;
                    await (async () => {
                        while ((m = regex.exec(s)) !== null) {
                            if (m.index === regex.lastIndex) {
                                regex.lastIndex++;
                            }
                            m.forEach((match, groupIndex) => {
                                if (groupIndex === 0) {
                                    text = text.replace(match, '');
                                    coloredText = match;
                                    t = match;
                                } else if (groupIndex === 1) {
                                    if (match === '[33m') {
                                        coloredText = coloredText.replace(match, `<div style="color:#b28122!important;">`);
                                    } else if (match === '[2m') {
                                        coloredText = coloredText.replace(match, `<div style="color:#837a65!important;">`);
                                    } else if (match === '[41m') {
                                        coloredText = coloredText.replace(match, `<div style="color:#9c937a!important;background: #cc241c!important;height: 18px;">`);
                                    } else {
                                        coloredText = coloredText.replace(match, `<div style="color:#9c937a!important;">`);
                                    }
                                } else if (groupIndex === 2) {
                                    if (match === '[39m') {
                                        coloredText = coloredText.replace(match, `</div>`);
                                    } else if (match === '[22m') {
                                        coloredText = coloredText.replace(match, '</div>');
                                    } else if (match === '[49m') {
                                        coloredText = coloredText.replace(match, '</div>');
                                    } else {
                                        coloredText = coloredText.replace(match, '</div>');
                                    }
                                }
                            });
                            cloneS = cloneS.replace(t, coloredText);
                        }
                    })();
                    cloneS = `<div style="display: flex!important;">${ cloneS }</div>`;
                    const regexFind = /(\/*\[[0-1];[0-9][0-9]m\/*)/g.exec(cloneS);
                    if (regexFind) {
                        const find = this.colors.find(o => o.code === regexFind[0]);
                        if (find) {
                            dat.push('<label id="color-label" style="color:' + find.color + '">' + cloneS.replace(/(\/*\[[0-1];[0-9][0-9]m\/*)/g, '').replace(/(\/*\[[0-1]m\/*)/g, '') + '</label>');
                        } else {
                            dat.push('<label id="color-label" style="color:#a39f9f">' + cloneS.replace(/(\/*\[[0-1];[0-9][0-9]m\/*)/g, '').replace(/(\/*\[[0-1]m\/*)/g, '') + '</label>');
                        }
                    } else {
                        dat.push('<label id="color-label-no-color" style="color:#a39f9f">' + cloneS + '</label>');
                    }
                });
            }, Promise.resolve()).finally(async () => {
                return resolve(dat);
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
                await this.sendListen(mainWindow, command, this.consoleType.command, false);
            }
            const outputs = {
                stderrEnd: null,
                stdoutEnd: null,
                errorEnd: null,
                error: false
            };
            const exportText = await new ZshrcManager().getExports();
            console.log('command: ', command);
            await this.execCommandPrivate(exCommand !== null ? exportText + '\n' + exCommand + '\n' + command : exportText + '\n' + command, async (event) => {
                if (event.error) {
                    if (print.endError && errorMessage) {
                        await this.sendListen(mainWindow, errorMessage, this.consoleType.error, true);
                    }

                    outputs.error = true;
                    outputs.errorEnd = event.message;
                    callback({
                        data: false,
                        error: true,
                        type: 'error:end',
                        message: event.message,
                        signal: event.signal
                    });
                }

                if (event.type === 'stdout') {
                    if (print.liveOutput) {
                        await this.sendListen(mainWindow, event.data, this.consoleType.output, true);
                    }
                    callback({
                        data: event.data,
                        error: false,
                        type: 'stdout',
                        signal: event.signal
                    });
                }

                if (event.type === 'stderr') {
                    if (print.liveOutput) {
                        await this.sendListen(mainWindow, event.data, this.consoleType.output, true);
                    }
                    callback({
                        data: event.data,
                        error: false,
                        type: 'stderr',
                        signal: event.signal
                    });
                }

                if (event.type === 'stdout:end') {
                    let text = event.data;
                    outputs.stdoutEnd = text;
                    if (print.endOutput && text.length < 780) {
                        await this.sendListen(mainWindow, text, this.consoleType.output, true);
                    }

                    callback({
                        data: event.data,
                        error: false,
                        type: 'stdout:end',
                        signal: event.signal
                    });
                }

                if (event.type === 'stderr:end') {
                    let text = event.data;
                    outputs.stderrEnd = text;
                    if (print.endOutput && text.length < 780) {
                        await this.sendListen(mainWindow, text, this.consoleType.output, true);
                    }
                    callback({
                        data: event.data,
                        error: false,
                        type: 'stderr:end',
                        signal: event.signal
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

                    return resolve({
                        error: outputs.error,
                        data: data,
                        message: outputs.errorEnd,
                        signal: event.signal
                    });
                }
            }, mainWindow);
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


module.exports = { ChildProcess };
