import type { CsvEntry } from './types';

/** Prosta funkcja łączenia ścieżek względnych */
export function joinPath(a: string, b: string) {
  if (!a) return b;
  if (!b) return a;
  return `${a.replace(/\/+$/,'')}/${b.replace(/^\/+/, '')}`;
}

/** Rekurencyjne przejście po katalogu i zebranie plików CSV */
export async function listCsvFiles(
  root: FileSystemDirectoryHandle,
  options?: { recursive?: boolean }
): Promise<CsvEntry[]> {
  const out: CsvEntry[] = [];
  await walkDir(root, '', out, options?.recursive ?? true);
  return out.sort((a, b) => {
    const fa = a.folderPath.localeCompare(b.folderPath);
    return fa !== 0 ? fa : a.fileName.localeCompare(b.fileName);
  });
}

async function walkDir(
  dir: FileSystemDirectoryHandle,
  relativePath: string,
  sink: CsvEntry[],
  recursive: boolean
) {
  // @ts-ignore - async iterator w FS Access API
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === 'file') {
      if (name.toLowerCase().endsWith('.csv')) {
        sink.push({ 
          folderPath: relativePath || '.', 
          fileName: name,
          fileHandle: handle as FileSystemFileHandle,
          dirHandle: dir
        });
      }
    } else if (handle.kind === 'directory' && recursive) {
      await walkDir(handle, joinPath(relativePath, name), sink, recursive);
    }
  }
}

/** Prośba o uprawnienia do folderu po wczytaniu z IndexedDB */
export async function ensureReadPermission(dir: FileSystemDirectoryHandle): Promise<boolean> {
  // @ts-ignore
  const state = await dir.queryPermission?.({ mode: 'read' });
  if (state === 'granted') return true;
  // @ts-ignore
  const req = await dir.requestPermission?.({ mode: 'read' });
  return req === 'granted';
}

/** Parsowanie CSV z średnikami jako separatory */
export function parseCsv(text: string): { headers: string[], rows: string[][] } {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  
  // Funkcja pomocnicza do usuwania cudzysłowów
  const cleanCell = (cell: string): string => {
    let cleaned = cell.trim();
    // Usuń cudzysłowy z początku i końca jeśli są
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
      // Obsłuż podwójne cudzysłowy (escape w CSV)
      cleaned = cleaned.replace(/""/g, '"');
    }
    return cleaned;
  };
  
  const headers = lines[0].split(';').map(cleanCell);
  const rows = lines.slice(1).map(line => 
    line.split(';').map(cleanCell)
  );
  
  return { headers, rows };
}

/** Odczyt pliku CSV */
export async function readCsvFile(fileHandle: FileSystemFileHandle): Promise<{ headers: string[], rows: string[][] }> {
  const file = await fileHandle.getFile();
  const text = await file.text();
  return parseCsv(text);
}

/** Konwersja danych CSV z powrotem do tekstu z średnikami */
export function stringifyCsv(data: { headers: string[], rows: string[][] }): string {
  // Funkcja pomocnicza do escape'owania komórek
  const escapeCell = (cell: string): string => {
    // Jeśli komórka zawiera średnik, cudzysłów lub znak nowej linii, otoczyć cudzysłowami
    if (cell.includes(';') || cell.includes('"') || cell.includes('\n') || cell.includes('\r')) {
      // Podwój wszystkie cudzysłowy w środku
      const escaped = cell.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    return cell;
  };
  
  const lines = [
    data.headers.map(escapeCell).join(';'),
    ...data.rows.map(row => row.map(escapeCell).join(';'))
  ];
  return lines.join('\n');
}

/** Zapis danych CSV do pliku */
export async function saveCsvFile(fileHandle: FileSystemFileHandle, data: { headers: string[], rows: string[][] }): Promise<void> {
  // @ts-ignore
  const writable = await fileHandle.createWritable();
  const content = stringifyCsv(data);
  await writable.write(content);
  await writable.close();
}

async function walkTxtFiles(
  dir: FileSystemDirectoryHandle,
  sink: string[],
  options: { recursive: boolean }
) {
  // @ts-ignore - async iterator w FS Access API
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === 'file') {
      if (name.toLowerCase().endsWith('.txt')) {
        sink.push(name);
      }
    } else if (handle.kind === 'directory' && options.recursive) {
      await walkTxtFiles(handle as FileSystemDirectoryHandle, sink, options);
    }
  }
}

export async function collectTxtFileNames(
  root: FileSystemDirectoryHandle,
  options: { recursive?: boolean } = {}
): Promise<string[]> {
  const sink: string[] = [];
  await walkTxtFiles(root, sink, { recursive: options.recursive ?? true });
  return sink;
}