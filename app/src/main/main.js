'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const request = require('postman-request');
const { FsManager } = require('../functions/fs-manager');
const { AndroidCleaner } = require('../functions/android-cleaner');
const { BrewManager } = require('../functions/brew-manager');
const { JavaManager } = require('../functions/java-manager');
const config_path = path.join(__dirname, '../config');
const { globalFunctions } = require('../functions/global-shared');
const { PasswordManager } = require('../functions/password-manager');
const { SdkManager } = require('../functions/sdk-manager');
const { PackageJsonManager } = require('../functions/package_json_control');
const { XcodeManager } = require('../functions/xcode-manager');

(async () => {
    let mainWindow = null;
    let optionsWindow = null;
    let settingsWindow = null;
    let advanceSettingsWindow = null;
    let dragDropWindow = null;
    let currentBranch = 'master';
    let github_project_url = null;
    let android_version = null;
    let ios_version = null;
    let android_build_number = null;
    let ios_build_number = null;
    let windowData = null;
    let configData = null;
    const createWindow = async () => {
        const project_path = await globalFunctions.getProjectPath;
        if (project_path) {
            const d = await openMainWindow();
            if (!d.data) {
                await openDragDropWindow();
            } else {
                globalFunctions.setCurrentPath = project_path;
            }
        } else {
            await openDragDropWindow();
        }
    };
    const startHandle = async () => {
        ipcMain.handle('projectDetail:startRead', async (_event, value) => {
            globalFunctions.setCurrentPath = await globalFunctions.getProjectPath;
            return await openMainWindow();
        });
        ipcMain.handle('projectDetail:startAndroidCleaner', async (_event, value) => {
            await cleanerStarted(settingsWindow);
            const androidCleaner = await new AndroidCleaner().startAndroidCleaner(value, mainWindow, (data) => {
                console.log('%c startAndroidCleanerCallbackData', 'background: #222; color: #bada55', data);
                sendEnvironmentChange(settingsWindow, data);
            });
            console.log('%c androidCleaner', 'background: #222; color: #bada55', androidCleaner);

            return true;
        });
        ipcMain.handle('projectDetail:currentPath', async (_event) => {
            const settingsJSON = await globalFunctions.getSettingsJSON;
            return settingsJSON.current_path;
        });
        ipcMain.handle('projectDetail:startReadDetailData', async (_event) => {
            if (windowData && !windowData.error && configData && !windowData.error) {
                return { windowData: windowData.data, configData: configData.data };
            }
            return false;
        });
        ipcMain.handle('projectDetail:installBrewSettings', async (_event, value) => {
            console.log('%c sadfasdfasd', 'background: #222; color: #bada55', value);
            const installBrew = await new BrewManager().installBrewSettings(mainWindow, value);
            console.log('%c installBrew', 'background: #222; color: #bada55', installBrew);
            return true;
        });
        ipcMain.handle('projectDetail:installJavaWithAzulSettings', async (_event, value) => {
            console.log('%c sadfasdfasd2', 'background: #222; color: #bada55', value);
            const installJava = await new JavaManager().installJavaWithAzulSettings(mainWindow, value);
            console.log('%c installJava', 'background: #222; color: #bada55', installJava);
            return true;
        });
        ipcMain.handle('projectDetail:installBuildToolsSettings', async (_event, value) => {
            console.log('%c installBuildToolsValue', 'background: #222; color: #bada55', value);
            const installBuildTools = await new SdkManager().installBuildTools(mainWindow, value);
            console.log('%c installBuildTools', 'background: #222; color: #bada55', installBuildTools);
            return true;
        });
        ipcMain.handle('projectDetail:installPlatformsSettings', async (_event, value) => {
            console.log('%c installPlatformsValue', 'background: #222; color: #bada55', value);
            const installPlatforms = await new SdkManager().installPlatforms(mainWindow, value);
            console.log('%c installPlatforms', 'background: #222; color: #bada55', installPlatforms);
            return true;
        });

        ipcMain.handle('projectDetail:setPasswordDialog', async (_event, value) => {
            const setPasswordDialog = await new PasswordManager().setNewPassword(mainWindow, value);
            console.log('%c setPasswordDialog', 'background: #222; color: #bada55', setPasswordDialog);
            return setPasswordDialog;
        });
        ipcMain.handle('projectDetail:startReadAdvance', async (ev) => {
            const package_json = await new PackageJsonManager().init();
            const node_modules_fixes = await new FsManager().readFile(config_path + '/node_modules_fixes.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            }).then((d) => {
                return JSON.parse(d.data);
            });
            const android_fixes = await new FsManager().readFile(config_path + '/android_fixes.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            }).then((d) => {
                return JSON.parse(d.data);
            });
            const ios_fixes = await new FsManager().readFile(config_path + '/ios_fixes.json', {
                encoding: 'utf8',
                flag: 'r',
                signal: null
            }).then((d) => {
                return JSON.parse(d.data);
            });
            const androidHooks = await globalFunctions.getAndroidHooks;
            const iosHooks = await globalFunctions.getIosHooks;
            return {
                data: {
                    node_modules_fixes: node_modules_fixes,
                    android_fixes: android_fixes,
                    ios_fixes: ios_fixes,
                    package_json: package_json.data,
                    androidHooks: androidHooks,
                    iosHooks: iosHooks
                },
                error: false
            };
        });
        ipcMain.handle('deployForTestDetail:startReadDevices', async (_event, value) => {
            const getAndroidDevices = await new SdkManager().getAndroidAvailableAvdManagerList(mainWindow);
            const getIosDevices = await new XcodeManager().getIosAvailableEmulatorList(mainWindow);
            return { android: getAndroidDevices, ios: getIosDevices };
        });
        ipcMain.handle('deployForTestDetail:startIosDevice', async (_event, value) => {
            const startIos = await new XcodeManager().startIosDevice(mainWindow, value);
            return { startIos };
        });
        ipcMain.handle('deployForTestDetail:killAllPortsIos', async (_event, value) => {
            const killPorts = await new XcodeManager().killPorts(mainWindow, 8100, value);
            return { killPorts };
        });
        ipcMain.handle('deployForTestDetail:killAllPortsAndroid', async (_event, value) => {
            const killPorts = await new SdkManager().killPorts(mainWindow, 8100, value);
            return { killPorts };
        });
        ipcMain.handle('deployForTestDetail:startAndroidDevice', async (_event, value) => {
            const startAndroid = await new SdkManager().startAndroidDevice(mainWindow, value);
            return { startAndroid };
        });
    };

    const fetch_data = async () => {
        const access_token = await globalFunctions.getAccessToken;
        if (access_token === '') {
            return {
                data: null,
                error: true,
                message: 'Access token doesnt exist!',
                road: 'ApplicationStart/main.js:startRead:access_token'
            };
        }
        console.log('%c access_token', 'background: #222; color: #bada55', access_token);

        const userInfo = await get_user_info(access_token);
        console.log('%c userInfo', 'background: #222; color: #bada55', userInfo);

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
        dragDropWindow.webContents.openDevTools({ mode: 'detach', activate: true });
    };
    const openMainWindow = async () => {
        configData = await readConfigXml();
       console.log('%c configData', 'background: #222; color: #bada55', configData);
        if (!configData.data) {
            return configData;
        }
        windowData = await fetch_data();
       console.log('%c windowData', 'background: #222; color: #bada55', windowData);

        dragDropWindow && dragDropWindow.close();
        mainWindow = new BrowserWindow({
            width: 780,
            height: 840,
            webPreferences: {
                devTools: true,
                disableHtmlFullscreenWindowResize: true,
                nodeIntegration: true,
                enableRemoteModule: true,
                webSecurity: true,
                experimentalFeatures: false,
                contextIsolation: true,
                preload: path.resolve(app.getAppPath(), 'app/src/preload/preload.js'),
                show: false
            }
        });
        // Open the DevTools.
        await mainWindow.loadFile(path.resolve(app.getAppPath(), 'app/src/frontend/projectDetail/index.html'));
        await mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });
        mainWindow.show();
        console.log('%c mainWindow21212', 'background: #222; color: #bada55', windowData);

        /*   mainWindow.on('focus', () => {
               settingsWindow && settingsWindow.focus();
               deployWindow && deployWindow.focus();
               mainWindow.focus();
           });*/
        mainWindow.on('close', () => {
            console.log('%c close', 'background: #222; color: #bada55');
            app.exit();
        });
        const mainWindowXY = mainWindow.getPosition();
        const mainWindowGetSize = mainWindow.getSize();

        settingsWindow = new BrowserWindow({
            width: 540,
            height: 840,
            webPreferences: {
                devTools: true,
                disableHtmlFullscreenWindowResize: true,
                nodeIntegration: true,
                enableRemoteModule: true,
                webSecurity: true,
                experimentalFeatures: false,
                contextIsolation: true,
                preload: path.resolve(app.getAppPath(), 'app/src/preload/preload.js'),
                show: false
            },
            x: mainWindowXY[0] + mainWindowGetSize[0] + 20,
            y: mainWindowXY[1]
        });
        // Open the DevTools.
        await settingsWindow.loadFile(path.resolve(app.getAppPath(), 'app/src/frontend/generalSettings/index.html'));
        await settingsWindow.webContents.openDevTools({ mode: 'detach' });
        settingsWindow.show();
        const settingsWindowXY = settingsWindow.getPosition();
        const settingsWindowGetSize = settingsWindow.getSize();


        // optionsWindow = new BrowserWindow({
        //     width: 540,
        //     height: 840,
        //     webPreferences: {
        //         devTools: true,
        //         disableHtmlFullscreenWindowResize: true,
        //         nodeIntegration: true,
        //         enableRemoteModule: true,
        //         webSecurity: true,
        //         experimentalFeatures: false,
        //         contextIsolation: true,
        //         preload: path.resolve(app.getAppPath(), 'app/src/preload/preload.js'),
        //         show: false
        //     }
        // });
        // // Open the DevTools.
        // await optionsWindow.loadFile(path.resolve(app.getAppPath(), 'app/src/frontend/deployForTest/index.html'));
        // await optionsWindow.webContents.openDevTools({ mode: 'detach' });
        // /*
        //         optionsWindow.show();
        // */


        // advanceSettingsWindow = new BrowserWindow({
        //     width: 1250,
        //     height: 824,
        //     webPreferences: {
        //         devTools: true,
        //         disableHtmlFullscreenWindowResize: true,
        //         nodeIntegration: true,
        //         enableRemoteModule: true,
        //         webSecurity: true,
        //         experimentalFeatures: false,
        //         contextIsolation: true,
        //         preload: path.resolve(app.getAppPath(), 'app/src/preload/preload.js'),
        //         show: false
        //     }
        // });
        // // Open the DevTools.
        // await advanceSettingsWindow.loadFile(path.resolve(app.getAppPath(), 'app/src/frontend/advanceSettings/index.html'));
        // await advanceSettingsWindow.webContents.openDevTools({ mode: 'detach' });
        /*
                advanceSettingsWindow.show();
        */
        return {
            data: true,
            error: false
        };
    };
    const get_workflows = async (owner, repo_name, access_token) => {
        console.log('%c access_token', 'background: #222; color: #bada55', access_token);
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
                    console.log('%c response', 'background: #222; color: #bada55', JSON.parse(response.body));
                    console.log('%c error', 'background: #222; color: #bada55', error);
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
                return resolve({ data: branchesCounter, error: false });
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
                    return resolve({ data: JSON.parse(response.body), error: false });
                });

            }
        );
    };
    const get_git_config = async () => {
        return new Promise(
            async (resolve) => {
                const folders = await globalFunctions.getFolders;
                const project_path = await globalFunctions.getProjectPath;

                const currentBranchFile = await new FsManager().readFile(project_path + '/' + folders.GIT_FOLDER + '/' + folders.GIT_CURRENT_BRANCH_FILE, {
                    encoding: 'utf8',
                    flag: 'r',
                    signal: null
                });
                if (!currentBranchFile.error) {
                    currentBranch = currentBranchFile.data.split('ref: ')[1].split('/')[2].trim();
                } else {
                    return resolve(currentBranchFile);
                }
                const gitglobalFunctions = await new FsManager().readFile(project_path + '/' + folders.GIT_FOLDER + '/' + folders.GIT_CONFIG_FILE);
                if (!gitglobalFunctions.error) {
                    const github_url_regex = /(\/*\[remote \S+]\n	url = \S+\/*)/;
                    const projectTitleMatch = github_url_regex.exec(gitglobalFunctions.data);
                    github_project_url = projectTitleMatch[0].split('=')[1].trim();
                } else {
                    return resolve(gitglobalFunctions);
                }
                return resolve({
                    data: { currentBranch: currentBranch, githubProjectUrl: github_project_url },
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
                    return resolve({ data: JSON.parse(response.body), error: false });
                });
            }
        );
    };
    const sendEnvironmentChange = async (window, data) => {
        return new Promise(async (resolve) => {
            window.webContents.send('projectSettings:environmentCheckData', {
                data: data.type,
                type: data.data
            });
            resolve(true);
        });
    };
    const cleanerStarted = async (window) => {
        return new Promise(async (resolve) => {
            window.webContents.send('projectSettings:cleanerStarted', null);
            resolve(true);
        });
    };
    const readConfigXml = async () => {
        const project_path = await globalFunctions.getProjectPath;
        android_version = await globalFunctions.getAndroidVersion;
        ios_version = await globalFunctions.getIosVersion;
        android_build_number = await globalFunctions.getAndroidVersionCode;
        ios_build_number = await globalFunctions.getIosVersionCode;
        const project_title = await globalFunctions.getNames;
        return {
            error: false,
            data: {
                path: project_path,
                androidVersion: android_version,
                iosVersion: ios_version,
                androidBuildNumber: android_build_number,
                iosBuildNumber: ios_build_number,
                projectTitle: project_title[0]
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
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

})().catch((err) => {
    console.log('%c MAIN ERROR!!!!!!', 'background: #222; color: #bada55', err);
});
