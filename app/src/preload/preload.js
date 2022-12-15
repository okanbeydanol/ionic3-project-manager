const {contextBridge, ipcRenderer} = require('electron');
/*
contextBridge.exposeInMainWorld('terminalDetail', {
    listenCommandNode: (callback) => ipcRenderer.on('command:listen', callback),
    sendCommandNode: (value) => ipcRenderer.invoke('command:send', value ? value : ''),
});*/
contextBridge.exposeInMainWorld('projectDetail', {
    startRead: (value) => ipcRenderer.invoke('projectDetail:startRead', value),
    startAndroidCleanerPreload: (value) => ipcRenderer.invoke('projectDetail:startAndroidCleaner', value),
});
contextBridge.exposeInMainWorld('terminalDetail', {
    listenCommandNode: (callback) => ipcRenderer.on('command:listen', callback),
    sendCommandNode: (value) => ipcRenderer.invoke('command:send', value ? value : ''),
});