const { FsManager } = require('./fs-manager');
const path = require('path');

class PackageJsonManager {
    config_path = path.join(__dirname, '../config');
    config = null;
    package_json = null;
    package_json_dependencies = null;
    package_json_devDependencies = null;
    node_modules_dirs = null;

    constructor() {
    }

    async init() {
        return new Promise(async (resolve) => {
            const settings = await new FsManager().readFile(this.config_path + '/settings.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            });
            this.config = JSON.parse(settings.data);
            const packageJson = await new FsManager().readFile(this.config.project_path + '/package.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            });
            if (!packageJson.error) {
                this.package_json_dependencies = JSON.parse(packageJson.data).dependencies;
                this.package_json_devDependencies = JSON.parse(packageJson.data).devDependencies;
            }

            const node_modules = await new FsManager().readDir(this.config.project_path + '/node_modules');
            this.node_modules_dirs = node_modules.data;
            resolve({
                data: {
                    config: this.config,
                    package_json_dependencies: this.package_json_dependencies,
                    package_json_devDependencies: this.package_json_devDependencies,
                    node_modules_dirs: this.node_modules_dirs
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
