import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script - bezpieczne API dla renderera
 */

const api = {
  // File operations
  selectXlsxDirectory: (options) => ipcRenderer.invoke('file:select-xlsx-directory', options ?? {}),
  scanXlsxFiles: (directoryPath, recursive = false) => 
    ipcRenderer.invoke('file:scan-xlsx-files', { directoryPath, recursive }),
  scanPdfFiles: (directoryPath, recursive = true) => 
    ipcRenderer.invoke('file:scan-pdf-files', { directoryPath, recursive }),
  copyPdfFiles: (payload) => ipcRenderer.invoke('file:copy-pdf-files', payload),
  
  // Excel operations
  loadExcelFile: (filePath, config) => 
    ipcRenderer.invoke('excel:load-file', { filePath, config }),
  loadMultipleExcelFiles: (filePaths, config) => 
    ipcRenderer.invoke('excel:load-multiple-files', { filePaths, config }),
  
  // Config
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config) => ipcRenderer.invoke('config:set', config),
  
  // Logs
  logInfo: (message, ...args) => ipcRenderer.send('log:info', message, ...args),
  logError: (message, ...args) => ipcRenderer.send('log:error', message, ...args),
  logWarn: (message, ...args) => ipcRenderer.send('log:warn', message, ...args),
};

contextBridge.exposeInMainWorld('electronAPI', api);
