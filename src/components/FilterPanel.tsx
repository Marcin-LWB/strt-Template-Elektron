import { useState, useMemo } from 'react';
import './FilterPanel.css';
import type { ExcelData } from '../types/excel.types';

/**
 * Panel filtrowania z tagami folderów i wyszukiwaniem
 * Iteration 2: Zaawansowana prezentacja danych
 */

interface FilterPanelProps {
  rows: Array<{ rowIndex: number; columns: Record<string, any>; rowColor?: string }>;
  onFilterChange: (filteredRows: Array<{ rowIndex: number; columns: Record<string, any>; rowColor?: string }>) => void;
  loadedData?: ExcelData | null;
}

export default function FilterPanel({ rows, onFilterChange, loadedData }: FilterPanelProps) {
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [searchFileNumber, setSearchFileNumber] = useState('');
  const [searchFileTitle, setSearchFileTitle] = useState('');
  const [showTags, setShowTags] = useState(true);
  const [showAdditional, setShowAdditional] = useState(false);
  const [showOnlyExistIssues, setShowOnlyExistIssues] = useState(false);

  // Statystyki Exist
  const existStats = useMemo(() => {
    let nieCount = 0;
    let emptyCount = 0;
    let takCount = 0;
    
    rows.forEach(row => {
      const raw = row.columns['Exist'];
      const existStr = raw === undefined || raw === null ? '' : String(raw).trim();
      const existNorm = existStr.toUpperCase();

      // Count as NIE when the normalized text contains NIE (handles emojis like '❌ NIE')
      if (/NIE/.test(existNorm)) {
        nieCount++;
      } else if (/TAK/.test(existNorm) || existNorm.includes('\u2714') || existNorm.includes('\u2705') || existNorm.includes('\u2713')) {
        // Handle different check mark symbols: ✔ (2714), ✅ (2705), ✓ (2713)
        takCount++;
      } else if (existStr === '' || existStr === null || existStr === undefined) {
        emptyCount++;
      }
    });
    
    return { nieCount, emptyCount, takCount, total: nieCount + emptyCount + takCount };
  }, [rows]);

  // Ekstrakcja unikalnych wartości z kolumny Folder
  const folderTags = useMemo(() => {
    const tags = new Set<string>();
    rows.forEach(row => {
      const folder = row.columns['Folder'];
      if (folder && typeof folder === 'string' && folder.trim() !== '') {
        tags.add(folder.trim());
      }
    });
    return Array.from(tags).sort((a, b) => {
      // Sortuj hierarchicznie: Tom 1, Tom 1/Tom 1.1, Tom 2, etc.
      const aParts = a.split('/').map(part => {
        const match = part.match(/Tom\s+(\d+(?:\.\d+)*)/i);
        return match ? match[1].split('.').map(Number) : [0];
      });
      const bParts = b.split('/').map(part => {
        const match = part.match(/Tom\s+(\d+(?:\.\d+)*)/i);
        return match ? match[1].split('.').map(Number) : [0];
      });
      
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aNum = aParts[i] || [0];
        const bNum = bParts[i] || [0];
        for (let j = 0; j < Math.max(aNum.length, bNum.length); j++) {
          const diff = (aNum[j] || 0) - (bNum[j] || 0);
          if (diff !== 0) return diff;
        }
      }
      return 0;
    });
  }, [rows]);

  // Funkcja określająca kolor tagu na podstawie głębokości (liczby '/')
  const getTagColor = (tag: string): string => {
    const depth = (tag.match(/\//g) || []).length;
    const colors = [
      '#3b82f6', // Tom 1 - niebieski
      '#10b981', // Tom 1/Tom 1.1 - zielony
      '#f59e0b', // Tom 1/Tom 1.1/Tom 1.1.1 - pomarańczowy
      '#ef4444', // Tom 1/Tom 1.1/Tom 1.1.1/... - czerwony
      '#8b5cf6', // Głębsze poziomy - fioletowy
    ];
    return colors[Math.min(depth, colors.length - 1)];
  };

  // Toggle tag aktywny/nieaktywny
  const toggleTag = (tag: string) => {
    const newTags = new Set(activeTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setActiveTags(newTags);
  };

  // Reset wszystkich filtrów - używamy przekazanej funkcji

  // Aplikuj filtry
  useMemo(() => {
    let filtered = rows;

    // Filtrowanie po tagach
    if (activeTags.size > 0) {
      filtered = filtered.filter(row => {
        const folder = row.columns['Folder'];
        return folder && activeTags.has(folder.trim());
      });
    }

    // Filtrowanie po FILE NUMBER
    if (searchFileNumber.trim() !== '') {
      const search = searchFileNumber.toLowerCase();
      filtered = filtered.filter(row => {
        const fileNumber = row.columns['FILE NUMBER'];
        return fileNumber && String(fileNumber).toLowerCase().includes(search);
      });
    }

    // Filtrowanie po FILE TITLE (PL)
    if (searchFileTitle.trim() !== '') {
      const search = searchFileTitle.toLowerCase();
      filtered = filtered.filter(row => {
        const fileTitle = row.columns['FILE TITLE (PL)'];
        return fileTitle && String(fileTitle).toLowerCase().includes(search);
      });
    }
    if (showOnlyExistIssues) {
      filtered = filtered.filter(row => {
        const raw = row.columns['Exist'];
        const existStr = raw === undefined || raw === null ? '' : String(raw).trim();
        const existNorm = existStr.toUpperCase();

        return /NIE/.test(existNorm) || existStr === '' || existStr === null || existStr === undefined;
      });
    }

    onFilterChange(filtered);
  }, [rows, activeTags, searchFileNumber, searchFileTitle, showOnlyExistIssues, onFilterChange]);

  return (
    <div className="filter-panel">
      {/* Panel tagów folderów */}
      <div className="filter-section">
        <div 
          className="filter-section-header"
          onClick={() => setShowTags(!showTags)}
        >
          <h3>
            {showTags ? '▼' : '▶'} 🏷️ Filtry folderów ({folderTags.length} tagów)
          </h3>
          {activeTags.size > 0 && (
            <span className="filter-badge">{activeTags.size} aktywnych</span>
          )}
        </div>
        
        {showTags && (
          <div className="filter-section-content">
            <div className="tag-container">
              {folderTags.map(tag => {
                const isActive = activeTags.has(tag);
                const color = getTagColor(tag);
                return (
                  <button
                    key={tag}
                    className={`tag-button ${isActive ? 'active' : ''}`}
                    style={{
                      borderColor: color,
                      backgroundColor: isActive ? color : 'transparent',
                      color: isActive ? 'white' : color,
                    }}
                    onClick={() => toggleTag(tag)}
                    title={`Kliknij aby ${isActive ? 'wyłączyć' : 'włączyć'} filtr: ${tag}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Filtr Exist - przeniesiony do sekcji Filtry folderów */}
            <div className="exist-filter-in-folders">
              <label className="exist-filter-label">
                <input
                  type="checkbox"
                  checked={showOnlyExistIssues}
                  onChange={(e) => setShowOnlyExistIssues(e.target.checked)}
                  className="exist-checkbox"
                />
                <span className="exist-label-text">
                  ⚠️ Pokaż tylko: <strong>Exist = NIE</strong> lub <strong>puste</strong>
                </span>
              </label>
              <div className="exist-stats">
                <span className="stat-item stat-nie">❌ NIE: <strong>{existStats.nieCount}</strong></span>
                <span className="stat-separator">•</span>
                <span className="stat-item stat-tak">✅ TAK: <strong>{existStats.takCount}</strong></span>
                <span className="stat-separator">•</span>
                <span className="stat-item stat-empty">⭕ Puste: <strong>{existStats.emptyCount}</strong></span>
                <span className="stat-separator">•</span>
                <span className="stat-item stat-total">📊 Razem: <strong>{existStats.total}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtr Exist - NIE lub puste - PRZENIESIONY DO FILTRÓW FOLDERÓW */}

      {/* Panel dodatkowe - wyszukiwanie + pliki źródłowe */}
      <div className="filter-section">
        <div 
          className="filter-section-header"
          onClick={() => setShowAdditional(!showAdditional)}
        >
          <h3>
            {showAdditional ? '▼' : '▶'} � Dodatkowe
          </h3>
          {(searchFileNumber || searchFileTitle) && (
            <span className="filter-badge">wyszukiwanie aktywne</span>
          )}
        </div>
        
        {showAdditional && (
          <div className="filter-section-content">
            {/* Wyszukiwanie - obok siebie */}
            <div className="search-row">
              <div className="search-field-inline">
                <label htmlFor="search-file-number">
                  📄 FILE NUMBER
                </label>
                <input
                  id="search-file-number"
                  type="text"
                  value={searchFileNumber}
                  onChange={(e) => setSearchFileNumber(e.target.value)}
                  placeholder="Wpisz numer pliku..."
                  className="search-input"
                />
              </div>
              
              <div className="search-field-inline">
                <label htmlFor="search-file-title">
                  📝 FILE TITLE (PL)
                </label>
                <input
                  id="search-file-title"
                  type="text"
                  value={searchFileTitle}
                  onChange={(e) => setSearchFileTitle(e.target.value)}
                  placeholder="Wpisz tytuł pliku..."
                  className="search-input"
                />
              </div>
            </div>

            {/* Informacja o plikach źródłowych */}
            {loadedData && loadedData.sourceFiles && loadedData.sourceFiles.length > 0 && (
              <div className="source-files-info">
                <h4>📁 Źródłowe pliki ({loadedData.sourceFiles.length})</h4>
                <ul>
                  {loadedData.sourceFiles.map((file, i) => (
                    <li key={i}>
                      <strong>{file.fileName}</strong>
                      {file.sheetName && <span> - Arkusz: {file.sheetName}</span>}
                      {file.rowCount !== undefined && <span> ({file.rowCount} wierszy)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Przycisk Reset - PRZENIESIONY DO GÓRY TABELI */}
    </div>
  );
}
