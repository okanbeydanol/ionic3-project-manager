const {
    existsSync,
    mkdir,
    writeFile,
    stat,
    realpath,
    access,
    constants,
    appendFile,
    copyFile,
    cp,
    open,
    opendir,
    readdir,
    readFile,
    rename,
    rm,
    rmdir
} = require('fs');

class FsManager {
    constructor() {
    }

    pathExist(path) {
        if (path !== null && path !== '') {
            return {data: existsSync(path), error: false};

        }
        return {data: false, error: false};
    }

    async tryAccess(path) {
        return new Promise((resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist',
                    road: 'fs-manager:canAccess:pathExist'
                });
            }
            access(path, constants.R_OK | constants.W_OK, (err) => {
                if (err !== null) {

                    return resolve({
                        data: null,
                        error: true,
                        message: err.message,
                        road: 'fs-manager:canAccess:access'
                    });
                }
                return resolve({data: true, error: false});
            });
        });
    }

    addEndingSlash(path) {
        const exist = this.pathExist(path);
        if (!exist.data) {
            return {
                data: false,
                error: true,
                message: 'Path does`nt exist!',
                road: 'fs-manager:addEndingSlash:pathExist'
            };
        }

        let text = path;
        if (text.slice(-1) !== '/') {
            return {data: text + '/', error: false};
        }

        return {data: text, error: false};
    }

    removeEndingSlash(path) {
        const exist = this.pathExist(path);
        if (!exist.data) {
            return {
                data: null,
                error: true,
                message: 'Path does`nt exist!',
                road: 'fs-manager:removeEndingSlash:pathExist'
            };
        }
        let text = path;
        if (text.slice(-1) === '/') {
            return text.substring(0, text.length - 1);
        }

        return {data: text, error: false};
    }

    async getRealPath(path) {
        return new Promise((resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist',
                    road: 'fs-manager:getRealPath:pathExist'
                });
            }
            realpath(path, (err, resolvedPath) => {
                if (err !== null) {
                    return resolve({
                        data: null,
                        error: true,
                        message: err.message,
                        road: 'fs-manager:getRealPath:realpath'
                    });
                }
                return resolve({data: resolvedPath, error: false});
            });
        });
    }


    async appendFile(path, data) {
        return new Promise(async (resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist',
                    road: 'fs-manager:appendFile:pathExist'
                });
            }
            const stat = await this.getStats(path);
            if (!stat.data.isFile()) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'You are trying to append folder instead of file!', road: 'fs-manager:appendFile:isFile'
                });
            }
            appendFile(path, data, {encoding: 'utf8', mode: 0o666, flag: 'a'}, (err) => {
                if (err !== null) {
                    return resolve({
                        data: null,
                        error: true,
                        message: err.message,
                        road: 'fs-manager:appendFile:appendFile'
                    });
                }
                return resolve({data: true, error: false});
            });
        });
    }

    async getStats(path) {
        return new Promise((resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist!',
                    road: 'fs-manager:getStats:pathExist'
                });
            }
            stat(path, (err, stats) => {
                if (err !== null) {
                    resolve({data: null, error: true, message: err.message, road: 'fs-manager:getStats:stat'});
                }
                resolve({data: stats, error: false});
            });
        });
    }

    async copyFile(path, dest) {
        return new Promise(async (resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist!',
                    road: 'fs-manager:copyFile:pathExist'
                });
            }
            const stat = await this.getStats(path);
            if (!stat.data.isFile()) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'You are trying to copy folder instead of file!',
                    road: 'fs-manager:copyFile:getStats'
                });
            }
            copyFile(path, dest, (err) => {
                if (err !== null) {
                    return resolve({
                        data: null,
                        error: true,
                        message: err.message,
                        road: 'fs-manager:copyFile:copyFile'
                    });
                }
                return resolve({data: true, error: false});
            });
        });
    }


    async copyDirectory(path, dest) {
        return new Promise(async (resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist!',
                    road: 'fs-manager:copyDirectory:pathExist'
                });
            }
            const stat = await this.getStats(path);
            if (!stat.data.isDirectory()) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'You are trying to copy file instead of folder!',
                    road: 'fs-manager:copyDirectory:getStats'
                });
            }
            cp(path, dest, (err) => {
                if (err !== null) {
                    return resolve({
                        data: null,
                        error: true,
                        message: err.message,
                        road: 'fs-manager:copyDirectory:cp'
                    });
                }
                return resolve({data: true, error: false});
            });
        });
    }

    async mkdir(dest, name, options = {recursive: true}) {
        return new Promise(async (resolve) => {
            if (!name || name === '') {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Folder name cannot be empty!',
                    road: 'fs-manager:mkdir:name'
                });
            }
            const exist = this.pathExist(dest);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist!',
                    road: 'fs-manager:mkdir:pathExist'
                });
            }
            const stat = await this.getStats(dest);
            if (stat.error) {
                return resolve({
                    data: null,
                    error: true,
                    message: stat.error.message,
                    road: 'fs-manager:mkdir:getStats'
                });
            }
            if (!stat.data.isDirectory()) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Your dest is not valid directory!',
                    road: 'fs-manager:mkdir:isDirectory'
                });
            }
            let path = this.addEndingSlash(dest);
            if (path.error) {
                return resolve({
                    data: null,
                    error: true,
                    message: path.error.message,
                    road: 'fs-manager:mkdir:addEndingSlash'
                });
            }
            mkdir(path.data + name, options, (err, path) => {
                if (err !== null) {
                    return resolve({data: null, error: true, message: err.message, road: 'fs-manager:mkdir:mkdir'});
                }
                return resolve({data: path, error: false});
            });
        });
    }

    async openFile(path, flag = 'a+') {
        return new Promise(async (resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist!',
                    road: 'fs-manager:openFile:pathExist'
                });
            }
            const stat = await this.getStats(path);
            if (stat.error) {
                return resolve({
                    data: null,
                    error: true,
                    message: stat.error.message,
                    road: 'fs-manager:openFile:getStats'
                });
            }
            if (!stat.data.isFile()) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Your path is not valid file!',
                    road: 'fs-manager:openFile:isFile'
                });
            }

            open(path, flag, (err, fd) => {
                if (err !== null) {
                    return resolve({data: null, error: true, message: err.message, road: 'fs-manager:openFile:open'});
                }
                return resolve({data: fd, error: false});
            });
        });
    }

    async openDir(path, options = {encoding: 'utf8'}) {
        return new Promise(async (resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist!',
                    road: 'fs-manager:openDir:pathExist'
                });
            }
            const stat = await this.getStats(path);
            if (stat.error) {
                return resolve({
                    data: null,
                    error: true,
                    message: stat.error.message,
                    road: 'fs-manager:openDir:getStats'
                });
            }
            if (!stat.data.isDirectory()) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Your path is not valid folder!',
                    road: 'fs-manager:openDir:isDirectory'
                });
            }

            opendir(path, options, (err, fd) => {
                if (err !== null) {
                    return resolve({
                        data: null,
                        error: true,
                        message: err.message,
                        road: 'fs-manager:openDir:opendir'
                    });
                }
                return resolve({data: fd, error: false});
            });
        });
    }

    async readDir(path, options = {encoding: 'utf8', withFileTypes: true}) {
        return new Promise(async (resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist!',
                    road: 'fs-manager:readDir:pathExist'
                });
            }
            const stat = await this.getStats(path);
            if (stat.error) {
                return resolve({
                    data: null,
                    error: true,
                    message: stat.error.message,
                    road: 'fs-manager:readDir:getStats'
                });
            }
            if (!stat.data.isDirectory()) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Your path is not valid folder!',
                    road: 'fs-manager:readDir:isDirectory'
                });
            }

            readdir(path, options, (err, files) => {
                if (err !== null) {
                    return resolve({
                        data: null,
                        error: true,
                        message: err.message,
                        road: 'fs-manager:readDir:readdir'
                    });
                }
                const data = [];
                files.map((value, index, array) => {
                    data.push({name: value.name, isFile: value.isFile(), isDirectory: value.isDirectory()});
                });
                return resolve({data: data, error: false});
            });
        });
    }

    async readFile(path, options = {encoding: null, flag: 'r', signal: null}) {
        return new Promise(async (resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist!',
                    road: 'fs-manager:readFile:pathExist'
                });
            }
            const stat = await this.getStats(path);
            if (stat.error) {
                return resolve({
                    data: null,
                    error: true,
                    message: stat.error.message,
                    road: 'fs-manager:readFile:getStats'
                });
            }
            if (!stat.data.isFile()) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Your path is not valid file!',
                    road: 'fs-manager:readFile:isFile'
                });
            }
            let controller = null;
            if (options.signal === null) {
                controller = new AbortController();
                const {signal} = controller;
                options.signal = signal;
            }
            readFile(path, options, (err, data) => {
                if (err !== null) {
                    return resolve({
                        data: null, error: true, message: err.message, road: 'fs-manager:readFile:readFile'
                    });
                }
                return resolve({data: data, error: false, controller: controller});
            });
        });
    }

    async rename(path, newName) {
        return new Promise(async (resolve) => {
            if (!newName || newName === '') {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Folder name cannot be empty!',
                    road: 'fs-manager:rename:newName'
                });
            }
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist!',
                    road: 'fs-manager:rename:pathExist'
                });
            }
            const stat = await this.getStats(path);
            if (stat.error) {
                return resolve({
                    data: null,
                    error: true,
                    message: stat.error.message,
                    road: 'fs-manager:rename:getStats'
                });
            }
            const removeSlash = this.removeEndingSlash(path);
            if (removeSlash.error) {
                return resolve({
                    data: null,
                    error: true,
                    message: stat.error.message,
                    road: 'fs-manager:rename:removeEndingSlash'
                });
            }
            let newPath = null;
            const split = removeSlash.data.split('/');
            const last = split[split.length - 1];
            newPath = removeSlash.data.replace(last, newName);
            rename(path, newPath, (err, data) => {
                if (err !== null) {
                    return resolve({data: null, error: true, message: err.message, road: 'fs-manager:rename:rename'});
                }
                return resolve({data: data, error: false});
            });
        });
    }

    async rmDir(path) {
        return new Promise(async (resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist!',
                    road: 'fs-manager:rmDir:pathExist'
                });
            }
            const stat = await this.getStats(path);
            if (stat.error) {
                return resolve({
                    data: null,
                    error: true,
                    message: stat.error.message,
                    road: 'fs-manager:rmDir:getStats'
                });
            }
            if (!stat.data.isDirectory()) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Your path is not valid directory!',
                    road: 'fs-manager:rmDir:isDirectory'
                });
            }
            rmdir(path, {
                recursive: true,
            }, (err) => {
                if (err !== null) {
                    return resolve({data: null, error: true, message: err.message, road: 'fs-manager:rmDir:rmdir'});
                }
                return resolve({data: null, error: false});
            });
        });
    }

    async rmFile(path, options = {force: true, recursive: true}) {
        return new Promise(async (resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist!',
                    road: 'fs-manager:rmFile:pathExist'
                });
            }
            const stat = await this.getStats(path);
            if (stat.error) {
                return resolve({
                    data: null,
                    error: true,
                    message: stat.error.message,
                    road: 'fs-manager:rmFile:getStats'
                });
            }
            if (!stat.data.isFile()) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Your path is not valid file!',
                    road: 'fs-manager:rmFile:isFile'
                });
            }
            rm(path, options, (err) => {
                if (err !== null) {
                    return resolve({data: null, error: true, message: err.message, road: 'fs-manager:rmFile:rm'});
                }
                return resolve({data: null, error: false});
            });
        });
    }

    async writeFile(path, data, options = {encoding: 'utf8', flag: 'w', mode: 0o666, signal: null}) {
        return new Promise(async (resolve) => {
            const exist = this.pathExist(path);
            if (!exist.data) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Path does`nt exist!',
                    road: 'fs-manager:writeFile:pathExist'
                });
            }
            const stat = await this.getStats(path);
            if (stat.error) {
                return resolve({
                    data: null,
                    error: true,
                    message: stat.error.message,
                    road: 'fs-manager:writeFile:getStats'
                });
            }
            if (!stat.data.isFile()) {
                return resolve({
                    data: null,
                    error: true,
                    message: 'Your path is not valid file!',
                    road: 'fs-manager:writeFile:isFile'
                });
            }
            let controller = null;
            if (options.signal === null) {
                controller = new AbortController();
                const {signal} = controller;
                options.signal = signal;
            }
            writeFile(path, data, options, (err) => {
                if (err !== null) {
                    return resolve({
                        data: null,
                        error: true,
                        message: err.message,
                        road: 'fs-manager:writeFile:writeFile'
                    });
                }
                return resolve({data: null, error: false, controller: controller});
            });
        });
    }
}

module.exports = {FsManager};
