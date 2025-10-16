# 🤖 Agents.md - Kluczowe informacje techniczne

## Opis projektu

**CSV Browser** to aplikacja React + TypeScript wykorzystująca File System Access API do lokalnego przeglądania plików CSV w strukturze folderów. Aplikacja działa całkowicie w przeglądarce bez potrzeby backendu.

## 🔧 Stack technologiczny

### Frontend
- **React 18** - biblioteka UI
- **TypeScript** - język programowania
- **Vite 7** - build tool i dev server
- **CSS3** - stylowanie (bez framework'ów CSS)

### APIs i biblioteki
- **File System Access API** - dostęp do lokalnych plików
- **IndexedDB** - trwałe przechowywanie danych
- **idb-keyval** - wrapper dla IndexedDB

### Narzędzia deweloperskie
- **ESLint** - linting kodu
- **TypeScript Compiler** - sprawdzanie typów

## 📁 Architektura aplikacji

### Komponenty React
```
App.tsx - główny komponent z logiką biznesową
├── useState hooks:
│   ├── status: 'idle' | 'loading' | 'ready' | 'error'
│   ├── rootDir: FileSystemDirectoryHandle | null
│   ├── rows: CsvEntry[]
│   ├── error: string | null
│   └── recursive: boolean
└── Functions:
    ├── pickRootFolder() - wybór folderu głównego
    ├── rescan() - skanowanie folderów
    └── forgetFolder() - czyszczenie danych
```

### Moduły utility
```
fs-utils.ts
├── listCsvFiles() - rekurencyjne skanowanie CSV
├── walkDir() - pomocnicza funkcja traversal
├── joinPath() - łączenie ścieżek
└── ensureReadPermission() - zarządzanie uprawnieniami

lib/storage.ts
├── saveRootDirHandle() - zapis do IndexedDB
├── loadRootDirHandle() - odczyt z IndexedDB
└── clearRootDirHandle() - usuwanie z IndexedDB

types.ts
├── CsvEntry - typ dla wpisu CSV
├── DirHandle - alias FileSystemDirectoryHandle
└── FileHandle - alias FileSystemFileHandle
```

## 🎯 Kluczowe funkcjonalności

### 1. File System Access API
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

### 2. IndexedDB Storage
```typescript
import { get, set, del } from 'idb-keyval';

// Zapis handle'a folderu (structured clone)
await set('root-dir-handle', handle);

// Odczyt handle'a
const handle = await get('root-dir-handle');
```

### 3. Rekurencyjne skanowanie
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

### File System Access API
- Wymaga gestów użytkownika (kliknięcie przycisku)
- Przeglądarka pokazuje natywny dialog wyboru
- Handle'y są zapisywane w IndexedDB per-origin
- Uprawnienia mogą być cofnięte przez użytkownika

### Ograniczenia
- Tylko przeglądarki desktop (Chrome/Edge)
- Brak dostępu do plików systemowych
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

## 🔮 Możliwe rozszerzenia

### Funkcjonalności
1. **CSV parsing** - PapaParse integration
2. **File editing** - createWritable() API
3. **Search/filter** - client-side filtering
4. **Export** - download lists as JSON/CSV
5. **Auto-refresh** - FileSystemWatcher (gdy dostępne)

### Techniczne
1. **PWA** - Service Worker + manifest
2. **Web Workers** - heavy scanning operations
3. **Virtual scrolling** - large file lists
4. **Drag & drop** - alternative folder selection

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