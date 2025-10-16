import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import './WorkflowPanel.css';

interface WorkflowPanelProps {
  onOpenFilePicker: () => void;
  onDataLoaded?: () => void;
}

/**
 * Komponent panelu roboczego - szablon z 4 sekcjami
 * Layout: Excel + 3 dodatkowe sekcje do rozbudowy
 */
export default function WorkflowPanel({ onOpenFilePicker, onDataLoaded }: WorkflowPanelProps) {
  const { excelFiles, updateLoadedData, setLoading, setError } = useAppStore();
  const [loadingData, setLoadingData] = useState(false);

  const selectedFiles = excelFiles.filter(f => f.selected);
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // Uproszczona funkcja ładowania Excel
  const handleLoadData = async () => {
    if (selectedFiles.length === 0) {
      setError('⚠️ Nie wybrano żadnych plików');
      return;
    }

    setLoadingData(true);
    setLoading(true);
    setError(null);

    try {
      if (isElectron) {
        // Electron mode - uproszczone ładowanie
        const paths = selectedFiles.map(f => f.filePath);
        const result = await window.electronAPI.loadMultipleExcelFiles(paths, {});

        if (result.success && result.data) {
          updateLoadedData(result.data);
          window.electronAPI.logInfo(`Załadowano ${result.data.totalRows} wierszy z ${paths.length} plików`);
          onDataLoaded?.();
        } else {
          setError(result.error || 'Błąd ładowania plików Excel');
        }
      } else {
        // Browser mode - uproszczone
        setError('Tryb przeglądarki nie jest obsługiwany w szablonie');
      }
    } catch (err: any) {
      setError(`❌ Błąd: ${err.message}`);
      console.error('Error loading Excel files:', err);
      if (isElectron) {
        window.electronAPI?.logError('Error loading Excel files', err);
      }
    } finally {
      setLoadingData(false);
      setLoading(false);
    }
  };

  return (
    <div className="workflow-panel">
      {/* Sekcja Excel - 1/3 szerokości */}
      <div className="workflow-section workflow-excel">
        <div className="section-header">
          <h3>📊 Pliki Excel</h3>
          <p className="section-description">
            Wybierz folder z plikami Excel i załaduj dane do analizy
          </p>
        </div>

        <div className="section-content section-content--compact">
          <button
            onClick={onOpenFilePicker}
            className="btn-secondary btn-full"
          >
            📂 Wybierz folder
          </button>

          <button
            onClick={handleLoadData}
            disabled={selectedFiles.length === 0 || loadingData}
            className="btn-primary btn-full"
          >
            {loadingData ? '⏳ Ładuję...' : '📥 Załaduj wybrane pliki'}
          </button>
        </div>

      </div>

      {/* Sekcja 2 - Szablon */}
      <div className="workflow-section workflow-excel">
        <div className="section-header">
          <h3>� Sekcja 2</h3>
          <p className="section-description">
            Miejsce na dodatkową funkcjonalność
          </p>
        </div>
        
        <div className="section-content">
          <p>Funkcjonalność do dodania</p>
        </div>
      </div>

      {/* Sekcja 3 - Szablon */}
      <div className="workflow-section workflow-excel">
        <div className="section-header">
          <h3>⚙️ Sekcja 3</h3>
          <p className="section-description">
            Miejsce na dodatkową funkcjonalność
          </p>
        </div>
        
        <div className="section-content">
          <p>Funkcjonalność do dodania</p>
        </div>
      </div>

      {/* Sekcja 4 - Szablon */}
      <div className="workflow-section workflow-excel">
        <div className="section-header">
          <h3>� Sekcja 4</h3>
          <p className="section-description">
            Miejsce na dodatkową funkcjonalność
          </p>
        </div>
        
        <div className="section-content">
          <p>Funkcjonalność do dodania</p>
        </div>
      </div>
    </div>
  );
}
