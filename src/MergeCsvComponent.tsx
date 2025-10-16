import { useMemo, useState } from 'react';
import type { CsvEntry } from './types';

export type MergeSelection = {
  first: CsvEntry | null;
  second: CsvEntry | null;
};

type MergeMessage = {
  tone: 'success' | 'info' | 'error';
  text: string;
};

type MergeCsvComponentProps = {
  csvFiles: CsvEntry[];
  onMerge: (fileA: CsvEntry, fileB: CsvEntry) => Promise<{ added: number; mainEntry: CsvEntry } | void>;
  onClose: () => void;
  isMerging: boolean;
};

export default function MergeCsvComponent({ csvFiles, onMerge, onClose, isMerging }: MergeCsvComponentProps) {
  const [selection, setSelection] = useState<MergeSelection>({ first: null, second: null });
  const [localMessage, setLocalMessage] = useState<MergeMessage | null>(null);

  const canMerge = useMemo(() => {
    return Boolean(selection.first && selection.second && selection.first !== selection.second);
  }, [selection.first, selection.second]);

  const filesSorted = useMemo(
    () => [...csvFiles].sort((a, b) => a.fileName.localeCompare(b.fileName)),
    [csvFiles]
  );

  function updateSelection(key: 'first' | 'second', value: string) {
    const entry = csvFiles.find(file => `${file.folderPath}/${file.fileName}` === value) ?? null;
    setSelection(prev => ({ ...prev, [key]: entry }));
    setLocalMessage(null);
  }

  async function handleMerge() {
    if (!selection.first || !selection.second) {
      setLocalMessage({ tone: 'error', text: 'Wybierz dwa różne pliki CSV.' });
      return;
    }

    if (selection.first === selection.second) {
      setLocalMessage({ tone: 'error', text: 'Nie możesz wybrać tego samego pliku dwa razy.' });
      return;
    }

    try {
      const result = await onMerge(selection.first, selection.second);
      if (result) {
        const { added, mainEntry } = result;
        if (added === 0) {
          setLocalMessage({ tone: 'info', text: 'Brak nowych wierszy do dodania (duplikaty linków).' });
        } else {
          setLocalMessage({
            tone: 'success',
            text: `Dodano ${added} wiersz${added === 1 ? '' : added < 5 ? 'e' : 'y'} do pliku ${mainEntry.fileName}.`,
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setLocalMessage({ tone: 'error', text: err?.message ?? 'Nie udało się połączyć plików.' });
    }
  }

  return (
    <div className="merge-card">
      <div className="merge-card-header">
        <h3>Połącz dwa pliki CSV</h3>
        <button type="button" onClick={onClose} className="merge-close-btn">Zamknij</button>
      </div>

      <p className="merge-description">
        Wybierz dwa pliki CSV. Aplikacja porówna liczbę kolumn i doda unikalne wiersze na górze pliku z większą liczbą kolumn.
      </p>

      <div className="merge-selects">
        <label>
          <span>Pierwszy plik</span>
          <select value={selection.first ? `${selection.first.folderPath}/${selection.first.fileName}` : ''} onChange={(e) => updateSelection('first', e.target.value)}>
            <option value="">Wybierz plik...</option>
            {filesSorted.map(file => (
              <option key={`${file.folderPath}/${file.fileName}`} value={`${file.folderPath}/${file.fileName}`}>
                {file.fileName} ({file.folderPath})
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Drugi plik</span>
          <select value={selection.second ? `${selection.second.folderPath}/${selection.second.fileName}` : ''} onChange={(e) => updateSelection('second', e.target.value)}>
            <option value="">Wybierz plik...</option>
            {filesSorted.map(file => (
              <option key={`${file.folderPath}/${file.fileName}`} value={`${file.folderPath}/${file.fileName}`}>
                {file.fileName} ({file.folderPath})
              </option>
            ))}
          </select>
        </label>
      </div>

      {localMessage && (
        <div className={`merge-message ${localMessage.tone}`}>
          {localMessage.text}
        </div>
      )}

      <div className="merge-actions">
        <button type="button" onClick={handleMerge} disabled={!canMerge || isMerging}>
          {isMerging ? 'Łączenie...' : 'Połącz pliki'}
        </button>
      </div>
    </div>
  );
}
