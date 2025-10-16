import { useAppStore } from '../store/appStore';
import './FinalFileNameGenerator.css';

/**
 * Komponent do generowania finalnych nazw plików
 * Format: [tomy]_[numery]_[FILE NUMBER]
 * - [tomy]: Tom 1/Tom 1.1 → 1---1-1
 * - [numery]: sekwencyjny numer dla każdego unikalnego tomu (001, 002, ...)
 * - [FILE NUMBER]: oryginalna nazwa z kolumny FILE NUMBER
 */
export default function FinalFileNameGenerator() {
  const { loadedData, updateLoadedData } = useAppStore();

  /**
   * Transformacja folderu Tom na format tomy
   * Przykłady:
   * - "Tom 1/Tom 1.1" → "1---1-1"
   * - "Tom 2/Tom 2.1/Tom 2.1.5" → "2---2-1---2-1-5"
   */
  const transformTomFolder = (folder: string | undefined | null): string => {
    if (!folder || typeof folder !== 'string') return '';

    // Rozdziel po '/'
    const parts = folder.split('/').map(p => p.trim());
    
    // Dla każdej części wyciągnij numery (np. "Tom 1.1" → "1.1")
    const numbers = parts.map(part => {
      const match = part.match(/Tom\s+(\d+(?:\.\d+)*)/i);
      return match ? match[1] : '';
    }).filter(Boolean);

    // Zamień '.' na '-' w każdej części
    const transformed = numbers.map(num => num.replace(/\./g, '-'));

    // Połącz za pomocą '---'
    return transformed.join('---');
  };

  /**
   * Generuj finalną nazwę pliku
   */
  const generateFinalFileName = (
    folder: string | undefined | null,
    fileNumber: string | undefined | null,
    sequenceNumber: number
  ): string => {
    const tomyPart = transformTomFolder(folder);
    const numerPart = sequenceNumber.toString().padStart(3, '0');
    const fileNumberPart = fileNumber ? String(fileNumber).trim() : '';

    if (!tomyPart && !fileNumberPart) return '';

    const parts = [];
    if (tomyPart) parts.push(tomyPart);
    parts.push(numerPart);
    if (fileNumberPart) parts.push(fileNumberPart);

    return parts.join('_');
  };

  /**
   * Dodaj kolumnę "Final File Name"
   */
  const handleAddColumn = () => {
    if (!loadedData) {
      console.warn('FinalFileNameGenerator: Brak loadedData');
      return;
    }

    // Znajdź kolumny Folder i FILE NUMBER
    const folderKey = loadedData.headers.find(h => h === 'Folder');
    const fileNumberKey = loadedData.headers.find(h => 
      h && typeof h === 'string' && h.toLowerCase().includes('file') && h.toLowerCase().includes('number')
    );

    console.log('FinalFileNameGenerator: Znalezione klucze:', { folderKey, fileNumberKey });
    console.log('FinalFileNameGenerator: Headers:', loadedData.headers);
    console.log('FinalFileNameGenerator: Liczba wierszy:', loadedData.rows.length);

    if (!folderKey || !fileNumberKey) {
      console.warn('FinalFileNameGenerator: Brak wymaganych kolumn: Folder lub FILE NUMBER');
      return;
    }

    // Zlicz sekwencyjnie dla każdego unikalnego folderu
    const folderCounters = new Map<string, number>();

    const updatedRows = loadedData.rows.map(row => {
      const folder = row.columns[folderKey];
      const fileNumber = row.columns[fileNumberKey];
      
      const folderStr = folder ? String(folder).trim() : '';
      const fileNumberStr = fileNumber ? String(fileNumber).trim() : '';
      
      // Sprawdź czy FILE NUMBER zaczyna się od 'P00'
      const isP00File = fileNumberStr.toUpperCase().startsWith('P00');
      
      let finalFileName = '';
      
      if (isP00File) {
        // Dla plików P00 zastosuj pełną logikę
        const counterKey = folderStr;
        const currentCount = folderCounters.get(counterKey) || 0;
        const sequenceNumber = currentCount + 1;
        folderCounters.set(counterKey, sequenceNumber);
        
        finalFileName = generateFinalFileName(folderStr, fileNumber, sequenceNumber);
      }
      // Dla plików nie-P00 pozostaw pusty string

      return {
        ...row,
        columns: {
          ...row.columns,
          'Final File Name': finalFileName,
        },
      };
    });

    // Dodaj nagłówek jeśli nie istnieje
    const updatedHeaders = loadedData.headers.includes('Final File Name')
      ? loadedData.headers
      : [...loadedData.headers, 'Final File Name'];

    const updatedData = {
      ...loadedData,
      headers: updatedHeaders,
      rows: updatedRows,
    };

    console.log('FinalFileNameGenerator: Aktualizuję dane:', {
      headersCount: updatedHeaders.length,
      rowsCount: updatedRows.length,
      hasFinalFileName: updatedHeaders.includes('Final File Name'),
      sampleRow: updatedRows[0]?.columns['Final File Name']
    });

    updateLoadedData(updatedData);
  };

  /**
   * Ukryj kolumnę "Final File Name"
   */
  const handleHideColumn = () => {
    if (!loadedData) return;

    console.log('FinalFileNameGenerator: Ukrywam kolumnę Final File Name');

    // Usuń kolumnę z nagłówków
    const updatedHeaders = loadedData.headers.filter(h => h !== 'Final File Name');

    // Usuń kolumnę z wierszy
    const updatedRows = loadedData.rows.map(row => {
      const { 'Final File Name': _, ...restColumns } = row.columns;
      return {
        ...row,
        columns: restColumns,
      };
    });

    const updatedData = {
      ...loadedData,
      headers: updatedHeaders,
      rows: updatedRows,
    };

    console.log('FinalFileNameGenerator: Kolumna ukryta, nowe headers:', updatedHeaders.length);

    updateLoadedData(updatedData);
  };

  const hasColumn = loadedData?.headers.includes('Final File Name') || false;

  return (
    <div className="final-file-name-generator">
      <div className="generator-actions">
        {!hasColumn && (
          <button
            onClick={handleAddColumn}
            className="btn-primary"
            disabled={!loadedData}
            title="Dodaj kolumnę z finalnymi nazwami plików"
          >
            ➕ Dodaj kolumnę "Final File Name"
          </button>
        )}

        {hasColumn && (
          <button
            onClick={handleHideColumn}
            className="btn-secondary"
            title="Ukryj kolumnę Final File Name"
          >
            ➖ Ukryj kolumnę "Final File Name"
          </button>
        )}
      </div>

      {hasColumn && (
        <div className="generator-info">
          <small>
            ✅ Kolumna "Final File Name" dodana. Format: <code>[tomy]_[numery]_[FILE NUMBER]</code>
          </small>
        </div>
      )}

      
    </div>
  );
}
