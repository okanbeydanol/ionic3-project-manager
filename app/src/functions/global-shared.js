const { FsManager } = require('./fs-manager');
const path = require('path');
const xml2js = require('xml2js');
const { networkInterfaces } = require('os');
const config_path = path.join(__dirname, '../config');
const fsManager = new FsManager();
const globalFunctions = {
    settingsJSON: (async () => {
        return await readSettingsJson();
    })(),
    configXML: (async () => {
        return await readConfigXMLJson();
    })(),
    get getSettingsJSON() {
        return (async () => {
            return await this.settingsJSON;
        })();
    },
    set setSettingsJSON(value) {
        this.settingsJSON = value;
        (async () => {
            await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(value));
        })();
    },
    get getPassword() {
        return (async () => {
            const data = await this.settingsJSON;
            return data.password;
        })();
    },
    set setPassword(value) {
        return (async () => {
            const data = await this.settingsJSON;
            Object.assign(data, { password: value });
            return await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(data));
        })();
    },
    get getAccessToken() {
        return (async () => {
            const data = await this.settingsJSON;
            return data.access_token;
        })();
    },
    set setAccessToken(value) {
        return (async () => {
            const data = await this.settingsJSON;
            data.access_token = value;
            return await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(data));
        })();
    },
    get getKeystore() {
        return (async () => {
            const data = await this.settingsJSON;
            const { alias, pass, path } = data.keystore;
            return { alias, pass, path } = data.keystore;
        })();
    },
    set setKeystore(data) {
        return (async () => {
            const data = await this.settingsJSON;
            data.keystore = data;
            return await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(data));
        })();
    },
    get getFolders() {
        return (async () => {
            const data = await this.settingsJSON;
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
            const data = await this.settingsJSON;
            return data.scripts;
        })();
    },
    get getCurrentPath() {
        return (async () => {
            const data = await this.settingsJSON;
            return data.current_path;
        })();
    },
    set setCurrentPath(value) {
        return (async () => {
            const data = await this.settingsJSON;
            data.current_path = value;
            return await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(data));
        })();
    },
    get getProjectPath() {
        return (async () => {
            const data = await this.settingsJSON;
            return data.project_path;
        })();
    },
    set setProjectPath(value) {
        return (async () => {
            const data = await this.settingsJSON;
            data.project_path = value;
            return await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(data));
        })();
    },
    get getConfigXML() {
        return (async () => {
            return await this.configXML;
        })();
    },
    set setGetConfigXML(value) {
        (async () => {
            this.configXML = value;
            await writeConfigXMLJson(this.configXML);
        })();
    },
    get getAndroidPackageName() {
        return (async () => {
            const configXML = await this.configXML;
            return configXML.widget.$['android-packageName'];
        })();
    },
    set setAndroidPackageName(value) {
        return (async () => {
            const configXML = await this.configXML;
            configXML.widget.$['android-packageName'] = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getAndroidVersionCode() {
        return (async () => {
            const configXML = await this.configXML;
            return configXML.widget.$['android-versionCode'];
        })();
    },
    set setAndroidVersionCode(value) {
        return (async () => {
            const configXML = await this.configXML;
            configXML.widget.$['android-versionCode'] = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getIosPackageName() {
        return (async () => {
            const configXML = await this.configXML;
            return configXML.widget.$['ios-CFBundleIdentifier'];
        })();
    },
    set setIosPackageName(value) {
        return (async () => {
            const configXML = await this.configXML;
            configXML.widget.$['ios-CFBundleIdentifier'] = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getIosVersionCode() {
        return (async () => {
            const configXML = await this.configXML;
            return configXML.widget.$['ios-CFBundleVersion'];
        })();
    },
    set setIosVersionCode(value) {
        return (async () => {
            const configXML = await this.configXML;
            configXML.widget.$['ios-CFBundleVersion'] = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getAndroidVersion() {
        return (async () => {
            const configXML = await this.configXML;
            return configXML.widget.$['version'];
        })();
    },
    set setAndroidVersion(value) {
        return (async () => {
            const configXML = await this.configXML;
            configXML.widget.$['version'] = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getIosVersion() {
        return (async () => {
            const configXML = await this.configXML;
            return configXML.widget.$['versionCode'];
        })();
    },
    set setIosVersion(value) {
        return (async () => {
            const configXML = await this.configXML;
            configXML.widget.$['versionCode'] = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getNames() {
        return (async () => {
            const configXML = await this.configXML;
            return configXML.widget.name;
        })();
    },
    set setNames(value) {
        return (async () => {
            const configXML = await this.configXML;
            configXML.widget.name = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getDescription() {
        return (async () => {
            const configXML = await this.configXML;
            return configXML.widget.description;
        })();
    },
    set setDescription(value) {
        return (async () => {
            const configXML = await this.configXML;
            configXML.widget.description = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getAuthor() {
        return (async () => {
            const configXML = await this.configXML;
            return configXML.widget.author[0]['_'];
        })();
    },
    set setAuthor(value) {
        return (async () => {
            const configXML = await this.configXML;
            configXML.widget.author[0]['_'] = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getAndroidHooks() {
        return (async () => {
            const configXML = await this.configXML;
            const platforms = configXML.widget.platform;
            const androidPlatform = platforms.find((o => o.$.name === 'android'));
            return androidPlatform.hook;
        })();
    },
    set setAndroidHooks(value) {
        return (async () => {
            const configXML = await this.configXML;
            const androidPlatformIndex = configXML.widget.platform.findIndex((o => o.$.name === 'android'));
            configXML.widget.platform[androidPlatformIndex].hook = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getIosHooks() {
        return (async () => {
            const configXML = await this.configXML;
            const platforms = configXML.widget.platform;
            const androidPlatform = platforms.find((o => o.$.name === 'ios'));
            return androidPlatform.hook;
        })();
    },
    set setIosHooks(value) {
        return (async () => {
            const configXML = await this.configXML;
            const iosPlatformIndex = configXML.widget.platform.findIndex((o => o.$.name === 'ios'));
            configXML.widget.platform[iosPlatformIndex].hook = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getContent() {
        return (async () => {
            const configXML = await this.configXML;
            return configXML.widget.content;
        })();
    },
    set setContent(value) {
        return (async () => {
            const configXML = await this.configXML;
            configXML.widget.content = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getNavigations() {
        return (async () => {
            const configXML = await this.configXML;
            return configXML.widget['allow-navigation'];
        })();
    },
    set setNavigations(value) {
        return (async () => {
            const configXML = await this.configXML;
            configXML.widget['allow-navigation'] = value;
            await writeConfigXMLJson(configXML);
        })();
    },
    get getIpAddress() {
        return (async () => {
            return getIpAddress();
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

async function readConfigXMLJson() {
    const settingsJSON = await readSettingsJson();
    const path = settingsJSON.current_path;
    return fsManager.readFile(path + '/config.xml', {
        encoding: 'utf8',
        flag: 'r',
        signal: null
    }).then(async (config) => {
        const parser = new xml2js.Parser({ includeWhiteChars: true });
        return await parser.parseStringPromise(config.data);
    });
}

async function getIpAddress() {
    const nets = networkInterfaces();
    const results = Object.create(null); // Or just '{}', an empty object
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
            if (net.family === familyV4Value && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    return results['en0'];
}

async function writeConfigXMLJson(value) {
    const settingsJSON = await readSettingsJson();
    const path = settingsJSON.current_path;
    const manifest = (new xml2js.Builder({})).buildObject(value);
    await fsManager.writeFile(path + '/config.xml', manifest);
}

module.exports = { globalFunctions };
