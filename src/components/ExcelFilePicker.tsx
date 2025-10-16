import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import './ExcelFilePicker.css';

/**
 * Komponent do wyboru i zarządzania plikami Excel
 * Uproszczony szablon - podstawowy wybór plików
 */
interface ExcelFilePickerProps {
  onClose?: () => void;
}

export default function ExcelFilePicker({ onClose }: ExcelFilePickerProps) {
  const {
    workspaceDir,
    setWorkspaceDir,
    excelFiles,
    setExcelFiles,
    toggleFileSelection,
    selectAllFiles,
    deselectAllFiles,
    loading,
    setLoading,
    error,
    setError,
  } = useAppStore();

  const [recursive, setRecursive] = useState(false);
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // Wybierz folder - hybrydowy tryb
  const handleSelectFolder = async () => {
    if (isElectron) {
      // Electron mode
      try {
        const dir = await window.electronAPI.selectXlsxDirectory();
        if (dir) {
          setWorkspaceDir(dir);
          setError(null);
          // Automatycznie skanuj po wyborze
          await handleScanFiles(dir);
        }
      } catch (err: any) {
        setError(`Błąd wyboru folderu: ${err.message}`);
        window.electronAPI?.logError('Error selecting folder', err);
      }
    } else if (hasFileSystemAccess) {
      // Browser mode - File System Access API
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        setDirHandle(dirHandle);
        setWorkspaceDir(dirHandle.name);
        setError(null);
        await saveRootDirHandle(dirHandle);
        await handleScanFilesBrowser(dirHandle);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(`Błąd wyboru folderu: ${err.message}`);
          console.error('Error selecting folder in browser:', err);
        }
      }
    } else {
      setError('Twoja przeglądarka nie obsługuje File System Access API. Użyj Chrome/Edge lub uruchom aplikację w Electron.');
    }
  };

  // Skanuj pliki - Electron mode
  const handleScanFiles = async (dir = workspaceDir) => {
    if (!dir || !isElectron) return;

    setScanStatus('scanning');
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.scanXlsxFiles(dir, recursive);
      
      if (result.success) {
        setExcelFiles(result.files);
        window.electronAPI.logInfo(`Found ${result.files.length} Excel files`);
      } else {
        setError(result.error || 'Błąd skanowania plików');
      }
    } catch (err: any) {
      setError(`Błąd skanowania: ${err.message}`);
      window.electronAPI?.logError('Error scanning files', err);
    } finally {
      setScanStatus('idle');
      setLoading(false);
    }
  };

  // Skanuj pliki - Browser mode
  const handleScanFilesBrowser = async (dirHandle: FileSystemDirectoryHandle) => {
    setScanStatus('scanning');
    setLoading(true);
    setError(null);

    try {
      const files = await scanDirectoryForExcel(dirHandle, recursive);
      // WAŻNE: Zachowaj dirHandle dla każdego pliku - potrzebne do ładowania
      const filesWithHandle = files.map(f => ({ ...f, dirHandle }));
      setExcelFiles(filesWithHandle);
      console.log(`Found ${files.length} Excel files in browser`);
    } catch (err: any) {
      setError(`Błąd skanowania: ${err.message}`);
      console.error('Error scanning files in browser:', err);
    } finally {
      setScanStatus('idle');
      setLoading(false);
    }
  };

  // Statystyki
  const selectedCount = excelFiles.filter(f => f.selected).length;
  const totalCount = excelFiles.length;

  return (
    <div className="excel-file-picker">
      <div className="picker-actions" style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleSelectFolder} 
          className="btn-primary"
          disabled={loading}
        >
          📂 Wybierz folder
        </button>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={recursive}
            onChange={(e) => {
              setRecursive(e.target.checked);
              if (workspaceDir) handleScanFiles(workspaceDir);
            }}
            disabled={loading}
          />
          Skanuj podkatalogi
        </label>
        
        <button 
          onClick={() => {
            if (isElectron) {
              handleScanFiles();
            } else if (dirHandle) {
              handleScanFilesBrowser(dirHandle);
            }
          }} 
          disabled={(!workspaceDir && !dirHandle) || loading}
          className="btn-secondary"
        >
          {scanStatus === 'scanning' ? '⏳ Skanuję...' : '🔄 Odśwież'}
        </button>
        
        {onClose && totalCount > 0 && (
          <button 
            onClick={onClose}
            className="btn-primary"
          >
            ✓ Gotowe ({selectedCount} zaznaczonych)
          </button>
        )}
      </div>

      {workspaceDir && (
        <div className="workspace-info">
          <strong>Folder roboczy:</strong> <code>{workspaceDir}</code>
        </div>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="files-summary">
        <span className="badge">Wszystkich plików: {totalCount}</span>
        <span className="badge badge-selected">Zaznaczonych: {selectedCount}</span>
        
        {totalCount > 0 && (
          <div className="bulk-actions">
            <button onClick={selectAllFiles} className="btn-link">
              ☑️ Zaznacz wszystkie
            </button>
            <button onClick={deselectAllFiles} className="btn-link">
              ☐ Odznacz wszystkie
            </button>
          </div>
        )}
      </div>

      {totalCount === 0 && workspaceDir ? (
        <div className="empty-state">
          <p>🔍 Nie znaleziono plików Excel (.xlsx) w wybranym folderze.</p>
          {!recursive && <p><em>Spróbuj włączyć skanowanie podkatalogów.</em></p>}
        </div>
      ) : (
        <div className="file-list-container">
          {excelFiles.map((file, index) => (
            <div 
              key={`${file.filePath}-${index}`} 
              className={`file-item ${file.selected ? 'selected' : ''}`}
            >
              <label className="file-checkbox">
                <input
                  type="checkbox"
                  checked={file.selected}
                  onChange={() => toggleFileSelection(file.filePath)}
                />
                <div className="file-info">
                  <div className="file-name">📄 {file.fileName}</div>
                  <div className="file-path">{file.folderPath}</div>
                  {file.lastModified && (
                    <div className="file-meta">
                      Zmodyfikowano: {new Date(file.lastModified).toLocaleString('pl-PL')}
                    </div>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>
      )}

      {!isElectron && hasFileSystemAccess && (
        <div className="info-message">
          ℹ️ Tryb przeglądarki - używam File System Access API
        </div>
      )}
    </div>
  );
}
