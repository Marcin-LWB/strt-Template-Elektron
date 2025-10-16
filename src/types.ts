export type CsvEntry = {
  folderPath: string; // ścieżka względna podfolderu względem root, np. "A/Plan"
  fileName: string;   // nazwa pliku CSV, np. "dane.csv"
  fileHandle?: FileSystemFileHandle; // handle do pliku
  dirHandle?: FileSystemDirectoryHandle; // handle do katalogu
};

export type CsvData = {
  headers: string[];
  rows: string[][];
};

export type CellPosition = {
  row: number;
  col: number;
};

export type EditingFile = {
  entry: CsvEntry;
  originalData: CsvData;
  currentData: CsvData;
  isModified: boolean;
};

export type CollectedFile = {
  title: string;
  fileName: string;
  folderPath: string;
  dirHandle?: FileSystemDirectoryHandle;
};

export type DirHandle = FileSystemDirectoryHandle;
export type FileHandle = FileSystemFileHandle;