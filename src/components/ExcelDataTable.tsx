import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { DEFAULT_CUSTOM_COLUMNS } from '../types/excel.types';
import FilterPanel from './FilterPanel';
import './ExcelDataTable.css';

/**
 * Komponent do wyświetlania danych z załadowanych plików Excel
 * Iteration 2: Tabela z filtrami tagów i wyszukiwaniem
 */
export default function ExcelDataTable() {
  const { loadedData, loading, error, config } = useAppStore();
  const [filteredRows, setFilteredRows] = useState<Array<{ rowIndex: number; columns: Record<string, any>; rowColor?: string }>>([]);

  const resolvedCustomColumns = (config.customColumns?.length ? config.customColumns : DEFAULT_CUSTOM_COLUMNS).map(column => ({ ...column }));

  // Funkcja do resetowania filtrów
  const handleResetFilters = () => {
    setFilteredRows([]); // Czyścimy przefiltrowane wiersze, co przywróci wszystkie dane
  };
  const visibleCustomColumns = resolvedCustomColumns.filter(col => col.visible);

  // Funkcja do konwersji koloru ARGB na CSS
  const getRowColor = (argb?: string) => {
    if (!argb) return undefined;
    // ARGB format: AARRGGBB
    if (argb.length === 8) {
      const r = parseInt(argb.substr(2, 2), 16);
      const g = parseInt(argb.substr(4, 2), 16);
      const b = parseInt(argb.substr(6, 2), 16);
      return `rgba(${r}, ${g}, ${b}, 0.3)`;
    }
    return undefined;
  };

  // Determine which columns to display based on mode
  const displayColumns = config.displayMode === 'custom' && visibleCustomColumns.length > 0
    ? visibleCustomColumns
    : null;

  // Get column width for a specific column
  const getColumnWidth = (columnName: string): number => {
    if (config.displayMode === 'custom') {
      const colConfig = visibleCustomColumns.find(c => c.name === columnName);
      return colConfig?.width || 150;
    }
    return config.columnWidth || 150;
  };

  // Filter headers based on display mode - TYLKO WYBRANE KOLUMNY
  const allowedColumnNames = new Set(visibleCustomColumns.map(col => col.name));
  const baseHeaders = displayColumns
    ? displayColumns.map(col => col.name)
    : (loadedData?.headers || []).filter(header => allowedColumnNames.size === 0 || allowedColumnNames.has(header));
  const supplementalHeaders = displayColumns
    ? []
    : visibleCustomColumns
        .map(col => col.name)
        .filter(name => !baseHeaders.includes(name));
  const visibleHeaders = [...baseHeaders, ...supplementalHeaders];

  console.log('ExcelDataTable: Headers:', loadedData?.headers);
  console.log('ExcelDataTable: Visible headers:', visibleHeaders);
  console.log('ExcelDataTable: Has Final File Name:', visibleHeaders.includes('Final File Name'));

  // Używamy przefiltrowanych wierszy lub wszystkich
  const displayRows = filteredRows.length > 0 || loadedData ? filteredRows : [];
  const actualRows = displayRows.length > 0 ? displayRows : (loadedData?.rows || []);

  return (
    <div className="excel-data-table">
      <div className="table-header">
        <h2>📊 Dane z plików Excel</h2>
        
        <div className="table-actions">
          {loadedData && (
            <>
              <button 
                onClick={() => useAppStore.setState({ loadedData: null })}
                className="btn-secondary"
              >
                🗑️ Wyczyść dane
              </button>
              
              {/* Przycisk Reset filtrów - przeniesiony z FilterPanel */}
              <button 
                onClick={handleResetFilters}
                className="btn-secondary"
                title="Wyczyść wszystkie filtry"
              >
                🔄 Reset wszystkich filtrów
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {!loadedData && !loading && (
        <div className="empty-state">
          <p>📂 Użyj przycisku "Załaduj wybrane pliki" w sekcji "Pliki Excel" powyżej</p>
          <p className="hint">
            Najpierw wybierz folder z plikami Excel, zaznacz pliki checkboxami, a następnie kliknij przycisk ładowania.
          </p>
        </div>
      )}

      {loadedData && (
        <>
          {/* Panel filtrów - Iteration 2 */}
          <FilterPanel 
            rows={loadedData.rows} 
            onFilterChange={setFilteredRows}
            loadedData={loadedData}
          />

          {/* Ukryta belka z podsumowaniem - przeniesiona do FilterPanel */}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="row-number" style={{ width: '60px', minWidth: '60px' }}>#</th>
                  {config.displayMode === 'all' && (
                    <th className="source-file" style={{ width: '100px', minWidth: '100px' }}>Plik źródłowy</th>
                  )}
                  {visibleHeaders.map((header, i) => (
                    <th 
                      key={i}
                      style={{ 
                        width: `${getColumnWidth(header)}px`,
                        minWidth: '60px',
                        maxWidth: '500px'
                      }}
                      title={`${header}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actualRows.map((row, i) => (
                  <tr 
                    key={i}
                    style={{ backgroundColor: getRowColor(row.rowColor) }}
                  >
                    <td className="row-number">{i + 1}</td>
                    {config.displayMode === 'all' && (
                      <td className="source-file" title={(row as any).sourceFile}>
                        {(row as any).sourceFile}
                      </td>
                    )}
                    {visibleHeaders.map((header, j) => {
                      const rawValue = row.columns[header];
                      const displayValue = rawValue === null || rawValue === undefined ? '' : String(rawValue);
                      return (
                        <td 
                          key={j}
                          style={{ 
                            width: `${getColumnWidth(header)}px`,
                            maxWidth: `${getColumnWidth(header)}px`
                          }}
                          title={displayValue}
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {actualRows.length === 0 && loadedData.totalRows > 0 && (
            <div className="empty-table">
              <p>🔍 Brak wyników dla wybranych filtrów</p>
              <p className="hint">Zmień kryteria filtrowania lub kliknij "Reset wszystkich filtrów"</p>
            </div>
          )}

          {loadedData.totalRows === 0 && (
            <div className="empty-table">
              <p>📭 Brak danych w załadowanych plikach</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
