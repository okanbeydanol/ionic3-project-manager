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

});
contextBridge.exposeInMainWorld('terminalDetail', {
    listenCommandNode: (callback) => ipcRenderer.on('command:listen', callback),
    sendCommandNode: (value) => ipcRenderer.invoke('command:send', value ? value : ''),
});
contextBridge.exposeInMainWorld('projectSettings', {
    environmentCheckData: (callback) => ipcRenderer.on('projectSettings:environmentCheckData', callback),
    cleanerStarted: (callback) => ipcRenderer.on('projectSettings:cleanerStarted', callback),
    installBrewSettings: (value) => ipcRenderer.invoke('projectDetail:installBrewSettings', value),
    installJavaWithAzulSettings: (value) => ipcRenderer.invoke('projectDetail:installJavaWithAzulSettings', value)
});
