/**
 * Type declarations for Electron API exposed via preload
 */

export interface ElectronAPI {
  // File operations
  selectXlsxDirectory: (options?: { title?: string }) => Promise<string | null>;
  scanXlsxFiles: (directoryPath: string, recursive?: boolean) => Promise<{
    success: boolean;
    files: Array<{
      fileName: string;
      filePath: string;
      folderPath: string;
      selected: boolean;
      lastModified?: number;
    }>;
    error?: string;
  }>;
  scanPdfFiles: (directoryPath: string, recursive?: boolean) => Promise<{
    success: boolean;
    files: Array<{
      fileName: string;
      filePath: string;
      folderPath: string;
      selected: boolean;
      lastModified?: number;
    }>;
    error?: string;
  }>;
  copyPdfFiles: (payload: {
    destinationRoot: string;
    tasks: Array<{
      sourcePath: string;
      relativeFolder?: string[] | string;
      targetFileName: string;
    }>;
  }) => Promise<{
    success: boolean;
    copied: number;
    errors: Array<{ task: any; message: string }>;
  }>;
  
  // Excel operations
  loadExcelFile: (filePath: string, config?: any) => Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>;
  
  loadMultipleExcelFiles: (filePaths: string[], config?: any) => Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }>;
  
  // Config
  getConfig: () => Promise<any>;
  setConfig: (config: any) => Promise<{ success: boolean }>;
  
  // Logs
  logInfo: (message: string, ...args: any[]) => void;
  logError: (message: string, ...args: any[]) => void;
  logWarn: (message: string, ...args: any[]) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
