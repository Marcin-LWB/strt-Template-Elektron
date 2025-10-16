import { z } from 'zod';
import { ExcelFileSchema, ExcelDataSchema, ExcelConfigSchema } from './excel.types';

/**
 * IPC Channels - kontrakty komunikacji między Main i Renderer
 */
export const IPC_CHANNELS = {
  // File operations
  SELECT_XLSX_DIRECTORY: 'file:select-xlsx-directory',
  SCAN_XLSX_FILES: 'file:scan-xlsx-files',
  SCAN_PDF_FILES: 'file:scan-pdf-files',
  COPY_PDF_FILES: 'file:copy-pdf-files',
  
  // Excel operations
  LOAD_EXCEL_FILE: 'excel:load-file',
  LOAD_MULTIPLE_EXCEL_FILES: 'excel:load-multiple-files',
  
  // Config
  GET_CONFIG: 'config:get',
  SET_CONFIG: 'config:set',
  
  // Logs
  LOG_INFO: 'log:info',
  LOG_ERROR: 'log:error',
  LOG_WARN: 'log:warn',
} as const;

/**
 * Request/Response schemas dla IPC
 */

// Scan XLSX files
export const ScanXlsxRequestSchema = z.object({
  directoryPath: z.string(),
  recursive: z.boolean().default(false),
});

export const ScanXlsxResponseSchema = z.object({
  success: z.boolean(),
  files: z.array(ExcelFileSchema),
  error: z.string().optional(),
});

export type ScanXlsxRequest = z.infer<typeof ScanXlsxRequestSchema>;
export type ScanXlsxResponse = z.infer<typeof ScanXlsxResponseSchema>;

// Load Excel file
export const LoadExcelRequestSchema = z.object({
  filePath: z.string(),
  config: ExcelConfigSchema.optional(),
});

export const LoadExcelResponseSchema = z.object({
  success: z.boolean(),
  data: ExcelDataSchema.optional(),
  error: z.string().optional(),
});

export type LoadExcelRequest = z.infer<typeof LoadExcelRequestSchema>;
export type LoadExcelResponse = z.infer<typeof LoadExcelResponseSchema>;

// Load multiple Excel files
export const LoadMultipleExcelRequestSchema = z.object({
  filePaths: z.array(z.string()),
  config: ExcelConfigSchema.optional(),
});

export type LoadMultipleExcelRequest = z.infer<typeof LoadMultipleExcelRequestSchema>;
