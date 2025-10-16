import { useEffect, useMemo, useState } from 'react'
import './styles.css'
import type { CsvEntry, CsvData, EditingFile, CollectedFile } from './types'
import { listCsvFiles, ensureReadPermission, readCsvFile, saveCsvFile, collectTxtFileNames } from './fs-utils'
import { saveRootDirHandle, loadRootDirHandle, clearRootDirHandle } from './lib/storage'
import SearchComponent from './SearchComponent'
import type { SearchResult } from './SearchComponent'
import FileExistCheckButton from './components/FileExistCheckButton'
import MergeCsvComponent from './MergeCsvComponent'

type LinkMessage = {
  text: string;
  tone: 'info' | 'error';
};

function truncateAfterSecondEquals(value: string): string {
  if (!value) return '';
  const firstIndex = value.indexOf('=');
  if (firstIndex === -1) {
    return value;
  }

  const secondIndex = value.indexOf('=', firstIndex + 1);
  if (secondIndex === -1) {
    return value;
  }

  return value.slice(0, secondIndex).trimEnd();
}

function cleanYoutubeLink(rawLink: string): string {
  if (!rawLink) return '';
  const trimmed = rawLink.trim().replace(/[);,\.\s]+$/g, '');
  const truncated = truncateAfterSecondEquals(trimmed);
  return truncated.trim();
}

function createYoutubeLinkKey(rawLink: string): string | null {
  const cleaned = cleanYoutubeLink(rawLink);
  if (!cleaned) return null;
  return cleaned.toLowerCase();
}

function extractYoutubeLinksFromRow(row: string[]): string[] {
  const links = new Set<string>();

  row.forEach(cell => {
    if (!cell) return;
    const matches = cell.match(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\s"']*/gi) ?? [];
    matches.forEach(rawLink => {
      const cleaned = cleanYoutubeLink(rawLink);
      if (cleaned) {
        links.add(cleaned);
      }
    });
  });

  return Array.from(links);
}

const TITLE_HEADER_KEYWORDS = ['tutuł', 'tytul', 'title', 'tytuł'];

function findTitleColumnIndex(headers: string[]): number {
  return headers.findIndex(header => {
    const lowerHeader = header.toLowerCase().trim();
    return TITLE_HEADER_KEYWORDS.some(keyword => lowerHeader.includes(keyword));
  });
}

function extractTitleFromRow(headers: string[], row: string[], fallback?: string): string | null {
  if (fallback && fallback.trim()) {
    return fallback.trim();
  }

  const index = findTitleColumnIndex(headers);
  if (index === -1) return null;
  const value = row[index];
  return value?.trim() ? value.trim() : null;
}

const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;
const INVALID_FILENAME_CHECK = /[<>:"/\\|?*\u0000-\u001F]/;
const RESERVED_FILENAMES = new Set(['.', '..']);

function normalizeFileNameCandidate(input: string): string {
  return input
    .replace(INVALID_FILENAME_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.\s]+$/g, '');
}

function isAllowedFileName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (RESERVED_FILENAMES.has(trimmed)) return false;
  if (INVALID_FILENAME_CHECK.test(trimmed)) return false;
  if (/[/\\]/.test(trimmed)) return false;
  return true;
}

function normalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '');
}

function generateCandidateTxtNames(title: string): string[] {
  const trimmed = title.trim();
  if (!trimmed) return [];

  const ensureTxt = (name: string) => (name.toLowerCase().endsWith('.txt') ? name : `${name}.txt`);
  const candidateSet = new Set<string>();
  const pushCandidate = (name: string) => {
    if (!name) return;
    if (!isAllowedFileName(name)) return;
    candidateSet.add(name);
  };

  pushCandidate(ensureTxt(trimmed));
  if (!trimmed.toLowerCase().endsWith('.txt')) {
    pushCandidate(trimmed);
  }

  const sanitized = normalizeFileNameCandidate(trimmed);
  if (sanitized && sanitized !== trimmed) {
    pushCandidate(ensureTxt(sanitized));
    if (!sanitized.toLowerCase().endsWith('.txt')) {
      pushCandidate(sanitized);
    }
  }

  return Array.from(candidateSet);
}

function determineFileNameForTitle(title: string): string | null {
  const candidates = generateCandidateTxtNames(title);
  return candidates.find(candidate => candidate.toLowerCase().endsWith('.txt')) ?? null;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [rootDir, setRootDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [rows, setRows] = useState<CsvEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recursive, setRecursive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<CsvEntry | null>(null);
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [editingFile, setEditingFile] = useState<EditingFile | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [savingCsv, setSavingCsv] = useState(false);
  const [copyingFiles, setCopyingFiles] = useState(false);
  const [checkingFileExist, setCheckingFileExist] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [collectedLinks, setCollectedLinks] = useState<string[]>([]);
  const [collectedFiles, setCollectedFiles] = useState<CollectedFile[]>([]);
  const [linkMessage, setLinkMessage] = useState<LinkMessage | null>(null);
  const collectedLinksJoined = useMemo(() => collectedLinks.join(';'), [collectedLinks]);

  // Przy starcie spróbuj wczytać poprzednio zapisany handle do folderu
  useEffect(() => {
    (async () => {
      const saved = await loadRootDirHandle();
      if (saved) {
        const ok = await ensureReadPermission(saved);
        if (ok) {
          setRootDir(saved);
          await rescan(saved, recursive);
        }
      }
    })();
  }, []);

  async function pickRootFolder() {
    try {
      // @ts-ignore
      const dir = await window.showDirectoryPicker();
      setRootDir(dir);
      await saveRootDirHandle(dir);
      await rescan(dir, recursive);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setError('Nie udało się wybrać folderu.');
        setStatus('error');
      }
    }
  }

  async function rescan(dir = rootDir, rec = recursive) {
    if (!dir) return;
    setStatus('loading');
    setError(null);
    try {
      const items = await listCsvFiles(dir, { recursive: rec });
      setRows(items);
      setStatus('ready');
    } catch (e: any) {
      setError(e?.message ?? 'Błąd podczas skanowania.');
      setStatus('error');
    }
  }

  async function forgetFolder() {
    setRootDir(null);
    setRows([]);
    setSelectedFile(null);
    setCsvData(null);
    setCollectedLinks([]);
    setCollectedFiles([]);
    setLinkMessage(null);
    await clearRootDirHandle();
    setStatus('idle');
  }

  async function loadFile(entry: CsvEntry) {
    if (!entry.fileHandle) return;
    
    setLoadingCsv(true);
    setSelectedFile(entry);
    setEditingFile(null);
    setSelectedCells(new Set());
    
    try {
      const data = await readCsvFile(entry.fileHandle);
      setCsvData(data);
      setEditingFile({
        entry,
        originalData: data,
        currentData: JSON.parse(JSON.stringify(data)), // deep copy
        isModified: false
      });
    } catch (e: any) {
      setError(`Błąd odczytu pliku: ${e?.message ?? 'Nieznany błąd'}`);
      setCsvData(null);
      setEditingFile(null);
    } finally {
      setLoadingCsv(false);
    }
  }

  function getCellKey(row: number, col: number): string {
    return `${row}-${col}`;
  }

  function handleCellClick(row: number, col: number, event: React.MouseEvent) {
    event.preventDefault();
    const cellKey = getCellKey(row, col);
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+click - toggle selection
      const newSelected = new Set(selectedCells);
      if (newSelected.has(cellKey)) {
        newSelected.delete(cellKey);
      } else {
        newSelected.add(cellKey);
      }
      setSelectedCells(newSelected);
    } else if (event.shiftKey && selectedCells.size > 0) {
      // Shift+click - select range (simplified - select all cells in rectangle)
      const lastCell = Array.from(selectedCells)[selectedCells.size - 1];
      const [lastRow, lastCol] = lastCell.split('-').map(Number);
      
      const minRow = Math.min(row, lastRow);
      const maxRow = Math.max(row, lastRow);
      const minCol = Math.min(col, lastCol);
      const maxCol = Math.max(col, lastCol);
      
      const newSelected = new Set<string>();
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newSelected.add(getCellKey(r, c));
        }
      }
      setSelectedCells(newSelected);
    } else {
      // Regular click - select single cell
      setSelectedCells(new Set([cellKey]));
    }
  }

  function handleCellChange(row: number, col: number, value: string) {
    if (!editingFile) return;
    
    const newData = { ...editingFile.currentData };
    newData.rows[row][col] = value;
    
    const isModified = JSON.stringify(newData) !== JSON.stringify(editingFile.originalData);
    
    setEditingFile({
      ...editingFile,
      currentData: newData,
      isModified
    });
    setCsvData(newData);
  }

  function handleBulkEdit() {
    if (!editingFile || selectedCells.size === 0 || !bulkEditValue.trim()) return;
    
    const newData = { ...editingFile.currentData };
    
    selectedCells.forEach(cellKey => {
      const [row, col] = cellKey.split('-').map(Number);
      if (newData.rows[row] && newData.rows[row][col] !== undefined) {
        newData.rows[row][col] = bulkEditValue.trim();
      }
    });
    
    const isModified = JSON.stringify(newData) !== JSON.stringify(editingFile.originalData);
    
    setEditingFile({
      ...editingFile,
      currentData: newData,
      isModified
    });
    setCsvData(newData);
    setBulkEditValue('');
    setSelectedCells(new Set());
  }

  async function addLinksFromEntryRow(entry: CsvEntry, rowIndex: number, providedTitle?: string) {
    if (!entry.fileHandle) {
      setLinkMessage({ text: 'Brak dostępu do wybranego pliku.', tone: 'error' });
      return;
    }

    try {
      let data: CsvData | null = null;

      if (editingFile && editingFile.entry === entry) {
        data = editingFile.currentData;
      } else if (selectedFile && selectedFile === entry && csvData) {
        data = csvData;
      } else {
        data = await readCsvFile(entry.fileHandle);
      }

      if (!data || !data.rows[rowIndex]) {
        setLinkMessage({ text: 'Nie znaleziono wskazanego wiersza w pliku.', tone: 'error' });
        return;
      }

      const row = data.rows[rowIndex];
      const links = extractYoutubeLinksFromRow(row);
      const title = extractTitleFromRow(data.headers, row, providedTitle ?? undefined);
      const messages: string[] = [];

      if (links.length === 0) {
        messages.push('Brak linków YouTube w tym wierszu.');
      } else {
        const existingLinkKeys = new Set(
          collectedLinks
            .map(link => createYoutubeLinkKey(link))
            .filter((value): value is string => Boolean(value))
        );

        const deduped = links.filter(link => {
          const key = createYoutubeLinkKey(link);
          if (!key) return false;
          if (existingLinkKeys.has(key)) {
            return false;
          }
          existingLinkKeys.add(key);
          return true;
        });

        if (deduped.length === 0) {
          messages.push('Wszystkie linki z tego wiersza są już zapisane.');
        } else {
          setCollectedLinks(prev => [...prev, ...deduped.map(cleanYoutubeLink)]);
          const suffix = deduped.length === 1 ? '' : 'i';
          messages.push(`Dodano ${deduped.length} link${suffix} YouTube.`);
        }
      }

      if (title) {
        const preferredFileName = determineFileNameForTitle(title);
        if (preferredFileName) {
          const normalizedPreferred = normalizeForComparison(preferredFileName);
          const exists = collectedFiles.some(file => normalizeForComparison(file.fileName) === normalizedPreferred);
          if (!exists) {
            const folderPath = entry.folderPath;
            const dirHandle = entry.dirHandle;
            setCollectedFiles(prev => [
              ...prev,
              {
                title,
                fileName: preferredFileName,
                folderPath,
                dirHandle
              }
            ]);
            messages.push(`Dodano plik do listy: ${preferredFileName}`);
          } else {
            messages.push(`Plik ${preferredFileName} jest już na liście.`);
          }
        } else {
          messages.push('Nie udało się przygotować nazwy pliku TXT na podstawie tytułu.');
        }
      } else {
        messages.push('Nie udało się zidentyfikować tytułu w tym wierszu.');
      }

      setLinkMessage({ text: messages.join(' '), tone: 'info' });
    } catch (e: any) {
      console.error(e);
      setLinkMessage({ text: `Nie udało się odczytać linków: ${e?.message ?? 'Nieznany błąd'}`, tone: 'error' });
    }
  }

  async function handleRowAdd(rowIndex: number) {
    if (!selectedFile) {
      setLinkMessage({ text: 'Najpierw wybierz plik.', tone: 'error' });
      return;
    }

    await addLinksFromEntryRow(selectedFile, rowIndex);
  }

  async function handleSearchAdd(result: SearchResult) {
    const entry = rows.find(
      file => file.folderPath === result.folderPath && file.fileName === result.fileName
    );

    if (!entry) {
      setLinkMessage({ text: 'Nie znaleziono pliku odpowiadającego wynikowi wyszukiwania.', tone: 'error' });
      return;
    }

  await addLinksFromEntryRow(entry, result.rowIndex, result.title);
  }

  async function copyCollectedLinks() {
    if (collectedLinks.length === 0) {
      setLinkMessage({ text: 'Brak linków do skopiowania.', tone: 'error' });
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(collectedLinksJoined);
        setLinkMessage({ text: 'Skopiowano linki do schowka.', tone: 'info' });
      } else {
        setLinkMessage({ text: 'Przeglądarka nie wspiera kopiowania do schowka.', tone: 'error' });
      }
    } catch (e) {
      console.error(e);
      setLinkMessage({ text: 'Nie udało się skopiować linków do schowka.', tone: 'error' });
    }
  }

  function resetCollectedLinks() {
    setCollectedLinks([]);
    setCollectedFiles([]);
    setLinkMessage({ text: 'Lista linków i plików została wyczyszczona.', tone: 'info' });
  }

  async function handleCheckFileExistColumn() {
    if (!rootDir) {
      setLinkMessage({ text: 'Najpierw wybierz folder główny.', tone: 'error' });
      return;
    }

    if (!editingFile || !csvData) {
      setLinkMessage({ text: 'Wybierz plik CSV, aby móc sprawdzić pliki TXT.', tone: 'error' });
      return;
    }

    const fileHandle = editingFile.entry.fileHandle;
    if (!fileHandle) {
      setLinkMessage({ text: 'Brak dostępu do uchwytu pliku CSV. Wybierz plik ponownie.', tone: 'error' });
      return;
    }

    setCheckingFileExist(true);

    try {
      const txtNames = await collectTxtFileNames(rootDir, { recursive: true });
      const normalizedTxt = new Set<string>();
      txtNames.forEach(name => {
        const normalized = normalizeForComparison(name);
        if (normalized) {
          normalizedTxt.add(normalized);
        }
      });

      const originalHeaders = editingFile.currentData.headers;
      const columnExistsIndex = originalHeaders.findIndex(h => h.toLowerCase().trim() === 'fileexist');
      const statusIndex = originalHeaders.findIndex(h => h.toLowerCase().trim() === 'status');

      const newHeaders = [...originalHeaders];
      let fileExistIndex = columnExistsIndex;
      let insertedColumn = false;

      if (fileExistIndex === -1) {
        const insertIndex = statusIndex === -1 ? newHeaders.length : statusIndex + 1;
        newHeaders.splice(insertIndex, 0, 'fileExist');
        fileExistIndex = insertIndex;
        insertedColumn = true;
      }

      let matches = 0;
      const headersForTitle = insertedColumn ? originalHeaders : newHeaders;

      const updatedRows = editingFile.currentData.rows.map(row => {
        const title = extractTitleFromRow(headersForTitle, row) ?? '';

        let exists = false;
        if (title && title.trim()) {
          const candidateNames = new Set<string>();
          candidateNames.add(title);
          generateCandidateTxtNames(title).forEach(name => candidateNames.add(name));

          for (const candidate of candidateNames) {
            const normalized = normalizeForComparison(candidate);
            if (normalized && normalizedTxt.has(normalized)) {
              exists = true;
              break;
            }
          }
        }

        if (exists) matches += 1;

        const value = exists ? 'yes' : '';
        const newRow = [...row];

        if (insertedColumn) {
          newRow.splice(fileExistIndex, 0, value);
        } else {
          if (fileExistIndex >= newRow.length) {
            newRow[fileExistIndex] = value;
          } else {
            newRow[fileExistIndex] = value;
          }
        }

        return newRow;
      });

      const updatedData: CsvData = {
        headers: insertedColumn ? newHeaders : originalHeaders,
        rows: updatedRows
      };

      const isModified = JSON.stringify(updatedData) !== JSON.stringify(editingFile.originalData);
      const nextEditingState: EditingFile = {
        ...editingFile,
        currentData: updatedData,
        isModified
      };

      setCsvData(updatedData);

      setEditingFile(nextEditingState);

      try {
  await saveCsvFile(fileHandle, updatedData);
        const persistedData: CsvData = JSON.parse(JSON.stringify(updatedData));
        setEditingFile({
          ...nextEditingState,
          originalData: persistedData,
          currentData: persistedData,
          isModified: false
        });
        setCsvData(persistedData);
        setError(null);
        setLinkMessage({
          text: `Kolumna fileExist została zaktualizowana i zapisano zmiany. Znaleziono ${matches} z ${updatedRows.length} plików TXT.`,
          tone: 'info'
        });
      } catch (saveError: any) {
        console.error(saveError);
        setEditingFile(nextEditingState);
        setError(`Nie udało się zapisać pliku po aktualizacji fileExist: ${saveError?.message ?? 'Nieznany błąd'}`);
        setLinkMessage({
          text: `Kolumna fileExist została zaktualizowana, ale nie zapisano zmian: ${saveError?.message ?? 'Nieznany błąd'}`,
          tone: 'error'
        });
      }
    } catch (e: any) {
      console.error(e);
      setLinkMessage({ text: `Nie udało się sprawdzić plików: ${e?.message ?? 'Nieznany błąd'}`, tone: 'error' });
    } finally {
      setCheckingFileExist(false);
    }
  }

  async function findTxtFileHandle(file: CollectedFile): Promise<{ handle: FileSystemFileHandle; fileName: string } | null> {
    if (!rootDir) return null;

    const candidateNamesSet = new Set<string>();
    const normalizedTargets = new Set<string>();

    const addCandidate = (name?: string | null) => {
      if (!name) return;
      if (!isAllowedFileName(name)) return;
      candidateNamesSet.add(name);
      const normalized = normalizeForComparison(name);
      if (normalized) {
        normalizedTargets.add(normalized);
      }
    };

    addCandidate(file.fileName);
    const generated = generateCandidateTxtNames(file.title);
    generated.forEach(addCandidate);

    const normalizedTitle = normalizeForComparison(file.title);
    if (normalizedTitle) {
      normalizedTargets.add(normalizedTitle);
    }

    if (candidateNamesSet.size === 0 && normalizedTargets.size === 0) {
      return null;
    }

    const candidateNames = Array.from(candidateNamesSet);
    const candidateNameLower = new Set(candidateNames.map(name => name.toLowerCase()));
    const visitedDirs = new Set<FileSystemDirectoryHandle>();
    const queue: FileSystemDirectoryHandle[] = [];

    const enqueueDir = (dir?: FileSystemDirectoryHandle | null) => {
      if (!dir) return;
      if (visitedDirs.has(dir)) return;
      visitedDirs.add(dir);
      queue.push(dir);
    };

    enqueueDir(file.dirHandle ?? null);
    enqueueDir(rootDir);

    const tryExactNames = async (dir: FileSystemDirectoryHandle) => {
      for (const name of candidateNames) {
        try {
          // @ts-ignore - getFileHandle z File System Access API
          const handle = await dir.getFileHandle(name);
          if (handle) {
            return { handle: handle as FileSystemFileHandle, fileName: name };
          }
        } catch (err: any) {
          if (err?.name === 'NotFoundError') {
            continue;
          }
          if (err?.name === 'TypeMismatchError' || err?.name === 'SyntaxError') {
            continue;
          }
          throw err;
        }
      }
      return null;
    };

    const searchDirectory = async (dir: FileSystemDirectoryHandle): Promise<{ handle: FileSystemFileHandle; fileName: string } | null> => {
      const exactMatch = await tryExactNames(dir);
      if (exactMatch) return exactMatch;

      const subdirs: FileSystemDirectoryHandle[] = [];
      // @ts-ignore - async iterator po katalogu
      for await (const [entryName, handle] of dir.entries()) {
        if (handle.kind === 'file') {
          if (!entryName.toLowerCase().endsWith('.txt')) continue;
          if (candidateNameLower.has(entryName.toLowerCase())) {
            return { handle: handle as FileSystemFileHandle, fileName: entryName };
          }
          const normalized = normalizeForComparison(entryName);
          if (normalized && normalizedTargets.has(normalized)) {
            return { handle: handle as FileSystemFileHandle, fileName: entryName };
          }
        } else if (handle.kind === 'directory') {
          subdirs.push(handle as FileSystemDirectoryHandle);
        }
      }

      subdirs.forEach(subDir => enqueueDir(subDir));
      return null;
    };

    while (queue.length > 0) {
      const dir = queue.shift()!;
      const result = await searchDirectory(dir);
      if (result) {
        return result;
      }
    }

    return null;
  }

  async function handleCopyFiles() {
    if (!rootDir) {
      setLinkMessage({ text: 'Najpierw wybierz folder główny.', tone: 'error' });
      return;
    }

    if (collectedFiles.length === 0) {
      setLinkMessage({ text: 'Brak plików na liście do skopiowania.', tone: 'error' });
      return;
    }

    setCopyingFiles(true);
    try {
      const missing: string[] = [];
      const readyToCopy: { title: string; fileName: string; handle: FileSystemFileHandle }[] = [];

      for (const file of collectedFiles) {
        const match = await findTxtFileHandle(file);
        if (match) {
          readyToCopy.push({ title: file.title, fileName: match.fileName, handle: match.handle });
        } else {
          missing.push(file.title);
        }
      }

      if (readyToCopy.length === 0) {
        setLinkMessage({ text: 'Nie znaleziono żadnych pasujących plików TXT w folderze głównym.', tone: 'error' });
        return;
      }

      if (missing.length > 0) {
        const missingList = missing.slice(0, 5).join(', ');
        const suffix = missing.length > 5 ? '…' : '';
        setLinkMessage({ text: `Brak plików TXT dla: ${missingList}${suffix}`, tone: 'error' });
        return;
      }

      // @ts-ignore - experimental opcje picker'a
      const targetDir: FileSystemDirectoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });

      // @ts-ignore
      const perm = await targetDir.requestPermission?.({ mode: 'readwrite' });
      if (perm && perm !== 'granted') {
        setLinkMessage({ text: 'Brak uprawnień do zapisu w wybranym folderze.', tone: 'error' });
        return;
      }

      for (const file of readyToCopy) {
        const sourceFile = await file.handle.getFile();
        const contents = await sourceFile.arrayBuffer();
        // @ts-ignore
        const targetFileHandle = await targetDir.getFileHandle(file.fileName, { create: true });
        const writable = await targetFileHandle.createWritable();
        await writable.write(contents);
        await writable.close();
      }

      const suffix = readyToCopy.length === 1 ? '' : 'i';
      setLinkMessage({ text: `Skopiowano ${readyToCopy.length} plik${suffix} TXT.`, tone: 'info' });
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setLinkMessage({ text: 'Operacja kopiowania została anulowana.', tone: 'info' });
      } else {
        console.error(e);
        setLinkMessage({ text: `Nie udało się skopiować plików: ${e?.message ?? 'Nieznany błąd'}`, tone: 'error' });
      }
    } finally {
      setCopyingFiles(false);
    }
  }

  function normalizeHeaderName(header: string): string {
    return header.trim().toLowerCase();
  }

  async function mergeCsvFiles(fileA: CsvEntry, fileB: CsvEntry) {
    if (!fileA.fileHandle || !fileB.fileHandle) {
      throw new Error('Brak dostępu do wybranego pliku CSV.');
    }

    setIsMerging(true);

    try {
      const [dataA, dataB] = await Promise.all(
        [fileA, fileB].map(file => {
          if (editingFile && editingFile.entry === file) {
            return Promise.resolve(editingFile.currentData);
          }
          if (selectedFile === file && csvData) {
            return Promise.resolve(csvData);
          }
          return readCsvFile(file.fileHandle!);
        })
      );

      const primary = dataA.headers.length >= dataB.headers.length
        ? { entry: fileA, data: dataA }
        : { entry: fileB, data: dataB };

      const secondary = primary.entry === fileA
        ? { entry: fileB, data: dataB }
        : { entry: fileA, data: dataA };

      if (primary.data.headers.length === 0) {
        throw new Error(`Plik ${primary.entry.fileName} nie zawiera nagłówków.`);
      }

      const mainHeaders = primary.data.headers;
      const mainNormalized = mainHeaders.map(normalizeHeaderName);
      const secondaryHeaders = secondary.data.headers;
      const secondaryNormalized = secondaryHeaders.map(normalizeHeaderName);

      const mainLinkIndex = mainNormalized.indexOf('link');
      if (mainLinkIndex === -1) {
        throw new Error(`Plik ${primary.entry.fileName} nie zawiera kolumny "link".`);
      }

      const secondaryLinkIndex = secondaryNormalized.indexOf('link');
      if (secondaryLinkIndex === -1) {
        throw new Error(`Plik ${secondary.entry.fileName} nie zawiera kolumny "link".`);
      }

      const existingLinks = new Set(
        primary.data.rows
          .map(row => createYoutubeLinkKey(row[mainLinkIndex] ?? ''))
          .filter((value): value is string => Boolean(value))
      );

      const rowsToAdd: string[][] = [];

      for (const row of secondary.data.rows) {
        const linkKey = createYoutubeLinkKey(row[secondaryLinkIndex] ?? '');
        if (!linkKey) continue;

        if (existingLinks.has(linkKey)) continue;

        const newRow = new Array(mainHeaders.length).fill('');

  secondaryHeaders.forEach((_, columnIndex) => {
          const normalizedHeader = secondaryNormalized[columnIndex];
          if (!normalizedHeader) return;
          const mainIndex = mainNormalized.indexOf(normalizedHeader);
          if (mainIndex === -1) return;

          const cellValue = row[columnIndex];
          if (cellValue && cellValue.trim()) {
            const valueToInsert = normalizedHeader === 'link'
              ? cleanYoutubeLink(cellValue)
              : cellValue;
            newRow[mainIndex] = valueToInsert;
          }
        });

        rowsToAdd.push(newRow);
        existingLinks.add(linkKey);
      }

      if (rowsToAdd.length === 0) {
        setLinkMessage({
          text: `Brak nowych wierszy do dodania - wszystkie linki z pliku ${secondary.entry.fileName} już istnieją.`,
          tone: 'info'
        });
        return { added: 0, mainEntry: primary.entry };
      }

      const updatedRows = [...rowsToAdd, ...primary.data.rows];
      const updatedData: CsvData = { headers: mainHeaders, rows: updatedRows };

      await saveCsvFile(primary.entry.fileHandle!, updatedData);

      if (selectedFile === primary.entry || (editingFile && editingFile.entry === primary.entry)) {
        const clone: CsvData = JSON.parse(JSON.stringify(updatedData));
        if (selectedFile === primary.entry) {
          setCsvData(clone);
        }
        setEditingFile({
          entry: primary.entry,
          originalData: clone,
          currentData: clone,
          isModified: false
        });
      }

      const suffix = rowsToAdd.length === 1 ? '' : rowsToAdd.length < 5 ? 'e' : 'y';
      setLinkMessage({
        text: `Połączono pliki. Dodano ${rowsToAdd.length} wiersz${suffix} do pliku ${primary.entry.fileName}.`,
        tone: 'info'
      });

      return { added: rowsToAdd.length, mainEntry: primary.entry };
    } catch (error: any) {
      const message = error instanceof Error ? error.message : error?.message ?? 'Nie udało się połączyć plików.';
      setLinkMessage({ text: message, tone: 'error' });
      throw new Error(message);
    } finally {
      setIsMerging(false);
    }
  }

  async function saveFile() {
    if (!editingFile?.entry.fileHandle || !editingFile.isModified) return;
    
    setSavingCsv(true);
    try {
      await saveCsvFile(editingFile.entry.fileHandle, editingFile.currentData);
      setEditingFile({
        ...editingFile,
        originalData: JSON.parse(JSON.stringify(editingFile.currentData)),
        isModified: false
      });
      setError(null);
    } catch (e: any) {
      setError(`Błąd zapisu: ${e?.message ?? 'Nieznany błąd'}`);
    } finally {
      setSavingCsv(false);
    }
  }

  function cancelEdit() {
    if (!editingFile) return;
    
    setEditingFile({
      ...editingFile,
      currentData: JSON.parse(JSON.stringify(editingFile.originalData)),
      isModified: false
    });
    setCsvData(editingFile.originalData);
    setSelectedCells(new Set());
    setBulkEditValue('');
  }

  const total = rows.length;
  const distinctFolders = useMemo(
    () => new Set(rows.map(r => r.folderPath)).size,
    [rows]
  );

  return (
    <div className="container">
      <h1 className="app-title">Browser CSV</h1>

      <div className="actions">
        <button onClick={pickRootFolder}>Wybierz folder główny</button>
        <button onClick={() => rescan()} disabled={!rootDir || status==='loading'}>
          {status === 'loading' ? 'Skanuję…' : 'Odśwież'}
        </button>
        <label style={{display:'inline-flex', gap:8, alignItems:'center'}}>
          <input
            type="checkbox"
            checked={recursive}
            onChange={(e) => { setRecursive(e.target.checked); if (rootDir) rescan(rootDir, e.target.checked); }}
          />
          Skanuj rekurencyjnie
        </label>
        <button 
          onClick={() => setShowSearch(!showSearch)} 
          disabled={!rootDir || rows.length === 0}
          className={showSearch ? 'active' : ''}
        >
          {showSearch ? 'Ukryj wyszukiwanie' : 'Wyszukaj w tytułach'}
        </button>
        <button
          onClick={() => setShowMerge(prev => !prev)}
          disabled={!rootDir || rows.length < 2}
          className={showMerge ? 'active' : ''}
        >
          {showMerge ? 'Ukryj łączenie CSV' : 'Połącz CSV'}
        </button>
        <FileExistCheckButton
          onClick={handleCheckFileExistColumn}
          isChecking={checkingFileExist}
          disabled={!rootDir || !editingFile || checkingFileExist}
        >
          Sprawdź kolumnę fileExist
        </FileExistCheckButton>
        <button onClick={forgetFolder} disabled={!rootDir}>Zapomnij folder</button>
      </div>

      <div className="footer">
        {rootDir ? (
          <>
            <span className="badge">Foldery: {distinctFolders}</span>{' '}
            <span className="badge">Pliki CSV: {total}</span>{' '}
            {status === 'error' && <span style={{color:'crimson'}}>Błąd: {error}</span>}
          </>
        ) : (
          <em>Wybierz folder, aby rozpocząć.</em>
        )}
      </div>

      {/* Komponent wyszukiwania */}
      {showSearch && (
        <div className="search-container">
          <SearchComponent 
            csvFiles={rows} 
            onFileSelect={loadFile}
            onAddResult={handleSearchAdd}
          />
        </div>
      )}

      {showMerge && (
        <div className="merge-container">
          <MergeCsvComponent
            csvFiles={rows}
            onMerge={mergeCsvFiles}
            onClose={() => setShowMerge(false)}
            isMerging={isMerging}
          />
        </div>
      )}

      <div className="main-content">
        {/* Lewa kolumna - lista plików */}
        <div className="file-list">
          <h3>Pliki CSV</h3>
          {rows.length === 0 ? (
            <p><em>Brak plików CSV</em></p>
          ) : (
            <div className="file-items">
              {rows.map((entry, i) => (
                <div 
                  key={`${entry.folderPath}/${entry.fileName}-${i}`}
                  className={`file-item ${selectedFile === entry ? 'selected' : ''}`}
                  onClick={() => loadFile(entry)}
                >
                  <div className="file-name">{entry.fileName}</div>
                  <div className="file-path">{entry.folderPath}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prawa kolumna - edytor CSV */}
        <div className="csv-viewer">
          <div className="csv-header">
            <h3>Edytor CSV</h3>
            {editingFile && (
              <div className="edit-controls">
                <button 
                  onClick={saveFile} 
                  disabled={!editingFile.isModified || savingCsv}
                  className="save-btn"
                >
                  {savingCsv ? 'Zapisywanie...' : 'Zapisz'}
                </button>
                <button 
                  onClick={cancelEdit} 
                  disabled={!editingFile.isModified}
                  className="cancel-btn"
                >
                  Anuluj
                </button>
                {editingFile.isModified && <span className="modified-indicator">●</span>}
              </div>
            )}
          </div>

          <div className="link-collector">
            <div className="link-collector-header">
              <strong>Zebrane linki YouTube</strong>
              <div className="link-counters">
                <span>Linki: {collectedLinks.length}</span>
                <span>Pliki TXT: {collectedFiles.length}</span>
              </div>
              {linkMessage && (
                <span className={`link-message ${linkMessage.tone === 'error' ? 'error' : ''}`}>
                  {linkMessage.text}
                </span>
              )}
            </div>
            <textarea
              value={collectedLinksJoined}
              placeholder="Tutaj pojawią się zapisane linki YouTube oddzielone średnikami"
              readOnly
              onFocus={(e) => e.target.select()}
            />
            <div className="link-actions">
              <button
                type="button"
                onClick={copyCollectedLinks}
                disabled={collectedLinks.length === 0}
              >
                Kopiuj
              </button>
              <button
                type="button"
                onClick={handleCopyFiles}
                disabled={collectedFiles.length === 0 || !rootDir || copyingFiles}
              >
                {copyingFiles ? 'Kopiuję…' : 'Kopiuj pliki'}
              </button>
              <button
                type="button"
                onClick={resetCollectedLinks}
                className="reset"
                disabled={collectedLinks.length === 0 && collectedFiles.length === 0}
              >
                Reset
              </button>
            </div>
          </div>

          {!selectedFile ? (
            <p><em>Wybierz plik z lewej strony</em></p>
          ) : loadingCsv ? (
            <p>Ładowanie...</p>
          ) : !csvData ? (
            <p style={{color: 'red'}}>Błąd ładowania pliku</p>
          ) : (
            <div className="csv-content">
              <div className="csv-info">
                <strong>{selectedFile.fileName}</strong> 
                <span> • {csvData.rows.length} wierszy • {csvData.headers.length} kolumn</span>
                {selectedCells.size > 0 && (
                  <span> • {selectedCells.size} zaznaczonych komórek</span>
                )}
              </div>

              {/* Bulk edit controls */}
              {selectedCells.size > 0 && (
                <div className="bulk-edit">
                  <input
                    type="text"
                    placeholder="Wpisz wartość dla wszystkich zaznaczonych komórek"
                    value={bulkEditValue}
                    onChange={(e) => setBulkEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBulkEdit()}
                  />
                  <button onClick={handleBulkEdit} disabled={!bulkEditValue.trim()}>
                    Zastosuj do {selectedCells.size} komórek
                  </button>
                </div>
              )}

              <div className="table-container">
                <table className="csv-table">
                  <thead>
                    <tr>
                      {csvData.headers.map((header, i) => (
                        <th key={i}>{header}</th>
                      ))}
                      <th className="actions-column">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => {
                          const cellKey = getCellKey(i, j);
                          const isSelected = selectedCells.has(cellKey);
                          return (
                            <td 
                              key={j}
                              className={isSelected ? 'selected-cell' : ''}
                              onClick={(e) => handleCellClick(i, j, e)}
                            >
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleCellChange(i, j, e.target.value)}
                                className="cell-input"
                                onFocus={(e) => e.target.select()}
                              />
                            </td>
                          );
                        })}
                          <td className="actions-cell">
                            <button
                              type="button"
                              className="add-btn"
                              onClick={() => handleRowAdd(i)}
                            >
                              Add
                            </button>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}