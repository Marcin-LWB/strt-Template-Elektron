import { useEffect, useMemo, useState } from 'react'
import './styles.css'
import type { CsvEntry } from './types'
import { listCsvFiles, ensureReadPermission } from './fs-utils'
import { saveRootDirHandle, loadRootDirHandle, clearRootDirHandle } from './lib/storage'



type Status = 'idle' | 'loading' | 'ready' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [rootDir, setRootDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [rows, setRows] = useState<CsvEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recursive, setRecursive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<CsvEntry | null>(null);

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
    await clearRootDirHandle();
    setStatus('idle');
  }



  const total = rows.length;
  const distinctFolders = useMemo(
    () => new Set(rows.map(r => r.folderPath)).size,
    [rows]
  );

  return (
    <div className="container">
      <h1 className="app-title">CSV Browser</h1>

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

      <div className="main-content">
        {/* Lista plików CSV */}
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
                  onClick={() => setSelectedFile(entry)}
                >
                  <div className="file-name">{entry.fileName}</div>
                  <div className="file-path">{entry.folderPath}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Podgląd wybranego pliku */}
        <div className="csv-viewer">
          <h3>Podgląd pliku</h3>
          {!selectedFile ? (
            <p><em>Wybierz plik z lewej strony</em></p>
          ) : (
            <div className="csv-info">
              <strong>{selectedFile.fileName}</strong>
              <div>Ścieżka: {selectedFile.folderPath}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
