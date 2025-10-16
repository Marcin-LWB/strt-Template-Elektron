import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import defaultPaths from '../config/defaultPaths.json';
import './FileExistChecker.css';

// Helper functions
const normalizeFileNumber = (value: string): string => value.trim().toUpperCase();

const sanitizeSegment = (segment: string): string => {
  return segment
    ? segment.replace(/[<>:"/\\|?*]+/g, '_').trim().slice(0, 255) || '_'
    : '_';
};

const sanitizeFileName = (name: string): string => {
  if (!name) return 'plik.pdf';
  const sanitized = name.replace(/[<>:"/\\|?*]+/g, '_').trim();
  return sanitized || 'plik.pdf';
};

const buildFolderSegments = (folderValue: string | undefined): string[] => {
  if (!folderValue) return [];
  const segments = String(folderValue)
    .split(/[\\/]+/)
    .map(s => s.trim())
    .filter(Boolean);
  return segments.map(s => sanitizeSegment(s));
};

/**
 * Komponent do sprawdzania istnienia plików PDF na podstawie FILE NUMBER (tylko P001)
 * oraz kopiowania znalezionych plików z zachowaniem struktury folderów
 */
export default function FileExistChecker({ mode = 'all' }: { mode?: 'check' | 'copy' | 'all' }) {
  const {
    loadedData,
    updateLoadedData,
    pdfSourceFolder,
    setPdfSourceFolder,
    pdfSourceHandle,
    setPdfSourceHandle,
    pdfDestinationFolder,
    setPdfDestinationFolder,
    pdfDestinationHandle,
    setPdfDestinationHandle,
  } = useAppStore();
  const [checking, setChecking] = useState(false);
  const [copying, setCopying] = useState(false);
  const [status, setStatus] = useState<string>('');
  
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const hasFileSystemAccess = 'showDirectoryPicker' in window;
  const checkFolder = pdfSourceFolder;
  const setCheckFolder = setPdfSourceFolder;
  const destination = pdfDestinationFolder;
  const setDestination = setPdfDestinationFolder;
  const dirHandle = pdfSourceHandle;
  const setDirHandle = setPdfSourceHandle;
  const destDirHandle = pdfDestinationHandle;
  const setDestDirHandle = setPdfDestinationHandle;

  // Funkcja ładowania domyślnej ścieżki źródłowej
  const loadDefaultPdfSource = () => {
    if (isElectron && defaultPaths.pdfSourcePath) {
      setCheckFolder(defaultPaths.pdfSourcePath);
      setStatus(`✅ Załadowano domyślną ścieżkę źródłową`);
    }
  };

  // Funkcja ładowania domyślnej ścieżki docelowej
  const loadDefaultPdfDestination = () => {
    if (isElectron && defaultPaths.pdfDestinationPath) {
      setDestination(defaultPaths.pdfDestinationPath);
      setStatus(`✅ Załadowano domyślną ścieżkę docelową`);
    }
  };

  // Wybór folderu do sprawdzenia
  const handleSelectCheckFolder = async () => {
    if (isElectron) {
      // Electron mode - używamy selectXlsxDirectory (tymczasowo)
      try {
        const dir = await window.electronAPI.selectXlsxDirectory();
        if (dir) {
          setCheckFolder(dir);
          setStatus(`✅ Folder źródłowy: ${dir}`);
          console.log('Electron source folder selected:', dir);
        }
      } catch (err: any) {
        setStatus(`Błąd: ${err.message}`);
      }
    } else if (hasFileSystemAccess) {
      // Browser mode
      try {
        const handle = await (window as any).showDirectoryPicker();
        setDirHandle(handle);
        setCheckFolder(handle.name);
        setStatus(`✅ Folder źródłowy: ${handle.name}`);
        console.log('Browser source folder handle:', handle);
        console.log('dirHandle state updated:', handle.name);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setStatus(`Błąd: ${err.message}`);
        }
      }
    } else {
      setStatus('Twoja przeglądarka nie obsługuje File System Access API');
    }
  };

  // Wybór folderu docelowego (do kopiowania)
  const handleSelectDestinationFolder = async () => {
    if (isElectron) {
      try {
        const dir = await window.electronAPI.selectXlsxDirectory({ title: 'Wybierz folder docelowy dla kopii PDF' });
        if (dir) {
          setDestination(dir);
          setStatus(`✅ Folder docelowy: ${dir}`);
        }
      } catch (err: any) {
        setStatus(`Błąd wyboru folderu: ${err.message}`);
      }
    } else if (hasFileSystemAccess) {
      try {
        // Poproś o uprawnienia do zapisu od razu podczas wyboru
        const handle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'documents'
        });

        // Sprawdź czy mamy uprawnienia do zapisu
        try {
          // @ts-ignore - TypeScript nie zna jeszcze tych metod
          const permission = await handle.queryPermission({ mode: 'readwrite' });
          if (permission !== 'granted') {
            // @ts-ignore
            const requestResult = await handle.requestPermission({ mode: 'readwrite' });
            if (requestResult !== 'granted') {
              setStatus('❌ Brak uprawnień do zapisu w wybranym folderze. Wybierz inny folder lub zezwól na zapis.');
              return;
            }
          }
        } catch (permErr: any) {
          // Jeśli queryPermission/requestPermission nie są dostępne, spróbuj testowej operacji
          console.warn('Permission API not available, trying test operation');
        }

        // Testowa operacja - spróbuj utworzyć tymczasowy plik aby sprawdzić uprawnienia
        try {
          const testHandle = await handle.getFileHandle('test_permissions.tmp', { create: true });
          const testWritable = await testHandle.createWritable();
          await testWritable.write(new Uint8Array([1])); // Zapisz 1 bajt
          await testWritable.close();

          // Usuń testowy plik
          await handle.removeEntry('test_permissions.tmp');
        } catch (testErr: any) {
          console.error('Permission test failed:', testErr);
          setStatus('❌ Brak uprawnień do zapisu w wybranym folderze. Wybierz folder, w którym możesz zapisywać pliki.');
          return;
        }

        setDestDirHandle(handle);
        setDestination(handle.name);
        setStatus(`✅ Folder docelowy (z uprawnieniami do zapisu): ${handle.name}`);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setStatus(`❌ Błąd wyboru folderu: ${err.message}`);
        }
      }
    }
  };

  // Kopiowanie plików PDF
  const handleCopyFiles = async () => {
    if (!loadedData) {
      setStatus('⚠️ Najpierw załaduj dane Excel i sprawdź pliki');
      return;
    }

    // Walidacja w trybie przeglądarki
    if (!isElectron) {
      if (!dirHandle) {
        setStatus('⚠️ Najpierw wybierz folder źródłowy PDF (📁 Folder źródłowy PDF)');
        return;
      }
      if (!destDirHandle) {
        setStatus('⚠️ Wybierz folder docelowy (📦 Folder docelowy)');
        return;
      }
    }

    // Walidacja w trybie Electron
    if (isElectron) {
      if (!checkFolder) {
        setStatus('⚠️ Najpierw wybierz folder źródłowy PDF');
        return;
      }
      if (!destination) {
        setStatus('⚠️ Wybierz folder docelowy');
        return;
      }
    }

    const fileNumberKey = loadedData.headers.find(h =>
      h.toLowerCase().includes('file') && h.toLowerCase().includes('number')
    );
    const folderKey = loadedData.headers.find(h => h === 'Folder');
    const finalFileNameKey = loadedData.headers.find(h => h === 'Final File Name');

    if (!fileNumberKey || !folderKey) {
      setStatus('⚠️ Brak wymaganych kolumn (FILE NUMBER, Folder)');
      return;
    }

    setCopying(true);
    setStatus('📦 Kopiuję pliki PDF...');

    try {
      const tasks: Array<{ rowIndex: number; fileNumber: string; folderPath: string[]; finalFileName?: string }> = [];

      // Tylko wiersze z FILE NUMBER zaczynającym się od "P00" i Exist=TAK
      loadedData.rows.forEach((row, index) => {
        const fileNumber = String(row.columns[fileNumberKey] || '').trim();
        const existValue = String(row.columns['Exist'] || '');
        const folderValue = row.columns[folderKey];
        const finalFileName = finalFileNameKey ? String(row.columns[finalFileNameKey] || '').trim() : '';

        console.log(`Row ${index}: FILE NUMBER=${fileNumber}, Exist=${existValue}, Final=${finalFileName}, Folder=${folderValue}`);

        if (
          normalizeFileNumber(fileNumber).startsWith('P00') &&
          existValue.includes('✅')
        ) {
          const folderSegments = buildFolderSegments(String(folderValue || ''));
          console.log(`  Folder segments:`, folderSegments);
          tasks.push({ 
            rowIndex: index + 1, 
            fileNumber, 
            folderPath: folderSegments,
            finalFileName: finalFileName || undefined
          });
          console.log(`  ✓ Added to copy tasks: ${finalFileName || fileNumber}`);
        }
      });

      console.log(`Total tasks to copy: ${tasks.length}`);
      console.log('Copy mode check:');
      console.log('  isElectron:', isElectron);
      console.log('  destination:', destination);
      console.log('  checkFolder:', checkFolder);
      console.log('  dirHandle:', dirHandle);
      console.log('  destDirHandle:', destDirHandle);
      
      if (tasks.length === 0) {
        setStatus('⚠️ Brak plików do skopiowania (P00* + Exist=TAK)');
        setCopying(false);
        return;
      }

      console.log('Checking Electron mode:', isElectron && destination && checkFolder);
      if (isElectron && destination && checkFolder) {
        console.log('✓ Entering Electron copy mode');
        // Electron mode - scan for PDFs first
        const scanResult = await window.electronAPI.scanPdfFiles(checkFolder, true);
        if (!scanResult.success) {
          throw new Error(scanResult.error || 'Nie udało się zeskanować plików PDF');
        }

        const pdfMap = new Map<string, string>();
        for (const file of scanResult.files) {
          const nameWithoutExt = file.fileName.substring(0, file.fileName.lastIndexOf('.'));
          pdfMap.set(normalizeFileNumber(nameWithoutExt), file.filePath);
        }
        console.log(`PDF Map created with ${pdfMap.size} files`);
        console.log('Sample PDF mappings:', Array.from(pdfMap.entries()).slice(0, 5));

        const copyTasks = tasks.map(task => {
          const normalizedFileNumber = normalizeFileNumber(task.fileNumber);
          const sourcePath = pdfMap.get(normalizedFileNumber);
          console.log(`Looking for: "${normalizedFileNumber}" in pdfMap`);
          
          if (!sourcePath) {
            console.error(`File not found: ${task.fileNumber} (normalized: ${normalizedFileNumber})`);
            console.error('Available keys sample:', Array.from(pdfMap.keys()).slice(0, 10));
            throw new Error(`Nie znaleziono pliku dla: ${task.fileNumber}`);
          }
          
          // Użyj nazwy z kolumny 'Final File Name' jeśli istnieje, inaczej fallback
          const targetFileName = task.finalFileName 
            ? sanitizeFileName(`${task.finalFileName}.pdf`)
            : sanitizeFileName(`${task.rowIndex.toString().padStart(4, '0')}_${task.fileNumber}.pdf`);
          
          console.log(`Copy task: ${task.fileNumber}`);
          console.log(`  Source: ${sourcePath}`);
          console.log(`  Target: ${targetFileName}`);
          console.log(`  Folder: ${task.folderPath.join('/')}`);
          
          return {
            sourcePath,
            relativeFolder: task.folderPath,
            targetFileName,
          };
        });

        console.log(`Starting copy operation with ${copyTasks.length} tasks to ${destination}`);
        
        const result = await window.electronAPI.copyPdfFiles({
          destinationRoot: destination,
          tasks: copyTasks,
        });

        console.log('Copy result:', result);
        
        if (result.success) {
          setStatus(`✅ Skopiowano ${result.copied} plików PDF`);
        } else {
          console.error('Copy errors:', result.errors);
          setStatus(`⚠️ Skopiowano ${result.copied} plików, ${result.errors.length} błędów`);
        }
      } else if (dirHandle && destDirHandle) {
        console.log('✓ Entering Browser copy mode');
        // Browser mode - scan and copy
        const pdfMap = new Map<string, FileSystemFileHandle>();
        await scanDirForPdfs(dirHandle, pdfMap);
        console.log(`Browser PDF Map created with ${pdfMap.size} files`);
        console.log('Sample PDF mappings:', Array.from(pdfMap.keys()).slice(0, 5));

        let copied = 0;
        let errors = 0;

        for (const task of tasks) {
          const normalizedFileNumber = normalizeFileNumber(task.fileNumber);
          const handle = pdfMap.get(normalizedFileNumber);
          console.log(`Processing: "${normalizedFileNumber}"`);
          
          if (!handle) {
            console.warn(`File handle not found for: ${task.fileNumber} (normalized: ${normalizedFileNumber})`);
            console.warn('Available keys sample:', Array.from(pdfMap.keys()).slice(0, 10));
            errors++;
            continue;
          }

          try {
            const file = await handle.getFile();
            
            // Użyj nazwy z kolumny 'Final File Name' jeśli istnieje, inaczej fallback
            const targetFileName = task.finalFileName 
              ? sanitizeFileName(`${task.finalFileName}.pdf`)
              : sanitizeFileName(`${task.rowIndex.toString().padStart(4, '0')}_${task.fileNumber}.pdf`);
            
            console.log(`Copying file:`);
            console.log(`  Source: ${file.name}`);
            console.log(`  Target: ${targetFileName}`);
            console.log(`  Folder path:`, task.folderPath);

            // Sprawdź rozmiar pliku - ostrzeżenie dla dużych plików (>50MB)
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > 50) {
              console.warn(`Duży plik: ${targetFileName} (${fileSizeMB.toFixed(1)}MB)`);
            }

            // Sprawdź długość nazwy pliku (limit systemu plików ~255 znaków)
            if (targetFileName.length > 250) {
              throw new Error(`Nazwa pliku jest zbyt długa (${targetFileName.length} znaków): ${targetFileName.substring(0, 50)}...`);
            }

            // Create folder structure
            let currentDir = destDirHandle;
            for (const segment of task.folderPath) {
              try {
                currentDir = await currentDir.getDirectoryHandle(segment, { create: true });
              } catch (err: any) {
                console.error(`Error creating folder ${segment}:`, err);
                throw new Error(`Nie można utworzyć folderu ${segment}: ${err.message}`);
              }
            }

            // Copy file - użyj strumieni dla dużych plików (>10MB)
            const fileHandle = await currentDir.getFileHandle(targetFileName, { create: true });
            const writable = await fileHandle.createWritable();

            if (file.size > 10 * 1024 * 1024) { // >10MB - użyj strumieni
              console.log(`Strumieniowe kopiowanie dużego pliku: ${targetFileName} (${fileSizeMB.toFixed(1)}MB)`);
              const reader = file.stream().getReader();
              const writer = writable.getWriter();

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  await writer.write(value);
                }
              } finally {
                reader.releaseLock();
                writer.releaseLock();
              }
            } else {
              // Mały plik - kopiuj tradycyjnie
              await writable.write(await file.arrayBuffer());
            }

            await writable.close();
            copied++;
            console.log(`✓ Successfully copied: ${targetFileName}`);
          } catch (err: any) {
            console.error(`Error copying ${task.fileNumber}:`, err);
            errors++;
            // Kontynuuj kopiowanie innych plików zamiast przerywać cały proces
            setStatus(`⚠️ Błąd kopiowania ${task.fileNumber}: ${err.message}`);
            // Krótkie opóźnienie aby użytkownik mógł zobaczyć komunikat o błędzie
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (errors === 0) {
          setStatus(`✅ Skopiowano ${copied}/${tasks.length} plików PDF`);
        } else {
          setStatus(`⚠️ Skopiowano ${copied}/${tasks.length} plików PDF, ${errors} błędów`);
        }
      } else {
        console.error('❌ No valid copy mode!');
        console.error('  isElectron:', isElectron);
        console.error('  checkFolder:', checkFolder);
        console.error('  destination:', destination);
        console.error('  dirHandle:', dirHandle);
        console.error('  destDirHandle:', destDirHandle);
        
        if (!isElectron && !dirHandle) {
          setStatus('❌ Najpierw wybierz folder źródłowy PDF (📁 Folder źródłowy PDF)');
        } else if (!isElectron && !destDirHandle) {
          setStatus('❌ Wybierz folder docelowy (📦 Folder docelowy)');
        } else if (isElectron && !checkFolder) {
          setStatus('❌ Najpierw wybierz folder źródłowy PDF');
        } else if (isElectron && !destination) {
          setStatus('❌ Wybierz folder docelowy');
        } else {
          setStatus('❌ Błąd: Nie wybrano prawidłowego trybu kopiowania. Sprawdź folder źródłowy i docelowy.');
        }
        
        setCopying(false);
        return;
      }
    } catch (err: any) {
      setStatus(`❌ Błąd kopiowania: ${err.message}`);
      console.error('Copy error:', err);
    } finally {
      setCopying(false);
    }
  };

  // Helper dla browser mode - rekurencyjne skanowanie PDF
  async function scanDirForPdfs(
    dir: FileSystemDirectoryHandle,
    resultMap: Map<string, FileSystemFileHandle>
  ) {
    try {
      // @ts-ignore
      for await (const [name, handle] of dir.entries()) {
        if (handle.kind === 'file' && 
            name.toLowerCase().endsWith('.pdf') && 
            !name.includes('.crswap') && // Wyklucz pliki tymczasowe Chrome
            !name.startsWith('~$') && // Wyklucz pliki tymczasowe Office
            !name.endsWith('.tmp') && // Wyklucz pliki tymczasowe
            !name.endsWith('.temp')) { // Wyklucz pliki tymczasowe
          const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
          resultMap.set(normalizeFileNumber(nameWithoutExt), handle);
        } else if (handle.kind === 'directory') {
          try {
            await scanDirForPdfs(handle as FileSystemDirectoryHandle, resultMap);
          } catch (err: any) {
            // Skip directories we can't access
            console.warn(`Cannot access directory ${name}:`, err.message);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.message.includes('permission')) {
        throw new Error('Brak uprawnień do odczytu folderu źródłowego. Wybierz ponownie folder źródłowy.');
      }
      console.warn('Error scanning directory:', err);
    }
  }

  // Główna funkcja sprawdzania - TYLKO P00*
  const handleCheckFiles = async () => {
    console.log('=== handleCheckFiles called ===');
    console.log('  loadedData:', !!loadedData);
    console.log('  checkFolder:', checkFolder);
    console.log('  dirHandle:', dirHandle);
    console.log('  isElectron:', isElectron);
    
    if (!loadedData) {
      setStatus('⚠️ Najpierw załaduj dane Excel');
      return;
    }

    if (!checkFolder && !dirHandle) {
      console.error('❌ No source folder selected!');
      setStatus('⚠️ Wybierz folder do sprawdzenia');
      return;
    }

    setChecking(true);
    setStatus('🔍 Sprawdzam pliki (tylko P001)...');

    try {
      // Znajdź kolumnę FILE NUMBER
      const fileNumberKey = loadedData.headers.find(h => 
        h.toLowerCase().includes('file') && h.toLowerCase().includes('number')
      );

      if (!fileNumberKey) {
        setStatus('⚠️ Nie znaleziono kolumny FILE NUMBER');
        setChecking(false);
        return;
      }

      // Wyciągnij tylko FILE NUMBER zaczynające się od P00
      const filteredData = loadedData.rows
        .map((row, index) => ({
          index,
          fileNumber: String(row.columns[fileNumberKey] || '').trim(),
        }))
        .filter(item => normalizeFileNumber(item.fileNumber).startsWith('P00'));

      if (filteredData.length === 0) {
        setStatus('⚠️ Brak FILE NUMBER zaczynających się od P00');
        setChecking(false);
        return;
      }

      const fileNumbers = filteredData.map(item => item.fileNumber);

      // Sprawdź istnienie plików
      let existMap: Map<string, { exists: boolean; sourcePath?: string }>;
      
      if (isElectron && checkFolder) {
        existMap = await checkFilesExistElectron(checkFolder, fileNumbers);
      } else if (dirHandle) {
        existMap = await checkFilesExistBrowser(dirHandle, fileNumbers);
      } else {
        setStatus('⚠️ Błąd konfiguracji');
        setChecking(false);
        return;
      }

      // Dodaj kolumnę "Exist" tylko dla P00
      const updatedRows = loadedData.rows.map((row) => {
        const fileNumber = String(row.columns[fileNumberKey] || '').trim();
        
        if (normalizeFileNumber(fileNumber).startsWith('P00')) {
          const info = existMap.get(fileNumber);
          const exists = info?.exists || false;
          return {
            ...row,
            columns: {
              ...row.columns,
              'Exist': exists ? '✅ TAK' : '❌ NIE',
            },
          };
        } else {
          return {
            ...row,
            columns: {
              ...row.columns,
              'Exist': '',
            },
          };
        }
      });

      // Dodaj nagłówek "Exist" jeśli jeszcze nie istnieje
      const updatedHeaders = loadedData.headers.includes('Exist')
        ? loadedData.headers
        : [...loadedData.headers, 'Exist'];

      const updatedData = {
        ...loadedData,
        headers: updatedHeaders,
        rows: updatedRows,
      };

      updateLoadedData(updatedData);

      const foundCount = Array.from(existMap.values()).filter(v => v.exists).length;
      setStatus(`✅ Sprawdzono ${fileNumbers.length} plików P00*. Znaleziono: ${foundCount}`);
      
    } catch (err: any) {
      setStatus(`❌ Błąd: ${err.message}`);
    } finally {
      setChecking(false);
    }
  };

  // Sprawdź istnienie plików - Browser mode
  const checkFilesExistBrowser = async (
    dirHandle: FileSystemDirectoryHandle,
    fileNumbers: string[]
  ): Promise<Map<string, { exists: boolean; sourcePath?: string }>> => {
    const results = new Map<string, { exists: boolean; sourcePath?: string }>();
    const filesInDir = new Map<string, FileSystemFileHandle>();

    // Rekurencyjnie zbierz wszystkie pliki PDF
    async function scanDir(currentDir: FileSystemDirectoryHandle) {
      try {
        // @ts-ignore
        for await (const [name, handle] of currentDir.entries()) {
          if (handle.kind === 'file' && 
              name.toLowerCase().endsWith('.pdf') && 
              !name.includes('.crswap') && // Wyklucz pliki tymczasowe Chrome
              !name.startsWith('~$') && // Wyklucz pliki tymczasowe Office
              !name.endsWith('.tmp') && // Wyklucz pliki tymczasowe
              !name.endsWith('.temp')) { // Wyklucz pliki tymczasowe
            const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
            filesInDir.set(normalizeFileNumber(nameWithoutExt), handle);
          } else if (handle.kind === 'directory') {
            await scanDir(handle as FileSystemDirectoryHandle);
          }
        }
      } catch (err) {
        console.warn('Error scanning directory:', err);
      }
    }

    await scanDir(dirHandle);

    // Sprawdź każdy FILE NUMBER
    for (const fileNumber of fileNumbers) {
      const normalized = normalizeFileNumber(fileNumber);
      const handle = filesInDir.get(normalized);
      results.set(fileNumber, { 
        exists: !!handle,
        sourcePath: handle ? handle.name : undefined
      });
    }

    return results;
  };

  // Sprawdź istnienie plików - Electron mode
  const checkFilesExistElectron = async (
    folderPath: string,
    fileNumbers: string[]
  ): Promise<Map<string, { exists: boolean; sourcePath?: string }>> => {
    const results = new Map<string, { exists: boolean; sourcePath?: string }>();
    
    try {
      const scanResult = await window.electronAPI.scanPdfFiles(folderPath, true);
      
      if (!scanResult.success) {
        throw new Error(scanResult.error || 'Scan failed');
      }

      const pdfMap = new Map<string, string>();
      for (const file of scanResult.files) {
        const nameWithoutExt = file.fileName.substring(0, file.fileName.lastIndexOf('.'));
        pdfMap.set(normalizeFileNumber(nameWithoutExt), file.filePath);
      }

      for (const fileNumber of fileNumbers) {
        const normalized = normalizeFileNumber(fileNumber);
        const sourcePath = pdfMap.get(normalized);
        results.set(fileNumber, {
          exists: !!sourcePath,
          sourcePath,
        });
      }
    } catch (err) {
      console.error('Error scanning in Electron:', err);
      for (const fileNumber of fileNumbers) {
        results.set(fileNumber, { exists: false });
      }
    }

    return results;
  };

  return (
    <div className="file-exist-checker">
      <div className="checker-actions">
        {(mode === 'check' || mode === 'all') && (
          <>
            <div className="action-group">
              <button 
                onClick={handleSelectCheckFolder}
                className="btn-secondary"
                disabled={checking || copying}
              >
                📁 Folder źródłowy PDF
              </button>
              {isElectron && (
                <button
                  onClick={loadDefaultPdfSource}
                  className="btn-link"
                  disabled={checking || copying}
                  title="Załaduj domyślną ścieżkę źródłową"
                >
                  ⚡ Domyślna
                </button>
              )}
            </div>

            <button 
              onClick={handleCheckFiles}
              className="btn-primary"
              disabled={(!checkFolder && !dirHandle) || checking || copying || !loadedData}
            >
              {checking ? '⏳ Sprawdzam...' : '✓ Sprawdź pliki P00*'}
            </button>
          </>
        )}

        {(mode === 'copy' || mode === 'all') && (
          <>
            {mode === 'copy' && (
              <div className="action-group">
                <button
                  onClick={handleSelectCheckFolder}
                  className="btn-secondary"
                  disabled={checking || copying}
                >
                  📁 Folder źródłowy PDF
                </button>
                {isElectron && (
                  <button
                    onClick={loadDefaultPdfSource}
                    className="btn-link"
                    disabled={checking || copying}
                    title="Załaduj domyślną ścieżkę źródłową"
                  >
                    ⚡ Domyślna
                  </button>
                )}
              </div>
            )}

            <div className="action-group">
              <button
                onClick={handleSelectDestinationFolder}
                className="btn-secondary"
                disabled={checking || copying}
              >
                📦 Folder docelowy
              </button>
              {isElectron && (
                <button
                  onClick={loadDefaultPdfDestination}
                  className="btn-link"
                  disabled={checking || copying}
                  title="Załaduj domyślną ścieżkę docelową"
                >
                  ⚡ Domyślna
                </button>
              )}
            </div>

            <button
              onClick={handleCopyFiles}
              className="btn-primary"
              disabled={(!destination && !destDirHandle) || checking || copying || !loadedData}
            >
              {copying ? '⏳ Kopiuję...' : '💾 Kopiuj znalezione'}
            </button>
          </>
        )}
      </div>

      <div className="checker-info-panels">
        {checkFolder && (
          <div className="checker-info">
            <strong>Folder źródłowy:</strong> <code>{checkFolder}</code>
          </div>
        )}

        {(mode === 'copy' || mode === 'all') && destination && (
          <div className="checker-info">
            <strong>Folder docelowy:</strong> <code>{destination}</code>
          </div>
        )}
      </div>

      {status && (
        <div className={`checker-status ${status.includes('✅') ? 'success' : status.includes('⚠️') || status.includes('❌') ? 'error' : 'info'}`}>
          {status}
        </div>
      )}

      {mode === 'all' && (
        <div className="checker-help">
          <small>
            💡 <strong>P00* Filter:</strong> Sprawdzane są tylko pliki z FILE NUMBER zaczynającym się od "P00" (P001xxxxx, P002xxxxx, itd.).<br/>
            📋 <strong>Kopiowanie:</strong> Pliki kopiowane są z zachowaniem struktury folderów (kolumna Folder) i nazwą z kolumny "Final File Name" (lub [numer_wiersza]_[FILE_NUMBER] jeśli brak).<br/>
            ⚡ <strong>Optymalizacja:</strong> Duże pliki (&gt;10MB) kopiowane są strumieniowo dla lepszej wydajności
          </small>
        </div>
      )}
    </div>
  );
}
