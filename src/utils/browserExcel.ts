/**
 * Browser Excel utilities - File System Access API
 * Enables Excel file operations in browser without Electron
 */

import ExcelJS from 'exceljs';

/**
 * Helper function to extract string value from Excel cell
 * Handles richText, formulas, and other complex cell values
 */
function getCellValueAsString(cellValue: any): string {
  if (cellValue === null || cellValue === undefined) {
    return '';
  }

  // Handle richText objects
  if (typeof cellValue === 'object' && cellValue.richText) {
    return cellValue.richText.map((rt: any) => rt.text || '').join('');
  }

  // Handle formula results
  if (typeof cellValue === 'object' && cellValue.result !== undefined) {
    return String(cellValue.result);
  }

  // Handle hyperlinks
  if (typeof cellValue === 'object' && cellValue.text !== undefined) {
    return String(cellValue.text);
  }

  // Handle dates
  if (cellValue instanceof Date) {
    return cellValue.toISOString();
  }

  // Handle arrays
  if (Array.isArray(cellValue)) {
    return cellValue.join(', ');
  }

  // Handle other objects - try to stringify
  if (typeof cellValue === 'object') {
    try {
      return JSON.stringify(cellValue);
    } catch {
      return String(cellValue);
    }
  }

  // Primitive types (string, number, boolean)
  return String(cellValue);
}

/**
 * Browser Excel file data structure
 */
export interface BrowserExcelFile {
  fileName: string;
  filePath: string; // Virtual path for browser
  folderPath: string;
  selected: boolean;
  sheetName?: string;
  headers?: string[];
  rowCount?: number;
  lastModified?: number;
  fileHandle?: FileSystemFileHandle;
}

/**
 * Browser Excel data structure
 */
export interface BrowserExcelData {
  sourceFiles: BrowserExcelFile[];
  headers: string[];
  rows: Array<{
    rowIndex: number;
    columns: Record<string, any>;
    rowColor?: string;
    sourceFile?: string;
  }>;
  totalRows: number;
  columnsCount: number;
}

/**
 * Scan directory for Excel files using File System Access API
 */
export async function scanDirectoryForExcel(
  dirHandle: FileSystemDirectoryHandle,
  recursive: boolean = false
): Promise<BrowserExcelFile[]> {
  const files: BrowserExcelFile[] = [];

  async function scanDir(currentDir: FileSystemDirectoryHandle, currentPath: string = '') {
    try {
      // @ts-ignore - FileSystemDirectoryHandle.entries() is async iterable
      for await (const [name, handle] of currentDir.entries()) {
        if (handle.kind === 'file') {
          // Check if it's an Excel file
          if (name.toLowerCase().endsWith('.xlsx') || name.toLowerCase().endsWith('.xls')) {
            const fileHandle = handle as FileSystemFileHandle;
            const file = await fileHandle.getFile();

            files.push({
              fileName: name,
              filePath: `${currentPath}/${name}`,
              folderPath: currentPath || '/',
              selected: false,
              lastModified: file.lastModified,
              fileHandle: fileHandle,
            });
          }
        } else if (handle.kind === 'directory' && recursive) {
          // Recursively scan subdirectories
          const subDir = handle as FileSystemDirectoryHandle;
          await scanDir(subDir, `${currentPath}/${name}`);
        }
      }
    } catch (error) {
      console.warn('Error scanning directory:', error);
    }
  }

  await scanDir(dirHandle);
  return files;
}

/**
 * Read single Excel file using File System Access API
 */
export async function readExcelFile(
  fileHandle: FileSystemFileHandle,
  config: {
    columnsToRead: number;
    colorColumnIndex: number;
    skipEmptyRows: boolean;
    headerRowIndex: number;
  }
): Promise<{
  headers: string[];
  rows: Array<{
    rowIndex: number;
    columns: Record<string, any>;
    rowColor?: string;
  }>;
  sheetName: string;
  totalRows: number;
}> {
  const file = await fileHandle.getFile();
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(await file.arrayBuffer());

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheets found in Excel file');
  }

  const headers: string[] = [];
  const rows: Array<{
    rowIndex: number;
    columns: Record<string, any>;
    rowColor?: string;
  }> = [];

  // Read headers
  const headerRow = worksheet.getRow(config.headerRowIndex + 1);
  for (let col = 1; col <= config.columnsToRead; col++) {
    const cell = headerRow.getCell(col);
    const headerValue = getCellValueAsString(cell.value);
    headers.push(headerValue || `Column ${col}`);
  }

  // Read data rows
  worksheet.eachRow((row, rowIndex) => {
    // Skip header row
    if (rowIndex <= config.headerRowIndex) return;

    const rowData: Record<string, string> = {}; // Changed to string
    let hasData = false;

    // Read configured number of columns - CONVERT ALL TO STRING
    for (let col = 1; col <= config.columnsToRead; col++) {
      const cell = row.getCell(col);
      const stringValue = getCellValueAsString(cell.value); // Direct conversion
      rowData[headers[col - 1]] = stringValue;

      if (stringValue !== null && stringValue !== undefined && stringValue !== '') {
        hasData = true;
      }
    }

    // Skip empty rows if configured
    if (config.skipEmptyRows && !hasData) return;

    // Extract color from color column
    let rowColor: string | undefined;
    if (config.colorColumnIndex >= 0 && config.colorColumnIndex < config.columnsToRead) {
      const colorCell = row.getCell(config.colorColumnIndex + 1);
      if (colorCell.fill) {
        const fill: any = colorCell.fill;
        if (fill.fgColor && fill.fgColor.argb) {
          rowColor = fill.fgColor.argb;
        }
      }
    }

    rows.push({
      rowIndex: rowIndex - 1, // 0-based
      columns: rowData,
      rowColor,
    });
  });

  return {
    headers,
    rows,
    sheetName: worksheet.name,
    totalRows: rows.length,
  };
}

/**
 * Read multiple Excel files using File System Access API
 */
export async function readMultipleExcelFiles(
  fileHandles: FileSystemFileHandle[],
  config: {
    columnsToRead: number;
    colorColumnIndex: number;
    skipEmptyRows: boolean;
    headerRowIndex: number;
  }
): Promise<BrowserExcelData> {
  const sourceFiles: BrowserExcelFile[] = [];
  const allRows: Array<{
    rowIndex: number;
    columns: Record<string, any>;
    rowColor?: string;
    sourceFile?: string;
  }> = [];
  let allHeaders: string[] = [];

  for (const fileHandle of fileHandles) {
    try {
      const fileData = await readExcelFile(fileHandle, config);

      // Use headers from first file as master headers
      if (allHeaders.length === 0) {
        allHeaders = fileData.headers;
      }

      // Add source file info
      const sourceFile: BrowserExcelFile = {
        fileName: fileHandle.name,
        filePath: fileHandle.name, // Virtual path
        folderPath: '/',
        selected: true,
        sheetName: fileData.sheetName,
        headers: fileData.headers,
        rowCount: fileData.totalRows,
        fileHandle: fileHandle,
      };
      sourceFiles.push(sourceFile);

      // Add rows with source file reference
      fileData.rows.forEach(row => {
        allRows.push({
          ...row,
          sourceFile: fileHandle.name,
        });
      });

    } catch (error) {
      console.error(`Error reading file ${fileHandle.name}:`, error);
      // Continue with other files
    }
  }

  return {
    sourceFiles,
    headers: allHeaders,
    rows: allRows,
    totalRows: allRows.length,
    columnsCount: allHeaders.length,
  };
}

/**
 * Save directory handle to IndexedDB
 */
export async function saveRootDirHandle(dirHandle: FileSystemDirectoryHandle): Promise<void> {
  if ('indexedDB' in window) {
    const db = await openDB();
    const transaction = db.transaction(['dirHandles'], 'readwrite');
    const store = transaction.objectStore('dirHandles');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(dirHandle, 'rootDir');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Load directory handle from IndexedDB
 */
export async function loadRootDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  if ('indexedDB' in window) {
    try {
      const db = await openDB();
      const transaction = db.transaction(['dirHandles'], 'readonly');
      const store = transaction.objectStore('dirHandles');
      return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
        const request = store.get('rootDir');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Open IndexedDB for storing directory handles
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ExcelAppDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('dirHandles')) {
        db.createObjectStore('dirHandles');
      }
    };
  });
}
