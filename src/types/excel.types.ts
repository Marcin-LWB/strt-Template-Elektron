import { z } from 'zod';

/**
 * Schema dla pojedynczego rekordu z Excela
 */
export const ExcelRowSchema = z.object({
  rowIndex: z.number(),
  rowColor: z.string().optional(), // Kolor z drugiej kolumny
  sourceFile: z.string().optional(), // Nazwa pliku źródłowego
  columns: z.record(z.string(), z.any()), // Dynamiczne kolumny
});

export type ExcelRow = z.infer<typeof ExcelRowSchema>;

/**
 * Schema dla pliku Excel
 */
export const ExcelFileSchema = z.object({
  fileName: z.string(),
  filePath: z.string(),
  folderPath: z.string().optional(), // Dodane dla kompatybilności ze skanowaniem
  selected: z.boolean().default(false),
  sheetName: z.string().optional(),
  headers: z.array(z.string()).optional(),
  rowCount: z.number().optional(),
  lastModified: z.number().optional(),
});

export type ExcelFile = z.infer<typeof ExcelFileSchema>;

/**
 * Schema dla załadowanych danych z wielu arkuszy
 */
export const ExcelDataSchema = z.object({
  sourceFiles: z.array(ExcelFileSchema),
  headers: z.array(z.string()),
  rows: z.array(ExcelRowSchema),
  totalRows: z.number(),
  columnsCount: z.number(),
});

export type ExcelData = z.infer<typeof ExcelDataSchema>;

/**
 * Column display configuration
 */
export const ColumnDisplaySchema = z.object({
  name: z.string(),
  width: z.number().min(60).max(500),
  visible: z.boolean().default(true),
});

export type ColumnDisplay = z.infer<typeof ColumnDisplaySchema>;

/**
 * Display mode for columns
 */
export type DisplayMode = 'all' | 'custom';

/**
 * Konfiguracja przetwarzania Excela
 */
export const ExcelConfigSchema = z.object({
  columnsToRead: z.number().min(1).max(50).default(10),
  colorColumnIndex: z.number().default(1), // Indeks kolumny z kolorem (0-based)
  skipEmptyRows: z.boolean().default(true),
  headerRowIndex: z.number().default(0),
  columnWidth: z.number().min(80).max(400).default(150).optional(), // Szerokość kolumn w px (dla trybu 'all')
  displayMode: z.enum(['all', 'custom']).default('custom'), // Tryb wyświetlania kolumn - DOMYŚLNIE CUSTOM
  customColumns: z.array(ColumnDisplaySchema).optional(), // Konfiguracja kolumn w trybie 'custom'
});

export type ExcelConfig = z.infer<typeof ExcelConfigSchema>;

/**
 * Default custom columns configuration
 */
export const DEFAULT_CUSTOM_COLUMNS: ColumnDisplay[] = [
  { name: 'Folder', width: 80, visible: true },
  { name: 'Exist', width: 80, visible: true },
  { name: 'FILE NUMBER', width: 120, visible: true },
  { name: 'FILE TITLE (PL)', width: 200, visible: true },
  // { name: 'FILE TITLE (EN)', width: 20, visible: true },
  { name: 'Final File Name', width: 100, visible: true },
];
