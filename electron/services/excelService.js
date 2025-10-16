import ExcelJS from 'exceljs';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Excel Processing Service
 * Obsługuje odczyt i przetwarzanie plików Excel
 */

/**
 * Helper function to extract string value from Excel cell
 * Handles richText, formulas, and other complex cell values
 */
function getCellValueAsString(cellValue) {
  if (cellValue === null || cellValue === undefined) {
    return '';
  }

  // Handle richText objects
  if (typeof cellValue === 'object' && cellValue.richText) {
    return cellValue.richText.map(rt => rt.text || '').join('');
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

class ExcelService {
  /**
   * Wczytuje pojedynczy plik Excel
   * @param {string} filePath - ścieżka do pliku
   * @param {Object} config - konfiguracja
   * @returns {Promise<Object>}
   */
  async loadExcelFile(filePath, config = {}) {
    const {
      columnsToRead = 10,
      colorColumnIndex = 1,
      skipEmptyRows = true,
      headerRowIndex = 0,
    } = config;

    try {
      logger.info(`Loading Excel file: ${filePath}`);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      // Pobierz pierwszy arkusz
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('Brak arkuszy w pliku Excel');
      }

      const sheetName = worksheet.name;
      const headers = [];
      const rows = [];
      
      // Odczytaj nagłówki z pierwszego wiersza
      const headerRow = worksheet.getRow(headerRowIndex + 1);
      for (let i = 1; i <= columnsToRead; i++) {
        const cell = headerRow.getCell(i);
        const headerValue = getCellValueAsString(cell.value);
        headers.push(headerValue || `Column ${i}`);
      }

      // Odczytaj dane - używaj getCellValueAsString
      worksheet.eachRow((row, rowNumber) => {
        // Pomiń wiersz nagłówkowy
        if (rowNumber <= headerRowIndex + 1) return;
        
        const columns = {};
        let hasData = false;
        
        for (let i = 1; i <= columnsToRead; i++) {
          const cell = row.getCell(i);
          const stringValue = getCellValueAsString(cell.value);
          columns[headers[i - 1]] = stringValue;
          if (stringValue) hasData = true;
        }
        
        // Pomiń puste wiersze jeśli włączone
        if (skipEmptyRows && !hasData) return;
        
        // Pobierz kolor z określonej kolumny
        const colorCell = row.getCell(colorColumnIndex + 1);
        const fillColor = colorCell.style?.fill?.fgColor?.argb || 
                         colorCell.style?.fill?.bgColor?.argb;
        
        rows.push({
          rowIndex: rowNumber,
          rowColor: fillColor || undefined,
          columns,
        });
      });

      const result = {
        sourceFiles: [{
          fileName: path.basename(filePath),
          filePath,
          sheetName,
          headers,
          rowCount: rows.length,
        }],
        headers,
        rows,
        totalRows: rows.length,
        columnsCount: columnsToRead,
      };

      logger.info(`Loaded ${rows.length} rows from ${sheetName}`);
      return { success: true, data: result };
      
    } catch (error) {
      logger.error(`Error loading Excel file: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Wczytuje wiele plików Excel i łączy dane
   * @param {string[]} filePaths - tablica ścieżek do plików
   * @param {Object} config - konfiguracja
   * @returns {Promise<Object>}
   */
  async loadMultipleExcelFiles(filePaths, config = {}) {
    try {
      logger.info(`Loading ${filePaths.length} Excel files`);
      
      const sourceFiles = [];
      let allRows = [];
      let commonHeaders = [];
      
      for (const filePath of filePaths) {
        const result = await this.loadExcelFile(filePath, config);
        
        if (!result.success) {
          logger.warn(`Failed to load ${filePath}: ${result.error}`);
          continue;
        }
        
        sourceFiles.push(...result.data.sourceFiles);
        
        // Ustaw nagłówki z pierwszego pliku
        if (commonHeaders.length === 0) {
          commonHeaders = result.data.headers;
        }
        
        // Dodaj wiersze z oznaczeniem źródła
        const rowsWithSource = result.data.rows.map(row => ({
          ...row,
          sourceFile: result.data.sourceFiles[0].fileName,
        }));
        
        allRows = [...allRows, ...rowsWithSource];
      }

      const finalData = {
        sourceFiles,
        headers: commonHeaders,
        rows: allRows,
        totalRows: allRows.length,
        columnsCount: config.columnsToRead || 10,
      };

      logger.info(`Loaded total ${allRows.length} rows from ${sourceFiles.length} files`);
      return { success: true, data: finalData };
      
    } catch (error) {
      logger.error(`Error loading multiple Excel files: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

export const excelService = new ExcelService();
