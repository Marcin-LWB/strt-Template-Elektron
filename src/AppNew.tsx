import { useEffect, useState } from 'react';
import ExcelDataTable from './components/ExcelDataTable';
import ExcelFilePicker from './components/ExcelFilePicker';
import CollapsiblePanel from './components/CollapsiblePanel';
import WorkflowPanel from './components/WorkflowPanel';
import './AppNew.css';

/**
 * Główny komponent aplikacji CPK-Export-Weryfikacja
 * Szablon aplikacji Electron do pracy z plikami Excel
 */
export default function AppNew() {
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(true);

  // Log przy starcie
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.logInfo('CPK Export Weryfikacja - Szablon aplikacji uruchomiony');
    }
  }, []);

  return (
    <div className="app-new">
      <header className="app-header">
        <div className="header-content">
          <h1>📊 Starter v0.1</h1>
          <p className="subtitle">
            Weryfikacja dokumentacji i analiza dokumentów
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
          <span>Starter Template v1.0.0</span>
          <span>•</span>
          <span>UI v1</span>
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
 * Panel konfiguracji - uproszczony szablon
 */
function ConfigPanel() {
  const [showConfig, setShowConfig] = useState(false);

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
            <p>Konfiguracja aplikacji</p>
            <p style={{ color: '#666', fontSize: '12px' }}>
              Miejsce na przyszłe ustawienia aplikacji
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
