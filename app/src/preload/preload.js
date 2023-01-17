const {contextBridge, ipcRenderer} = require('electron');
/*
contextBridge.exposeInMainWorld('terminalDetail', {
    listenCommandNode: (callback) => ipcRenderer.on('command:listen', callback),
    sendCommandNode: (value) => ipcRenderer.invoke('command:send', value ? value : ''),
});*/
contextBridge.exposeInMainWorld('projectDetail', {
    startRead: (value) => ipcRenderer.invoke('projectDetail:startRead', value),
    startReadDetailData: () => ipcRenderer.invoke('projectDetail:startReadDetailData',),
    currentPath: () => ipcRenderer.invoke('projectDetail:currentPath'),
    startAndroidCleanerPreload: (value) => ipcRenderer.invoke('projectDetail:startAndroidCleaner', value),
    setPasswordDialog: (value) => ipcRenderer.invoke('projectDetail:setPasswordDialog', value),
    startReadAdvance: () => ipcRenderer.invoke('projectDetail:startReadAdvance'),

});
contextBridge.exposeInMainWorld('terminalDetail', {
    listenCommandNode: (callback) => ipcRenderer.on('command:listen', callback),
    sendCommandNode: (value) => ipcRenderer.invoke('command:send', value ? value : ''),
});
contextBridge.exposeInMainWorld('projectSettings', {
    environmentCheckData: (callback) => ipcRenderer.on('projectSettings:environmentCheckData', callback),
    cleanerStarted: (callback) => ipcRenderer.on('projectSettings:cleanerStarted', callback),
    installBrewSettings: (value) => ipcRenderer.invoke('projectDetail:installBrewSettings', value),
    installJavaWithAzulSettings: (value) => ipcRenderer.invoke('projectDetail:installJavaWithAzulSettings', value),
    installBuildToolsSettings: (value) => ipcRenderer.invoke('projectDetail:installBuildToolsSettings', value),
    installPlatformsSettings: (value) => ipcRenderer.invoke('projectDetail:installPlatformsSettings', value)
});
contextBridge.exposeInMainWorld('deployForTestDetail', {
    startReadDevices: (value) => ipcRenderer.invoke('deployForTestDetail:startReadDevices', value),
    startIosDevice: (value) => ipcRenderer.invoke('deployForTestDetail:startIosDevice', value),
    startAndroidDevice: (value) => ipcRenderer.invoke('deployForTestDetail:startAndroidDevice', value),
    killAllPortsAndroid: (value) => ipcRenderer.invoke('deployForTestDetail:killAllPortsAndroid', value),
    killAllPortsIos: (value) => ipcRenderer.invoke('deployForTestDetail:killAllPortsIos', value),
});
