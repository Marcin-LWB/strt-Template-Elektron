import { useEffect, useState } from 'react';
import { useAppStore } from './store/appStore';
import { DEFAULT_CUSTOM_COLUMNS } from './types/excel.types';
import ExcelFilePicker from './components/ExcelFilePicker';
import ExcelDataTable from './components/ExcelDataTable';
import CollapsiblePanel from './components/CollapsiblePanel';
import WorkflowPanel from './components/WorkflowPanel';
import './AppNew.css';

/**
 * Główny komponent aplikacji CPK-Export-Weryfikacja
 * UI Redesign v2 - zwijany panel z Excel + PDF checker
 */
export default function AppNew() {
  const { config } = useAppStore();
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(true);

  // Log przy starcie
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.logInfo('CPK Export Weryfikacja - Aplikacja uruchomiona (UI Redesign v2)');
      window.electronAPI.logInfo('Konfiguracja:', config);
    }
  }, []);

  return (
    <div className="app-new">
      <header className="app-header">
        <div className="header-content">
          <h1>📊 CPK Export Weryfikacja</h1>
          <p className="subtitle">
            Weryfikacja i automatyzacja eksportu zasobów multimedialnych
          </p>
        </div>
        
        <div className="header-actions">
          <ConfigPanel />
        </div>
      </header>

      <main className="app-main">
        <div className="app-layout">
          {/* Panel roboczy - Excel + PDF w jednym miejscu */}
          <CollapsiblePanel 
            title="🔧 Panel roboczy - Zarządzanie plikami" 
            expanded={panelExpanded}
            onExpandedChange={setPanelExpanded}
          >
            <WorkflowPanel 
              onOpenFilePicker={() => setShowFilePicker(true)}
              onDataLoaded={() => setPanelExpanded(false)}
            />
          </CollapsiblePanel>

          {/* Główna tabela danych */}
          <section className="content">
            <ExcelDataTable />
          </section>
        </div>
      </main>

      {/* Modal wyboru plików */}
      {showFilePicker && (
        <div className="modal-overlay" onClick={() => setShowFilePicker(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📁 Wybór plików Excel</h2>
              <button 
                className="modal-close"
                onClick={() => setShowFilePicker(false)}
                aria-label="Zamknij"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <ExcelFilePicker onClose={() => setShowFilePicker(false)} />
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <div className="footer-content">
          <span>CPK Export Weryfikacja v1.0.0</span>
          <span>•</span>
          <span>UI Redesign v2</span>
          {window.electronAPI && (
            <>
              <span>•</span>
              <span>✅ Electron Mode</span>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

/**
 * Panel konfiguracji
 */
function ConfigPanel() {
  const { config, updateConfig } = useAppStore();
  const [showConfig, setShowConfig] = useState(false);
  const resolvedCustomColumns = config.customColumns?.length ? config.customColumns : DEFAULT_CUSTOM_COLUMNS;

  return (
    <div className="config-panel">
      <button 
        onClick={() => setShowConfig(!showConfig)}
        className="config-button"
        title="Ustawienia"
      >
        ⚙️ Konfiguracja
      </button>

      {showConfig && (
        <div className="config-dropdown">
          <div className="config-item">
            <label>
              <strong>Tryb wyświetlania kolumn:</strong>
              <select
                value={config.displayMode || 'all'}
                onChange={(e) => updateConfig({ 
                  displayMode: e.target.value as 'all' | 'custom'
                })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  marginTop: '4px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                }}
              >
                <option value="all">Wszystkie kolumny (z pliku Excel)</option>
                <option value="custom">Wybrane kolumny (konfiguracja niestandardowa)</option>
              </select>
            </label>
          </div>

          {config.displayMode === 'all' && (
            <>
              <div className="config-item">
                <label>
                  Liczba kolumn do odczytu:
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={config.columnsToRead}
                    onChange={(e) => updateConfig({ 
                      columnsToRead: parseInt(e.target.value) || 10 
                    })}
                  />
                </label>
              </div>

              <div className="config-item">
                <label>
                  Indeks kolumny z kolorem (0-based):
                  <input
                    type="number"
                    min="0"
                    max="49"
                    value={config.colorColumnIndex}
                    onChange={(e) => updateConfig({ 
                      colorColumnIndex: parseInt(e.target.value) || 1 
                    })}
                  />
                </label>
              </div>
            </>
          )}

          {config.displayMode === 'custom' && (
            <div className="config-item">
              <p style={{ fontSize: '12px', color: '#666', margin: '8px 0' }}>
                📋 Wyświetlane kolumny:
              </p>
              <ul style={{ fontSize: '12px', margin: '8px 0', paddingLeft: '20px' }}>
                {resolvedCustomColumns.map((col, i) => (
                  <li key={i}>
                    <strong>{col.name}</strong> - {col.width}px
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="config-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.skipEmptyRows}
                onChange={(e) => updateConfig({ 
                  skipEmptyRows: e.target.checked 
                })}
              />
              Pomijaj puste wiersze
            </label>
          </div>

          <div className="config-item">
            <label>
              Indeks wiersza nagłówków (0-based):
              <input
                type="number"
                min="0"
                max="10"
                value={config.headerRowIndex}
                onChange={(e) => updateConfig({ 
                  headerRowIndex: parseInt(e.target.value) || 0 
                })}
              />
            </label>
          </div>

          <div className="config-footer">
            <button 
              onClick={() => {
                updateConfig({
                  columnsToRead: 10,
                  colorColumnIndex: 1,
                  skipEmptyRows: true,
                  headerRowIndex: 0,
                  displayMode: 'all',
                });
                window.electronAPI?.logInfo('Konfiguracja przywrócona do domyślnej');
              }}
              className="btn-link"
            >
              Przywróć domyślne
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
