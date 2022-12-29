const { FsManager } = require('./fs-manager');
const path = require('path');
const config_path = path.join(__dirname, '../config');
const fsManager = new FsManager();

const globalFunctions = {
    config: (async () => {
        return await readSettingsJson();
    })(),
    get getConfig() {
        return (async () => {
            return await this.config;
        })();
    },
    set setConfig(value) {
        this.config = value;
        (async () => {
            await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(value));
        })();
    },
    get getPassword() {
        return (async () => {
            const data = await this.config;
            return data.password;
        })();
    },
    set setPassword(value) {
        return (async () => {
            const data = await this.config;
            Object.assign(data, { password: value });
            return await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(data));
        })();
    },
    get getAccessToken() {
        return (async () => {
            const data = await this.config;
            return data.access_token;
        })();
    },
    set setAccessToken(value) {
        return (async () => {
            const data = await this.config;
            data.access_token = value;
            return await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(data));
        })();
    },
    get getKeystore() {
        return (async () => {
            const data = await this.config;
            const { alias, pass, path } = data.keystore;
            return { alias, pass, path } = data.keystore;
        })();
    },
    set setKeystore(data) {
        return (async () => {
            const data = await this.config;
            data.keystore = data;
            return await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(data));
        })();
    },
    get getFolders() {
        return (async () => {
            const data = await this.config;
            const {
                WWW,
                NODE_MODULES,
                PLUGINS,
                ANDROID,
                IOS,
                PACKAGE_JSON,
                PACKAGE_LOCK_JSON,
                CONFIG_XML,
                AAB: { AAB_OUTPUT_FOLDER, AAB_FILENAME, AAB_FILENAME_SIGNED },
                APK: { APK_OUTPUT_FOLDER, APK_FILENAME, APK_FILENAME_SIGNED },
                MERGED_NATIVE_LIB,
                GIT_FOLDER,
                GIT_CONFIG_FILE,
                GIT_CURRENT_BRANCH_FILE
            } = data.folders;
            return {
                WWW,
                NODE_MODULES,
                PLUGINS,
                ANDROID,
                IOS,
                PACKAGE_JSON,
                PACKAGE_LOCK_JSON,
                CONFIG_XML,
                AAB: { AAB_OUTPUT_FOLDER, AAB_FILENAME, AAB_FILENAME_SIGNED },
                APK: { APK_OUTPUT_FOLDER, APK_FILENAME, APK_FILENAME_SIGNED },
                MERGED_NATIVE_LIB,
                GIT_FOLDER,
                GIT_CONFIG_FILE,
                GIT_CURRENT_BRANCH_FILE
            };
        })();
    },
    get getScripts() {
        return (async () => {
            const data = await this.config;
            return data.scripts;
        })();
    },
    get getCurrentPath() {
        return (async () => {
            const data = await this.config;
            return data.current_path;
        })();
    },
    set setCurrentPath(value) {
        return (async () => {
            const data = await this.config;
            data.current_path = value;
            return await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(data));
        })();
    },
    get getProjectPath() {
        return (async () => {
            const data = await this.config;
            return data.project_path;
        })();
    },
    set setProjectPath(value) {
        return (async () => {
            const data = await this.config;
            data.project_path = value;
            return await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(data));
        })();
    }
};

function readSettingsJson() {
    return fsManager.readFile(config_path + '/settings.json', {
        encoding: 'utf8',
        flag: 'r',
        signal: null
    }).then((d) => {
        return JSON.parse(d.data);
    }).then((d) => {
        return d;
    });

}


module.exports = { globalFunctions };
