import { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import type { ExcelData } from '../types/excel.types';
import './ExcelFilePicker.css';

interface ExcelFilePickerProps {
  onClose: () => void;
}

export default function ExcelFilePicker({ onClose }: ExcelFilePickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setLoadedData, setLoading: setStoreLoading } = useAppStore();

  const handleFileSelect = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obsługa File System Access API (Chrome/Edge desktop)
      if ('showOpenFilePicker' in window) {
        try {
          const fileHandles = await (window as any).showOpenFilePicker({
            types: [
              {
                description: 'Pliki Excel',
                accept: {
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                  'application/vnd.ms-excel': ['.xls'],
                },
              },
            ],
          });

          if (fileHandles.length === 0) return;

          const fileHandle = fileHandles[0];
          const file = await fileHandle.getFile();
          await loadExcelData(file);
        } catch (err: any) {
          if (err.name === 'NotAllowedError') {
            // Fallback na HTML5 input
            fileInputRef.current?.click();
          } else if (err.name !== 'AbortError') {
            throw err;
          }
        }
      } else {
        // Fallback dla przeglądarek bez File System Access API
        fileInputRef.current?.click();
      }

      setStoreLoading(false);
      onClose();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Błąd podczas ładowania pliku');
      }
      setStoreLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      await loadExcelData(files[0]);
      setStoreLoading(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Błąd podczas ładowania pliku');
      setStoreLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const loadExcelData = async (file: File) => {
    // Dynamiczny import ExcelJS
    const { Workbook } = await import('exceljs');
    
    // Odczytanie pliku
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    // Pobranie pierwszego arkusza
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet || worksheet.rowCount === 0) {
      setError('Plik Excel jest pusty');
      return;
    }

    // Wyodrębnienie nagłówków (pierwszy wiersz)
    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(String(cell.value || ''));
    });

    // Konwersja wierszy
    const rows = [];
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const columns: Record<string, any> = {};
      
      row.eachCell((cell, colNumber) => {
        if (colNumber <= headers.length) {
          columns[headers[colNumber - 1]] = cell.value || '';
        }
      });
      
      rows.push({
        rowIndex: i - 2,
        rowColor: undefined,
        sourceFile: file.name, // Dodane pole sourceFile
        columns,
      });
    }

    // Przygotowanie obiektu ExcelData
    const excelData: ExcelData = {
      sourceFiles: [
        {
          fileName: file.name,
          filePath: file.name,
          folderPath: '.',
          selected: true,
          sheetName: worksheet.name,
          headers,
          rowCount: rows.length,
          lastModified: file.lastModified,
        },
      ],
      headers,
      rows,
      totalRows: rows.length,
      columnsCount: headers.length,
    };

    // Aktualizacja store
    setLoadedData(excelData);
  };

  return (
    <div className="excel-file-picker">
      <h3>📁 Wczytaj plik Excel</h3>
      
      {/* Hidden file input jako fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '4px',
          marginBottom: '12px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '12px', color: '#666' }}>
          Kliknij poniżej aby wybrać plik Excel (.xlsx, .xls)
        </p>
        <button
          onClick={handleFileSelect}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {loading ? '⏳ Ładowanie...' : '📂 Wybierz plik Excel'}
        </button>
      </div>

      <button
        onClick={onClose}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Zamknij
      </button>
    </div>
  );
}