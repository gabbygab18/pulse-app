'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('isla', {
  getState: () => ipcRenderer.invoke('get-state'),
  onState: (cb) => ipcRenderer.on('state', (_e, s) => cb(s)),
  setApiUrl: (url) => ipcRenderer.invoke('set-api-url', url),
  login: (creds) => ipcRenderer.invoke('login', creds),
  logout: () => ipcRenderer.invoke('logout'),
  clockIn: () => ipcRenderer.invoke('clock-in'),
  clockOut: () => ipcRenderer.invoke('clock-out'),
  startBreak: () => ipcRenderer.invoke('break-start'),
  endBreak: () => ipcRenderer.invoke('break-end'),
  openPortal: () => ipcRenderer.invoke('open-portal'),
  setMode: (mode) => ipcRenderer.invoke('set-mode', mode),
  // recording
  getScreenSource: () => ipcRenderer.invoke('get-screen-source'),
  uploadRecording: (buf) => ipcRenderer.invoke('upload-recording', buf),
});
