import { useState } from 'react';
import type { CsvEntry, CsvData } from './types';
import { readCsvFile } from './fs-utils';

export type SearchResult = {
  folderPath: string;
  fileName: string;
  title: string;
  rowIndex: number;
};

type SearchComponentProps = {
  csvFiles: CsvEntry[];
  onFileSelect: (entry: CsvEntry) => void;
  onAddResult: (result: SearchResult) => void | Promise<void>;
};

export default function SearchComponent({ csvFiles, onFileSelect, onAddResult }: SearchComponentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function performSearch() {
    console.log('performSearch wywołane z termem:', searchTerm);
    
    if (!searchTerm.trim()) {
      console.log('Pusty termin wyszukiwania');
      setSearchResults([]);
      return;
    }

    console.log('Rozpoczynam wyszukiwanie dla:', searchTerm.trim());
    console.log('Liczba plików CSV do przeszukania:', csvFiles.length);
    console.log('Pliki CSV:', csvFiles);

    setIsSearching(true);
    setError(null);
    const results: SearchResult[] = [];

    try {
      for (const csvFile of csvFiles) {
        if (!csvFile.fileHandle) {
          console.log(`Brak fileHandle dla pliku: ${csvFile.fileName}`);
          continue;
        }
        
        console.log(`Przetwarzam plik: ${csvFile.fileName}`);

        try {
          const csvData: CsvData = await readCsvFile(csvFile.fileHandle);
          
          // Debug: wypisz nagłówki do konsoli
          console.log(`Plik: ${csvFile.fileName}, Nagłówki:`, csvData.headers);
          
          // Znajdź indeks kolumny z tytułem (sprawdź różne warianty pisowni)
          const titleColumnIndex = csvData.headers.findIndex(header => {
            const lowerHeader = header.toLowerCase().trim();
            return lowerHeader.includes('tutuł') || 
                   lowerHeader.includes('tytul') || 
                   lowerHeader.includes('title') ||
                   lowerHeader.includes('tytuł') || // dodano ł
                   lowerHeader === 'tytuł' ||
                   lowerHeader === 'tytul' ||
                   lowerHeader === 'tutuł' ||
                   lowerHeader === 'title';
          });

          console.log(`Plik: ${csvFile.fileName}, Indeks kolumny tytułu: ${titleColumnIndex}`);
          
          if (titleColumnIndex === -1) {
            console.warn(`Nie znaleziono kolumny z tytułem w pliku: ${csvFile.fileName}`);
            continue; // Brak kolumny z tytułem
          }

          // Przeszukaj wszystkie wiersze w kolumnie tytułu
          csvData.rows.forEach((row, rowIndex) => {
            const title = row[titleColumnIndex] || '';
            if (title.toLowerCase().includes(searchTerm.toLowerCase())) {
              results.push({
                folderPath: csvFile.folderPath,
                fileName: csvFile.fileName,
                title: title,
                rowIndex: rowIndex
              });
            }
          });
        } catch (fileError) {
          console.warn(`Błąd odczytu pliku ${csvFile.fileName}:`, fileError);
          setError(`Błąd odczytu pliku ${csvFile.fileName}: ${fileError}`);
          // Kontynuuj z następnym plikiem
        }
      }

      console.log(`Wyszukiwanie zakończone. Znaleziono ${results.length} wyników dla frazy: "${searchTerm}"`);
      setSearchResults(results);
    } catch (err: any) {
      console.error('Błąd podczas wyszukiwania:', err);
      setError(`Błąd podczas wyszukiwania: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      performSearch();
    }
  }

  function handleResultClick(result: SearchResult) {
    // Znajdź odpowiedni CsvEntry i przekaż do rodzica
    const csvEntry = csvFiles.find(file => 
      file.folderPath === result.folderPath && 
      file.fileName === result.fileName
    );
    
    if (csvEntry) {
      onFileSelect(csvEntry);
    }
  }

  return (
    <div className="search-component">
      <div className="search-header">
        <h3>Wyszukiwanie w tytułach</h3>
        <div className="search-controls">
          <input
            type="text"
            placeholder="Wpisz frazę do wyszukania..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="search-input"
          />
          <button 
            onClick={performSearch} 
            disabled={isSearching || !searchTerm.trim()}
            className="search-button"
          >
            {isSearching ? 'Szukam...' : 'Szukaj'}
          </button>
        </div>
      </div>

      {error && (
        <div className="search-error" style={{ color: 'red', margin: '10px 0' }}>
          {error}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <strong>Znaleziono {searchResults.length} wyników:</strong>
          </div>
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Folder</th>
                  <th>Plik CSV</th>
                  <th>Tytuł</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((result, index) => (
                  <tr 
                    key={`${result.folderPath}-${result.fileName}-${result.rowIndex}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="result-row"
                  >
                    <td>{result.folderPath}</td>
                    <td>{result.fileName}</td>
                    <td title={result.title}>{result.title}</td>
                    <td className="actions-cell">
                      <button
                        className="add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddResult(result);
                        }}
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {searchTerm && !isSearching && searchResults.length === 0 && (
        <div className="no-results">
          <em>Nie znaleziono wyników dla: "{searchTerm}"</em>
        </div>
      )}
    </div>
  );
}