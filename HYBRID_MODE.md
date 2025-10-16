# 🔄 Hybrydowy Tryb - File System Access API

## 📋 Przegląd

Aplikacja obsługuje teraz **hybrydowy tryb** umożliwiający pracę zarówno w Electron jak i przeglądarce. W trybie przeglądarki używa **File System Access API** do dostępu do plików lokalnych.

### ✅ Zrealizowane funkcje

1. **Automatyczne wykrywanie środowiska** - sprawdza dostępność Electron API
2. **File System Access API** - dostęp do plików w Chrome/Edge bez Electron
3. **IndexedDB persistence** - zapisuje wybrane foldery między sesjami
4. **Hybrydowe ładowanie Excel** - ExcelJS działa identycznie w obu środowiskach
5. **Informacyjny komunikat** - zamiast błędu pokazuje tryb pracy

---

## 🔧 Jak to działa

### Detekcja środowiska
```typescript
const isElectron = typeof window !== 'undefined' && window.electronAPI;
const hasFileSystemAccess = 'showDirectoryPicker' in window;
```

### Hybrydowy wybór folderu
```typescript
if (isElectron) {
  // Electron: używa dialogu systemu
  const dir = await window.electronAPI.selectXlsxDirectory();
} else if (hasFileSystemAccess) {
  // Browser: używa File System Access API
  const dirHandle = await window.showDirectoryPicker();
}
```

### Hybrydowe ładowanie danych
```typescript
if (isElectron) {
  // IPC do Electron
  const result = await window.electronAPI.loadMultipleExcelFiles(filePaths, config);
} else {
  // File System Access API
  const result = await readMultipleExcelFiles(fileHandles, config);
}
```

---

## 🌐 Obsługiwane przeglądarki

### ✅ Pełna obsługa
- **Chrome 86+**
- **Edge 86+**
- **Opera 72+**

### ❌ Brak obsługi
- **Firefox** (brak File System Access API)
- **Safari** (brak File System Access API)
- **Starsze wersje Chrome/Edge**

### 💡 Komunikat dla nieobsługiwanych przeglądarek
```
Twoja przeglądarka nie obsługuje File System Access API.
Użyj Chrome/Edge lub uruchom aplikację w Electron.
```

---

## 📁 File System Access API

### Wybór folderu
```javascript
const dirHandle = await window.showDirectoryPicker();
// Zwraca: FileSystemDirectoryHandle
```

### Skanowanie plików
```javascript
// @ts-ignore - async iterator
for await (const [name, handle] of dirHandle.entries()) {
  if (handle.kind === 'file' && name.endsWith('.xlsx')) {
    // Znaleziono plik Excel
  }
}
```

### Odczyt pliku
```javascript
const file = await fileHandle.getFile();
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(await file.arrayBuffer());
```

---

## 💾 Persistence w przeglądarce

### IndexedDB Storage
```typescript
// Zapisanie wybranego folderu
await saveRootDirHandle(dirHandle);

// Odczytanie przy następnym uruchomieniu
const savedDir = await loadRootDirHandle();
```

### Automatyczne wczytywanie
Przy starcie aplikacji automatycznie:
1. Sprawdza IndexedDB
2. Jeśli znajdzie zapisany folder → automatycznie skanuje pliki
3. Przywraca poprzedni wybór użytkownika

---

## 🔄 Hybrydowe komponenty

### ExcelFilePicker
- **Electron**: `window.electronAPI.scanXlsxFiles()`
- **Browser**: `scanDirectoryForExcel(dirHandle, recursive)`

### ExcelDataTable
- **Electron**: `window.electronAPI.loadMultipleExcelFiles()`
- **Browser**: `readMultipleExcelFiles(fileHandles, config)`

### Komunikaty
- **Electron**: `✅ Electron Mode`
- **Browser**: `ℹ️ Tryb przeglądarki - używam File System Access API`

---

## 🧪 Testowanie hybrydowego trybu

### W przeglądarce
```bash
npm run dev
# Otwórz: http://localhost:5175
```

**Test flow:**
1. Kliknij "📂 Pliki Excel"
2. Wybierz folder w modalu
3. Zaznacz pliki checkboxami
4. Kliknij "✓ Gotowe"
5. Załaduj dane przyciskiem "📥 Załaduj wybrane pliki"

### W Electron
```bash
npm run electron:dev
```

**Test flow:**
1. Wszystko działa tak samo jak wcześniej
2. Pokazuje komunikat "✅ Electron Mode"

---

## ⚠️ Ograniczenia przeglądarki

### Bezpieczeństwo
- **Jednorazowa zgoda** - użytkownik musi za każdym razem zezwolić na dostęp
- **Brak dostępu systemowego** - tylko wybrane foldery
- **Sandbox** - pliki są read-only w przeglądarce

### Wydajność
- **Większy bundle** - ExcelJS + File System API (~1.1MB vs 200KB)
- **Brak cache** - pliki ładowane za każdym razem
- **Memory limit** - duże pliki mogą powodować problemy

### Funkcjonalność
- **Brak operacji na plikach** - tylko odczyt Excel
- **Brak logowania do pliku** - logi tylko w konsoli
- **Ograniczona nawigacja** - tylko wybrany folder

---

## 🔧 Konfiguracja

### Dla deweloperów
```typescript
// Wymuszenie trybu przeglądarki (testowanie)
delete (window as any).electronAPI;

// Wymuszenie trybu Electron
(window as any).electronAPI = { /* mock */ };
```

### Build
```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "electron:dev": "electron .",
    "build": "tsc -b && vite build"
  }
}
```

---

## 🐛 Rozwiązywanie problemów

### "Twoja przeglądarka nie obsługuje File System Access API"
**Przyczyna:** Firefox, Safari lub stara wersja Chrome/Edge
**Rozwiązanie:** Użyj Chrome 86+ lub Edge 86+

### "Brak dostępu do plików"
**Przyczyna:** Użytkownik odmówił zgody lub zamknął dialog
**Rozwiązanie:** Odśwież stronę i spróbuj ponownie

### "Error scanning directory"
**Przyczyna:** Problem z uprawnieniami lub strukturą folderów
**Rozwiązanie:** Sprawdź konsolę przeglądarki po szczegóły

### Duże pliki nie ładują się
**Przyczyna:** Limit pamięci przeglądarki
**Rozwiązanie:** Podziel dane na mniejsze pliki lub użyj Electron

---

## 📊 Metryki

### Bundle size
```
dist/index.html                     0.47 kB │ gzip:  0.31 kB
dist/assets/index-DTtKmMkb.css     11.15 kB │ gzip:  2.86 kB
dist/assets/index-X74LWhGB.js   1,149.95 kB │ gzip: 337.42 kB
✓ built in 2.28s
```

### Kompatybilność
- ✅ **Electron**: Wszystkie funkcje
- ✅ **Chrome/Edge**: Excel ładowanie, File System Access
- ⚠️ **Firefox/Safari**: Tylko Electron

### Wydajność
- **Electron**: Natywna prędkość systemu plików
- **Browser**: ~2-3x wolniejsze ładowanie (ArrayBuffer processing)

---

## 🔮 Przyszłe rozszerzenia

### Krótkoterminowe
- [ ] Drag & drop plików do przeglądarki
- [ ] Zapisywanie presetów w localStorage
- [ ] Progress bar dla ładowania dużych plików

### Średnioterminowe
- [ ] Web Workers dla przetwarzania Excel
- [ ] Service Worker cache dla plików
- [ ] Origin Private File System API (fallback)

### Długoterminowe
- [ ] PWA z persistent storage
- [ ] WebAssembly Excel parser (szybszy)
- [ ] Cloud integration (Google Drive, OneDrive)

---

## ✅ Checklist

### Przed releasem
- [x] Build przechodzi bez błędów
- [x] TypeScript kompiluje się
- [x] Dev server działa
- [x] Testowane w Chrome i Electron
- [x] Dokumentacja zaktualizowana

### Test cases
- [x] Electron mode - pełne funkcje
- [x] Browser mode - podstawowe funkcje
- [x] Persistence między sesjami
- [x] Error handling
- [x] UI feedback

---

**Data aktualizacji:** 2025-10-06  
**Wersja:** 1.0.0 Hybrid Mode  
**Status:** ✅ Production Ready
