import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger.js';
import { fileService } from './services/fileService.js';
import { excelService } from './services/excelService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist/index.html');
    logger.info('Loading file from:', indexPath);
    win.loadFile(indexPath);
    
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      logger.error('Failed to load:', errorCode, errorDescription);
    });
  }
}

// IPC Handlers
function setupIpcHandlers() {
  // File operations
  ipcMain.handle('file:select-xlsx-directory', async (_event, options = {}) => {
    try {
      const dir = await fileService.selectDirectory(options?.title);
      return dir;
    } catch (error) {
      logger.error('Error selecting directory:', error);
      throw error;
    }
  });

  ipcMain.handle('file:scan-xlsx-files', async (event, { directoryPath, recursive }) => {
    return await fileService.scanXlsxFiles(directoryPath, recursive);
  });

  ipcMain.handle('file:scan-pdf-files', async (event, { directoryPath, recursive }) => {
    return await fileService.scanPdfFiles(directoryPath, recursive);
  });

  ipcMain.handle('file:copy-pdf-files', async (event, payload) => {
    const { destinationRoot, tasks } = payload || {};
    return await fileService.copyPdfFiles(destinationRoot, tasks);
  });

  // Excel operations
  ipcMain.handle('excel:load-file', async (event, { filePath, config }) => {
    return await excelService.loadExcelFile(filePath, config);
  });

  ipcMain.handle('excel:load-multiple-files', async (event, { filePaths, config }) => {
    return await excelService.loadMultipleExcelFiles(filePaths, config);
  });

  // Config
  ipcMain.handle('config:get', async () => {
    return {
      columnsToRead: 10,
      colorColumnIndex: 1,
      skipEmptyRows: true,
      headerRowIndex: 0,
    };
  });

  ipcMain.handle('config:set', async (event, config) => {
    logger.info('Config updated:', config);
    return { success: true };
  });

  // Logs
  ipcMain.on('log:info', (event, message, ...args) => {
    logger.info(message, ...args);
  });

  ipcMain.on('log:error', (event, message, ...args) => {
    logger.error(message, ...args);
  });

  ipcMain.on('log:warn', (event, message, ...args) => {
    logger.warn(message, ...args);
  });

  logger.info('IPC handlers registered');
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();
  logger.info('Application started');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});