const { FsManager } = require('./fs-manager');
const { globalFunctions } = require('./global-shared');

class PackageJsonManager {
    settingsJSON = null;
    package_json_dependencies = null;
    package_json_devDependencies = null;
    node_modules_dirs = null;
    plugins_dirs = null;
    androidHooks = null;
    iosHooks = null;

    constructor() {
    }

    async init() {
        return new Promise(async (resolve) => {
            this.settingsJSON = await globalFunctions.getSettingsJSON;
            const packageJson = await new FsManager().readFile(this.settingsJSON.project_path + '/package.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            });
            if (!packageJson.error) {
                this.package_json_dependencies = JSON.parse(packageJson.data).dependencies;
                this.package_json_devDependencies = JSON.parse(packageJson.data).devDependencies;
            }

            const node_modules = await new FsManager().readDir(this.settingsJSON.project_path + '/node_modules');
            const plugins = await new FsManager().readDir(this.settingsJSON.project_path + '/plugins');
            this.node_modules_dirs = node_modules.data;
            this.plugins_dirs = plugins.data;
            resolve({
                data: {
                    settingsJSON: this.settingsJSON,
                    package_json_dependencies: this.package_json_dependencies,
                    package_json_devDependencies: this.package_json_devDependencies,
                    node_modules_dirs: this.node_modules_dirs,
                    plugins_dirs: this.plugins_dirs
                }, error: false
            });
        });

    }

    get_package_json_packages() {
        return {
            data: {
                package_json_dependencies: this.package_json_dependencies,
                package_json_devDependencies: this.package_json_devDependencies
            }, error: false
        };
    }

    get_package_json_package(plugin_name) {
        let result = false;
        if (this.package_json_devDependencies[plugin_name]) {
            return { data: this.package_json_devDependencies[plugin_name], error: false };
        }
        if (this.package_json_dependencies[plugin_name]) {
            return { data: this.package_json_dependencies[plugin_name], error: false };
        }
        return {
            data: this.package_json_dependencies[plugin_name],
            error: true,
            message: 'Package not found!',
            road: 'package_json_control:get_package_json_package'
        };
    }

    package_exist(plugin_name) {
        let result = false;
        if (this.package_json_devDependencies[plugin_name]) {
            result = true;
        }
        if (this.package_json_dependencies[plugin_name]) {
            result = true;
        }
        return result;
    }

    remove_plugin(plugin_name) {
        let result = false;
        if (this.package_json_devDependencies[plugin_name]) {
            result = true;
        }
        if (this.package_json_dependencies[plugin_name]) {
            result = true;
        }
        return result;
    }
}

module.exports = { PackageJsonManager };
