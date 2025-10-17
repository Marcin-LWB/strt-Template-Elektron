# 🏗️ Architecture - Technical Documentation

## Opis projektu

**Start Template** to szablon aplikacji Electron + React + TypeScript z podstawową funkcjonalnością przetwarzania plików Excel. Aplikacja działa zarówno w przeglądarce (File System Access API) jak i jako aplikacja desktopowa (Electron).

## 🔧 Stack technologiczny

### Frontend
- **React 19** - biblioteka UI
- **TypeScript** - język programowania
- **Vite 7** - build tool i dev server
- **CSS3** - stylowanie (bez framework'ów CSS)

### Backend/Desktop
- **Electron 33** - framework aplikacji desktopowej
- **Node.js** - runtime dla procesu głównego

### APIs i biblioteki
- **File System Access API** - dostęp do plików w przeglądarce
- **ExcelJS** - przetwarzanie plików Excel
- **Zustand** - zarządzanie stanem aplikacji
- **IndexedDB** - trwałe przechowywanie danych (przeglądarki)

### Narzędzia deweloperskie
- **ESLint** - linting kodu
- **TypeScript Compiler** - sprawdzanie typów

## 📁 Architektura aplikacji

### Główne komponenty React
```
AppNew.tsx - główny komponent aplikacji
├── 3-sekcyjny layout (app-header, workflow-panel, excel-data-table)
├── State management przez Zustand
└── Konfiguracja w CollapsiblePanel

WorkflowPanel.tsx - panel workflow
├── 4 sekcje: Excel + 3 template sekcje
├── Integracja z ExcelFilePicker
└── Szablon dla nowych funkcjonalności

ExcelFilePicker.tsx - wybór plików Excel
├── File System Access API (browser)
├── Electron IPC (desktop)
├── Rekurencyjne skanowanie folderów
└── Zarządzanie listą plików

ExcelDataTable.tsx - wyświetlanie danych
├── Tabela z dynamicznymi kolumnami
├── Export do Excel (ExcelJS)
├── Podstawowe operacje na danych
└── Loading states i error handling
```

### Electron Architecture
```
electron/main.js - główny proces Electron
├── Okno aplikacji
├── IPC handlers
└── Menu aplikacji

electron/preload.js - bridge IPC
├── Bezpieczny dostęp do Node.js APIs
├── File system operations
└── Excel processing APIs

electron/services/
├── fileService.js - operacje na plikach
└── excelService.js - przetwarzanie Excel
```

### State Management (Zustand)
```
store/appStore.ts
├── AppState interface
├── Excel data management
├── Loading states
├── Error handling
└── Persistence middleware
```
├── loadRootDirHandle() - odczyt z IndexedDB
└── clearRootDirHandle() - usuwanie z IndexedDB

types.ts
├── CsvEntry - typ dla wpisu CSV
├── DirHandle - alias FileSystemDirectoryHandle
└── FileHandle - alias FileSystemFileHandle
```

## 🎯 Kluczowe funkcjonalności

### 1. IPC Communication (Electron)

**Start Template** implementuje bezpieczną komunikację między procesami (IPC):

```typescript
// Renderer Process (React) → Preload → Main Process
// src/components/ExcelFilePicker.tsx
const handleFileSelect = async () => {
  const result = await window.api.selectDirectory();
  if (result.success) {
    console.log('Selected:', result.path);
  }
};
```

```javascript
// Preload Script - IPC Bridge
// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  scanFiles: (path) => ipcRenderer.invoke('files:scan', path),
  parseExcel: (filePath) => ipcRenderer.invoke('excel:parse', filePath),
});
```

```javascript
// Main Process - IPC Handlers
// electron/main.js
const { ipcMain, dialog } = require('electron');

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('excel:parse', async (event, filePath) => {
  return await excelService.parseFile(filePath);
});
```

**Bezpieczeństwo IPC:**
- ✅ `contextIsolation: true` - izolacja kontekstu
- ✅ `nodeIntegration: false` - brak Node.js w renderer
- ✅ Whitelist APIs przez `contextBridge`
- ✅ Walidacja danych w main process

### 2. File System Access API (Browser Mode)

```typescript
// Wybór folderu
const dir = await window.showDirectoryPicker();

// Iteracja po zawartości
for await (const [name, handle] of dir.entries()) {
  // Logika przetwarzania
}

// Zarządzanie uprawnieniami
const state = await dir.queryPermission({ mode: 'read' });
const req = await dir.requestPermission({ mode: 'read' });
```

### 3. IndexedDB Storage
```typescript
import { get, set, del } from 'idb-keyval';

// Zapis handle'a folderu (structured clone)
await set('root-dir-handle', handle);

// Odczyt handle'a
const handle = await get('root-dir-handle');
```

### 4. Rekurencyjne skanowanie
```typescript
async function walkDir(dir, relativePath, sink, recursive) {
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === 'file' && name.endsWith('.csv')) {
      sink.push({ folderPath: relativePath || '.', fileName: name });
    } else if (handle.kind === 'directory' && recursive) {
      await walkDir(handle, joinPath(relativePath, name), sink, recursive);
    }
  }
}
```

## ⚙️ Konfiguracja projektu

### package.json - kluczowe zależności
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "idb-keyval": "^6.x"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.x",
    "typescript": "^5.x",
    "vite": "^7.x"
  }
}
```

### tsconfig.json - konfiguracja TypeScript
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  }
}
```

## 🚀 Deployment i uruchomienie

### Development
```bash
npm install
npm run dev
# Serwer: http://localhost:5173
```

### Production Build
```bash
npm run build
npm run preview
# Statyczne pliki w folderze dist/
```

### Wymagania środowiska
- **Node.js**: 20.19+ lub 22.12+
- **Przeglądarka**: Chrome 86+, Edge 86+ (desktop)
- **HTTPS**: wymagane dla File System Access API (localhost wyjątek)

## 🔒 Bezpieczeństwo i uprawnienia

### Electron Security
- **contextIsolation: ON** - renderer nie ma dostępu do Node.js APIs
- **nodeIntegration: OFF** - wyłączona integracja Node.js w renderer
- **Preload Script** - jedyny pomost między renderer a main
- **IPC Whitelist** - tylko określone funkcje są eksponowane

### File System Access API
- Wymaga gestów użytkownika (kliknięcie przycisku)
- Przeglądarka pokazuje natywny dialog wyboru
- Handle'y są zapisywane w IndexedDB per-origin
- Uprawnienia mogą być cofnięte przez użytkownika

### Best Practices
- ✅ Validate all IPC inputs in main process
- ✅ Sanitize file paths before operations
- ✅ Use CSP (Content Security Policy) headers
- ✅ Keep Electron and dependencies updated

### Ograniczenia
- File System Access API: tylko przeglądarki desktop (Chrome/Edge)
- Brak dostępu do plików systemowych bez uprawnień
- Wymaga ponownego udzielenia uprawnień po restart

## 🐛 Znane problemy i rozwiązania

### Problem: Node.js version mismatch
```
Vite requires Node.js version 20.19+ or 22.12+
```
**Rozwiązanie**: Upgrade Node.js lub użyj starszej wersji Vite

### Problem: File System Access API niedostępne
```
window.showDirectoryPicker is not a function
```
**Rozwiązanie**: Użyj Chrome/Edge desktop, sprawdź HTTPS

### Problem: Permission denied after refresh
```
Permission state: 'prompt' or 'denied'
```
**Rozwiązanie**: Automatyczne ponowne zapytanie o uprawnienia

## 📊 Metryki wydajności

### Pamięć
- Aplikacja React: ~2-5MB RAM
- IndexedDB storage: ~1KB per handle
- File handles: Lightweight references

### Wydajność skanowania
- ~1000 plików/folder per sekundę
- Rekurencyjne skanowanie: zależne od głębokości
- UI pozostaje responsywne (async/await)

## 🔮 Możliwe rozszerzenia szablonu

### Funkcjonalności Excel
1. **Advanced filtering** - filtrowanie po kolumnach, wartościach
2. **Data validation** - walidacja danych przed zapisem
3. **Chart generation** - generowanie wykresów z danych
4. **Export formats** - PDF, CSV, JSON export
5. **Real-time collaboration** - wspólna edycja plików

### UI/UX
1. **Dark mode** - tryb ciemny
2. **Themes** - konfigurowalne motywy
3. **Drag & drop** - przeciąganie plików
4. **Virtual scrolling** - duże zestawy danych
5. **Advanced search** - zaawansowana filtrowanie

### Techniczne
1. **Database integration** - SQLite, PostgreSQL
2. **API integration** - REST, GraphQL
3. **File watchers** - auto-refresh przy zmianach
4. **Plugin system** - rozszerzenia zewnętrzne
5. **Auto-updates** - automatyczne aktualizacje Electron

---

## 📋 Checklist dla developers

### Przed rozpoczęciem pracy:
- [ ] Node.js 20.19+ zainstalowany
- [ ] Chrome/Edge desktop dostępny
- [ ] Struktura testowych folderów CSV przygotowana
- [ ] VSCode z TypeScript extension

### Podczas developmentu:
- [ ] Testuj w Chrome i Edge
- [ ] Sprawdź działanie offline (IndexedDB)
- [ ] Przetestuj różne struktury folderów
- [ ] Sprawdź obsługę błędów uprawnień
- [ ] Zweryfikuj TypeScript errors

### Przed commitem:
- [ ] `npm run build` przechodzi bez ostrzeżeń
- [ ] ESLint errors naprawione
- [ ] Nowe funkcje udokumentowane
- [ ] README.md zaktualizowany