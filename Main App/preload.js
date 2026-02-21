const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, callback) => ipcRenderer.on(channel, (e, ...args) => callback(...args)),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
})