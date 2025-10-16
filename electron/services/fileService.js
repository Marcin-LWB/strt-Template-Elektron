import { dialog } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * File Service
 * Obsługuje operacje na plikach i katalogach
 */

class FileService {
  /**
   * Otwiera dialog wyboru katalogu
   * @returns {Promise<string|null>}
   */
  async selectDirectory(title = 'Wybierz folder z plikami Excel') {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title,
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    } catch (error) {
      logger.error(`Error selecting directory: ${error.message}`);
      throw error;
    }
  }

  /**
   * Skanuje katalog w poszukiwaniu plików .xlsx
   * @param {string} directoryPath - ścieżka do katalogu
   * @param {boolean} recursive - czy skanować rekurencyjnie
   * @returns {Promise<Object>}
   */
  async scanXlsxFiles(directoryPath, recursive = false) {
    try {
      logger.info(`Scanning directory: ${directoryPath} (recursive: ${recursive})`);
      
      const files = await this._walkDirectory(directoryPath, recursive);
      const xlsxFiles = files.filter(f => 
        f.fileName.endsWith('.xlsx') && !f.fileName.startsWith('~$')
      );

      logger.info(`Found ${xlsxFiles.length} xlsx files`);
      return { success: true, files: xlsxFiles };
      
    } catch (error) {
      logger.error(`Error scanning directory: ${error.message}`);
      return { success: false, files: [], error: error.message };
    }
  }

  /**
   * Skanuje katalog w poszukiwaniu plików .pdf
   */
  async scanPdfFiles(directoryPath, recursive = true) {
    try {
      logger.info(`Scanning directory for PDFs: ${directoryPath} (recursive: ${recursive})`);
      const files = await this._walkDirectory(directoryPath, recursive);
      const pdfFiles = files.filter(f => f.fileName.toLowerCase().endsWith('.pdf'));
      logger.info(`Found ${pdfFiles.length} pdf files`);
      return { success: true, files: pdfFiles };
    } catch (error) {
      logger.error(`Error scanning directory for PDFs: ${error.message}`);
      return { success: false, files: [], error: error.message };
    }
  }

  /**
   * Kopiuje wskazane pliki PDF do folderu docelowego, zachowując strukturę podfolderów
   */
  async copyPdfFiles(destinationRoot, tasks = []) {
    const copied = [];
    const errors = [];

    for (const task of tasks) {
      try {
        if (!task?.sourcePath || !task?.targetFileName) {
          throw new Error('Invalid copy task payload');
        }

        if (path.extname(task.sourcePath).toLowerCase() !== '.pdf') {
          logger.warn(`Skipping non-PDF file: ${task.sourcePath}`);
          continue;
        }

        const safeFileName = this._sanitizeFileName(task.targetFileName);
        const folderSegments = this._sanitizeFolderSegments(task.relativeFolder);

        // Sprawdź rozmiar pliku źródłowego
        const stats = await fs.stat(task.sourcePath);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        if (fileSizeMB > 50) {
          logger.warn(`Duży plik do skopiowania: ${safeFileName} (${fileSizeMB.toFixed(1)}MB)`);
        }

        // Sprawdź długość nazwy pliku
        if (safeFileName.length > 250) {
          throw new Error(`Nazwa pliku jest zbyt długa (${safeFileName.length} znaków): ${safeFileName.substring(0, 50)}...`);
        }

        const targetDir = path.join(destinationRoot, ...folderSegments);
        await fs.mkdir(targetDir, { recursive: true });

        const targetPath = path.join(targetDir, safeFileName);
        await fs.copyFile(task.sourcePath, targetPath);
        copied.push(targetPath);
      } catch (error) {
        logger.error(`Error copying PDF file: ${error.message}`);
        errors.push({ task, message: error.message });
      }
    }

    return {
      success: errors.length === 0,
      copied: copied.length,
      errors,
    };
  }

  /**
   * Rekurencyjnie przeszukuje katalog
   * @private
   */
  async _walkDirectory(dirPath, recursive, relativePath = '') {
    const results = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          results.push({
            fileName: entry.name,
            filePath: fullPath,
            folderPath: relativePath || '.',
            selected: false,
            lastModified: stats.mtimeMs,
          });
        } else if (entry.isDirectory() && recursive) {
          const subPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
          const subResults = await this._walkDirectory(fullPath, recursive, subPath);
          results.push(...subResults);
        }
      }
    } catch (error) {
      logger.warn(`Error reading directory ${dirPath}: ${error.message}`);
    }
    
    return results;
  }

  _sanitizeSegment(segment) {
    return segment
      ? segment.replace(/[<>:"/\\|?*]+/g, '_').trim().slice(0, 255) || '_'
      : '_';
  }

  _sanitizeFileName(name) {
    if (!name) return 'plik.pdf';
    const sanitized = name.replace(/[<>:"/\\|?*]+/g, '_').trim();
    return sanitized || 'plik.pdf';
  }

  _sanitizeFolderSegments(relativeFolder) {
    if (!relativeFolder) {
      return [];
    }

    const rawSegments = Array.isArray(relativeFolder)
      ? relativeFolder
      : String(relativeFolder)
          .split(/[\\/]+/)
          .map(part => part.trim())
          .filter(Boolean);

    return rawSegments.map((segment) => this._sanitizeSegment(segment));
  }
}

export const fileService = new FileService();
