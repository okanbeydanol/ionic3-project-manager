function StartWatcher(callback = () => {
}, paths = [], listen = [ 'add', 'addDir', 'change', 'unlink', 'unlinkDir', 'error', 'ready', 'raw' ]) {
    const chokidar = require('chokidar');
    if (paths.length > 0) {
        const watcher = chokidar.watch(paths, {
            persistent: true,
            ignoreInitial: true,
            alwaysState: true
        });
        if (listen.includes('add')) {
            watcher
                .on('add', (path) => {
                    callback('add', path);
                });
        }
        if (listen.includes('addDir')) {
            watcher
                .on('addDir', (path) => {
                    callback('addDir', path);
                });
        }
        if (listen.includes('change')) {
            watcher
                .on('change', (path) => {
                    callback('change', path);
                });
        }
        if (listen.includes('unlink')) {
            watcher
                .on('unlink', (path) => {
                    callback('unlink', path);
                });
        }
        if (listen.includes('unlinkDir')) {
            watcher
                .on('unlinkDir', (path) => {
                    callback('unlinkDir', path);
                });
        }
        if (listen.includes('error')) {
            watcher
                .on('error', (error) => {
                    callback('error', path);
                });
        }
        if (listen.includes('ready')) {
            watcher
                .on('ready', (path) => {
                    callback('ready', path);
                });
        }
        if (listen.includes('ready')) {
            watcher
                .on('raw', (path) => {
                    callback('raw', path);
                });
        }
    }
}

module.exports = {StartWatcher};
