import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { addTomColumn } from '../utils/excelAnalysis';
import FileExistChecker from './FileExistChecker';
import FinalFileNameGenerator from './FinalFileNameGenerator';
import defaultPaths from '../config/defaultPaths.json';
import './WorkflowPanel.css';

interface WorkflowPanelProps {
  onOpenFilePicker: () => void;
  onDataLoaded?: () => void;
}

/**
 * Komponent łączący wybór plików Excel i sprawdzanie PDF
 * Layout: 1/3 Excel + 1/3 PDF Check + 1/3 PDF Copy
 */
export default function WorkflowPanel({ onOpenFilePicker, onDataLoaded }: WorkflowPanelProps) {
  const { excelFiles, updateLoadedData, setLoading, setError, config } = useAppStore();
  const [loadingData, setLoadingData] = useState(false);

  const selectedFiles = excelFiles.filter(f => f.selected);
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // Załaduj wybrane pliki Excel
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
        // Electron mode
        const paths = selectedFiles.map(f => f.filePath);
        const result = await window.electronAPI.loadMultipleExcelFiles(paths, config);

        if (result.success && result.data) {
          // Add Tom/Folder column analysis (WAŻNE - tak samo jak w ExcelDataTable)
          const processedRows = addTomColumn(result.data.rows, result.data.headers);
          const processedData = {
            ...result.data,
            rows: processedRows,
            headers: ['Folder', ...result.data.headers], // Add Folder as first column
          };
          
          updateLoadedData(processedData);
          window.electronAPI.logInfo(`Loaded ${processedData.totalRows} rows from ${paths.length} files`);
          onDataLoaded?.();
        } else {
          setError(result.error || 'Błąd ładowania plików Excel');
        }
      } else {
        // Browser mode
        const { readMultipleExcelFiles } = await import('../utils/browserExcel');
        const fileHandles = selectedFiles
          .map(f => (f as any).fileHandle)
          .filter((h): h is FileSystemFileHandle => !!h);
        
        if (fileHandles.length === 0) {
          throw new Error('Brak file handles dla wybranych plików (Browser mode)');
        }

        const browserData = await readMultipleExcelFiles(fileHandles, config);
        
        // Add Tom/Folder column analysis (WAŻNE - tak samo jak w ExcelDataTable)
        const processedRows = addTomColumn(browserData.rows, browserData.headers);
        
        // Convert to ExcelData format
        const data = {
          sourceFiles: browserData.sourceFiles.map(sf => ({
            fileName: sf.fileName,
            filePath: sf.filePath,
            selected: sf.selected,
            sheetName: sf.sheetName,
            headers: sf.headers,
            rowCount: sf.rowCount,
          })),
          headers: ['Folder', ...browserData.headers], // Add Folder as first column
          rows: processedRows,
          totalRows: browserData.totalRows,
          columnsCount: browserData.columnsCount,
        };
        
        updateLoadedData(data);
        console.log(`Loaded ${data.totalRows} rows from ${selectedFiles.length} files`);
        onDataLoaded?.();
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

        {/* Domyślna ścieżka Excel - na dole */}
        <div className="default-paths-info">
          <div className="path-item">
            <small>
              📁 <strong>Domyślne źródło Excel:</strong><br />
              <code>{defaultPaths.excelSourcePath}</code>
            </small>
          </div>
        </div>
      </div>

      {/* Sekcja PDF Checker - 1/3 szerokości */}
      <div className="workflow-section workflow-pdf-checker">
        <div className="section-header">
          <h3>🔍 Sprawdź pliki PDF</h3>
          <p className="section-description">
            Weryfikacja istnienia plików PDF zgodnie z numeracją FILE NUMBER (tylko P001)
          </p>
        </div>
        
        <div className="section-content">
          <FileExistChecker mode="check" />
        </div>

        {/* Domyślna ścieżka źródłowa PDF - na dole */}
        <div className="default-paths-info">
          <div className="path-item">
            <small>
              📁 <strong>Domyślne źródło PDF:</strong><br />
              <code>{defaultPaths.pdfSourcePath}</code>
            </small>
          </div>
        </div>
      </div>

      {/* Sekcja Final File Name Generator - pełna szerokość poniżej */}
      <div className="workflow-section workflow-full-width">
        <div className="section-header">
          <h3>🏷️ Finalne nazwy plików</h3>
          <p className="section-description">
            Generowanie finalnych nazw plików według wzoru: [tomy]_[numery]_[FILE NUMBER]
          </p>
        </div>
        
        <div className="section-content">
          <FinalFileNameGenerator />
        </div>
      </div>

      {/* Sekcja PDF Copy - 1/3 szerokości */}
      <div className="workflow-section workflow-pdf-copy">
        <div className="section-header">
          <h3>📋 Kopiowanie plików PDF</h3>
          <p className="section-description">
            Kopiowanie plików PDF do folderów docelowych zgodnie z numeracją
          </p>
        </div>
        
        <div className="section-content">
          <FileExistChecker mode="copy" />
        </div>

        {/* Domyślny cel kopiowania - na dole */}
        <div className="default-paths-info">
          <div className="path-item">
            <small>
              📂 <strong>Domyślny cel kopiowania:</strong><br />
              <code>{defaultPaths.pdfDestinationPath}</code>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
