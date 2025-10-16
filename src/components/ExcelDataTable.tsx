import { useAppStore } from '../store/appStore';
import './ExcelDataTable.css';

export default function ExcelDataTable() {
  const { loadedData, loading, error } = useAppStore();

  const handleExportToExcel = async () => {
    if (!loadedData) return;
    
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Eksport danych');

      const headers = ['#', 'Plik źródłowy', ...(loadedData.headers || [])];
      worksheet.addRow(headers);

      loadedData.rows.forEach((row: any, index: number) => {
        const rowData = [index + 1, row.sourceFile || 'N/A'];
        loadedData.headers.forEach((header: string) => {
          rowData.push(row.columns[header] || '');
        });
        worksheet.addRow(rowData);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'eksport_danych.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Błąd eksportu:', error);
    }
  };

  return (
    <div className="excel-data-table">
      <div className="table-header">
        <h2>Dane z plików Excel</h2>
        
        <div className="table-actions">
          {loadedData && (
            <>
              <button 
                onClick={() => useAppStore.setState({ loadedData: null })}
                className="btn-secondary"
              >
                Wyczyść dane
              </button>
              
              <button 
                onClick={handleExportToExcel}
                className="btn-primary"
              >
                Eksportuj do Excel
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-spinner">
          Ładowanie danych...
        </div>
      )}

      {!loading && !loadedData && (
        <div className="empty-state">
          <h3>Wybierz pliki Excel</h3>
          <p>Użyj panelu wyboru plików, aby załadować dane z arkuszy Excel</p>
        </div>
      )}

      {loadedData && (
        <div className="table-info">
          <p>Pliki źródłowe: {loadedData.sourceFiles?.length || 0} | 
             Wiersze: {loadedData.totalRows} | 
             Kolumny: {loadedData.headers?.length || 0}
          </p>
        </div>
      )}

      {loadedData && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="row-number">#</th>
                <th className="source-file">Plik źródłowy</th>
                {(loadedData.headers || []).map((header: string, i: number) => (
                  <th key={i} title={header}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(loadedData.rows || []).map((row: any, i: number) => (
                <tr key={i}>
                  <td className="row-number">{i + 1}</td>
                  <td className="source-file" title={row.sourceFile}>
                    {row.sourceFile || 'N/A'}
                  </td>
                  {(loadedData.headers || []).map((header: string, j: number) => {
                    const rawValue = row.columns[header];
                    const displayValue = rawValue === null || rawValue === undefined ? '' : String(rawValue);
                    return (
                      <td key={j} title={displayValue}>
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loadedData && loadedData.totalRows === 0 && (
        <div className="empty-table">
          <p>Brak danych w załadowanych plikach</p>
        </div>
      )}
    </div>
  );
}
