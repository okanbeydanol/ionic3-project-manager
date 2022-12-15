'use strict';
const {app, BrowserWindow, ipcMain, nativeTheme, ipcRenderer} = require('electron');
const path = require('path');
const {dialog} = require('electron');
const {writeFileSync} = require('fs');
const request = require('request');
const {homedir} = require('os');
const {join} = require('path');
const {FsManager} = require('../functions/fs-manager');
const {PackageJsonManager} = require('../functions/package_json_control');
const {AndroidCleaner} = require('../functions/android-cleaner');
const {execSync, exec} = require("child_process");
const {ChildProcess} = require("../functions/child_process");
const config_path = path.join(__dirname, '../config');
(async () => {
    const config = await new FsManager().readFile(config_path + '/settings.json', {
        encoding: 'utf8',
        flag: 'r',
        signal: null
    }).then((d) => {
        return JSON.parse(d.data);
    });
    const folders = config.folders;
    let mainWindow = null;
    let dragDropWindow = null;
    let currentBranch = 'master';
    let github_project_url = null;
    let android_version = null;
    let ios_version = null;
    let android_build_number = null;
    let ios_build_number = null;

    const createWindow = async () => {
        if (config.project_path) {
            const d = await get_all_data();
            if (!d.data) {
                await openDragDropWindow();
            } else {
                config.currentPath = config.project_path;
                const write = await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(config));
                if (write.error) {
                    return write;
                }

                /*    await new ChildProcess().execCommand('cd ' + config.currentPath, (event) => {
                        if (event.error) {
                            return {error: true, data: null, message: 'We can`r enter current folder!'};
                        }
                        if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                            return {
                                error: false,
                                data: event.data.trim()
                            };
                        }
                        if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                            return {
                                error: false,
                                data: event.data.trim()
                            };
                        }
                    }, mainWindow);*/
            }
        } else {
            await openDragDropWindow();
        }


    };

    const startHandle = async () => {
        ipcMain.handle('projectDetail:startRead', async (_event, value) => {
            config.project_path = value;
            config.currentPath = config.project_path;
            const write = await new FsManager().writeFile(config_path + '/settings.json', JSON.stringify(config));
            if (write.error) {
                return write;
            }
            await new ChildProcess().execCommand('cd ' + config.currentPath, (event) => {
                if (event.error) {
                    return {error: true, data: null, message: 'We can`r enter current folder!'};
                }
                if (event.type === 'stdout:end' && !event.error && event.data !== '') {
                    return {
                        error: false,
                        data: event.data.trim()
                    };
                }
                if (event.type === 'stderr:end' && !event.error && event.data !== '') {
                    return {
                        error: false,
                        data: event.data.trim()
                    };
                }
            }, dragDropWindow);
            return await get_all_data();
        });
        ipcMain.handle('projectDetail:startAndroidCleaner', async (_event, value) => {
            console.log('%c value', 'background: #222; color: #bada55', value);

            const androidCleaner = await new AndroidCleaner().startAndroidCleaner(value, mainWindow);
            console.log('%c androidCleaner', 'background: #222; color: #bada55', androidCleaner);
        });
    };
    const openDragDropWindow = async () => {
        dragDropWindow = new BrowserWindow({
            width: 526,
            height: 416,
            webPreferences: {
                devTools: true,
                disableHtmlFullscreenWindowResize: true,
                nodeIntegration: true,
                enableRemoteModule: true,
                webSecurity: true,
                experimentalFeatures: false,
                contextIsolation: true,
                preload: path.resolve(app.getAppPath(), 'app/src/preload/preload.js')
            }
        });
        // Open the DevTools.
        await dragDropWindow.loadFile(path.resolve(app.getAppPath(), 'app/src/frontend/dragDrop/index.html'));
        dragDropWindow.webContents.openDevTools({mode: 'detach', activate: true});
    };

    const get_all_data = async () => {
        const configXml = await readConfigXml();
        if (!configXml.data) {
            return configXml;
        }

        const access_token = config.access_token;
        if (access_token === '') {
            return {
                data: null,
                error: true,
                message: 'Access token doesnt exist!',
                road: 'ApplicationStart/main.js:startRead:access_token'
            };
        }

        const userInfo = await get_user_info(access_token);
        if (userInfo.error) {
            return userInfo;
        }

        const gitConfig = await get_git_config();
        if (gitConfig.error) {
            return gitConfig;
        }
        const owner = gitConfig.data.githubProjectUrl.split('/')[gitConfig.data.githubProjectUrl.split('/').length - 2].trim();
        const repo = gitConfig.data.githubProjectUrl.split('/')[gitConfig.data.githubProjectUrl.split('/').length - 1].split('.git')[0].trim();
        const branches = await get_branches(owner, repo, access_token);
        if (branches.error) {
            return branches;
        }
        const workflows = await get_workflows(owner, repo, access_token);
        if (workflows.error) {
            return workflows;
        }

        dragDropWindow && dragDropWindow.close();
        mainWindow = new BrowserWindow({
            width: 780,
            height: 1120,
            webPreferences: {
                devTools: true,
                disableHtmlFullscreenWindowResize: true,
                nodeIntegration: true,
                enableRemoteModule: true,
                webSecurity: true,
                experimentalFeatures: false,
                contextIsolation: true,
                preload: path.resolve(app.getAppPath(), 'app/src/preload/preload.js')
            }
        });
        // Open the DevTools.
        await mainWindow.loadFile(path.resolve(app.getAppPath(), 'app/src/frontend/projectDetail/index.html'));
        await mainWindow.webContents.openDevTools({mode: 'detach', activate: true});
        return {
            data: {
                userInfo: userInfo.data,
                branches: branches.data,
                workflows: workflows.data,
                gitConfig: gitConfig.data,
                owner: owner,
                repo: repo
            },
            error: false
        };
    }
    const get_workflows = async (owner, repo_name, access_token) => {
        return new Promise(
            async (resolve) => {
                const options = {
                    'method': 'GET',
                    'url': 'https://api.github.com/repos/' + owner + '/' + repo_name + '/actions/workflows',
                    'headers': {
                        'Authorization': 'Bearer ' + access_token,
                        'Cookie': '_octo=GH1.1.137167768.1664605773; logged_in=no',
                        'User-Agent': 'php'
                    }
                };
                request(options, function (error, response) {
                    if (error) return resolve({
                        data: null,
                        error: true,
                        message: error.message,
                        road: 'ApplicationStart/main.js:get_workflows:request'
                    });
                    return resolve({
                        data: JSON.parse(response.body).workflows.filter((o) => o.state === 'active'),
                        error: false
                    });
                });
            }
        );
    };

    const get_branches = async (owner, repo_name, access_token) => {
        return new Promise(
            async (resolve) => {
                let i = 1;
                const branchesCounter = [];
                while (i !== -1) {
                    const branch = await fetch_branch(owner, repo_name, access_token, i);
                    if (!branch.error && branch.data.length > 0) {
                        const data = branch.data;
                        for (const d of data) {
                            branchesCounter.push(d);
                        }
                        i = i + 1;
                    } else {
                        i = -1;
                    }
                }
                return resolve({data: branchesCounter, error: false});
            }
        );
    };

    const fetch_branch = async (owner, repo_name, access_token, i) => {
        return new Promise(
            async (resolve) => {
                const options = {
                    'method': 'GET',
                    'url': 'https://api.github.com/repos/' + owner + '/' + repo_name + '/branches?page=' + i + '&per_page=100',
                    'headers': {
                        'Authorization': 'Bearer ' + access_token,
                        'Cookie': '_octo=GH1.1.137167768.1664605773; logged_in=no',
                        'User-Agent': 'php'
                    }
                };
                request(options, function (error, response) {
                    if (error) return resolve({
                        data: null,
                        error: true,
                        message: error.message,
                        road: 'ApplicationStart/main.js:fetch_branch:request'
                    });
                    return resolve({data: JSON.parse(response.body), error: false});
                });

            }
        );
    };

    const get_git_config = async () => {
        return new Promise(
            async (resolve) => {
                const currentBranchFile = await new FsManager().readFile(config.project_path + '/' + folders.GIT_FOLDER + '/' + folders.CURREN_BRANCH_FILE, {
                    encoding: 'utf8',
                    flag: 'r',
                    signal: null
                });
                if (!currentBranchFile.error) {
                    currentBranch = currentBranchFile.data.split('ref: ')[1].split('/')[2].trim();
                } else {
                    return resolve(currentBranchFile);
                }
                const gitConfigFile = await new FsManager().readFile(config.project_path + '/' + folders.GIT_FOLDER + '/' + folders.CONFIG_FILE);
                if (!gitConfigFile.error) {
                    const github_url_regex = /(\/*\[remote "origin"]\n	url = \S+\/*)/;
                    const projectTitleMatch = github_url_regex.exec(gitConfigFile.data);
                    github_project_url = projectTitleMatch[0].split('=')[1].trim();
                } else {
                    return resolve(gitConfigFile);
                }
                return resolve({
                    data: {currentBranch: currentBranch, githubProjectUrl: github_project_url},
                    error: false
                });
            }
        );
    };

    const get_user_info = async (access_token) => {
        return new Promise(
            (resolve, reject) => {
                const options = {
                    'method': 'POST',
                    'url': 'https://api.github.com/user',
                    'headers': {
                        'Authorization': 'Bearer ' + access_token,
                        'Cookie': '_octo=GH1.1.137167768.1664605773; logged_in=no',
                        'User-Agent': 'php'
                    }
                };
                request(options, function (error, response) {
                    if (error) return resolve({
                        data: null,
                        error: true,
                        message: error.message,
                        road: 'ApplicationStart/main.js:get_user_info:request'
                    });
                    return resolve({data: JSON.parse(response.body), error: false});
                });
            }
        );
    };


    async function getCurrentPath() {
        return new Promise((resolve) => {
            exec('pwd', {encoding: 'utf8'}, (error, stdout, stderr) => {
                return resolve({
                    data: stdout.trim(),
                    error: false,
                    type: 'stdout:end',
                    road: 'child_process.js:execCommand:exec'
                });
            });
        });
    }


    const readConfigXml = async () => {
        const configExist = await new FsManager().pathExist(config.project_path + '/config.xml');
        if (!configExist.data) {
            return configExist;
        }
        const configXml = await new FsManager().readFile(config.project_path + '/config.xml', {
            encoding: 'utf8',
            flag: 'r',
            signal: null
        });
        if (configXml.error) {
            return configXml;
        }
        /*
            StartWatcher(path.resolve(app.getAppPath(), 'app/src/'));
        */
        const versionRegex = /(\/*version="\S+\/*)/;
        const versionCodeRegex = /(\/* versionCode="\S+\/*)/;
        const androidVersionCodeRegex = /(\/*android-versionCode="\S+\/*)/;
        const iosCFBundleVersionRegex = /(\/*ios-CFBundleVersion="\S+\/*)/;
        const projectTitleRegex = /(\/*<name>\S+<\/name>\/*)/;

        const versionRegexMatch = versionRegex.exec(configXml.data);
        const androidVersionCodeRegexMatch = androidVersionCodeRegex.exec(configXml.data);
        const iosCFBundleVersionRegexMatch = iosCFBundleVersionRegex.exec(configXml.data);
        const versionCodeRegexMatch = versionCodeRegex.exec(configXml.data);
        const projectTitleMatch = projectTitleRegex.exec(configXml.data);

        android_version = versionRegexMatch[0].split('=')[1].replace('"', '').replace('"', '');
        ios_version = versionCodeRegexMatch[0].split('=')[1].replace('"', '').replace('"', '');
        android_build_number = androidVersionCodeRegexMatch[0].split('=')[1].replace('"', '').replace('"', '');
        ios_build_number = iosCFBundleVersionRegexMatch[0].split('=')[1].replace('"', '').replace('"', '');
        const project_title = projectTitleMatch[0].replace('<name>', '').replace('</name>', '');
        return {
            error: false,
            data: {
                path: config.project_path,
                androidVersion: android_version,
                iosVersion: ios_version,
                androidBuildNumber: android_build_number,
                iosBuildNumber: ios_build_number,
                projectTitle: project_title
            }
        };
    };
    app.whenReady().then(async () => {
        await startHandle();
        await createWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });

    });
    app.on('activate-with-no-open-windows', function () {
        mainWindow.show();
    });
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

})().catch((err) => {
    console.log('%c err', 'background: #222; color: #bada55', err);
});
