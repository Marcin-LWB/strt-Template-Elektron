# ❓ FAQ - Często Zadawane Pytania

## 🎯 Ogólne

### Czym jest Start Template?

Start Template to w pełni skonfigurowany szablon aplikacji desktopowej łączący Electron 33, React 19, TypeScript i Vite 7. Zawiera gotową infrastrukturę do pracy z plikami Excel i File System Access API.

### Dla kogo jest ten szablon?

- Developerzy rozpoczynający nowy projekt Electron
- Teams potrzebujący solidnego foundation dla aplikacji desktop
- Projekty wymagające obsługi Excel/CSV
- Każdy kto chce zaoszczędzić czas na konfiguracji

### Czy mogę używać tego komercyjnie?

Tak! Szablon jest open-source i możesz go używać w projektach komercyjnych bez ograniczeń.

---

## 🚀 Installation & Setup

### Jakie są wymagania systemowe?

- **Node.js** 20.19+ lub 22.12+
- **npm** 10+
- **System:** Windows / macOS / Linux
- **Przeglądarka (dev):** Chrome 86+ lub Edge 86+

### Dlaczego `npm start` nie działa?

`npm start` wymaga zainstalowania zależności:

```bash
npm install
npm start
```

Jeśli problem persystuje, sprawdź:
1. Wersję Node.js: `node --version`
2. Czy port 5173 nie jest zajęty
3. Logi w terminalu

### Czy muszę używać npm? Co z yarn/pnpm?

Szablon jest testowany z npm, ale powinien działać z yarn/pnpm:

```bash
# Yarn
yarn install
yarn start

# pnpm
pnpm install
pnpm start
```

---

## 💻 Development

### Jaka jest różnica między `npm run dev` a `npm start`?

| Komenda | Co robi |
|---------|---------|
| `npm run dev` | Tylko Vite dev server (browser mode) |
| `npm start` | Vite + Electron jednocześnie (rekomendowane) |
| `npm run electron:dev` | Tylko Electron (wymaga działającego Vite) |

**Rekomendacja:** Używaj `npm start` - automatycznie wszystko konfiguruje!

### Czy mogę pracować tylko w przeglądarce?

Tak! Uruchom `npm run dev` i otwórz `http://localhost:5173`.

**Browser mode wspiera:**
- ✅ File System Access API (Chrome/Edge)
- ✅ IndexedDB
- ✅ Wszystkie funkcje React/UI
- ❌ IPC Channels (tylko w Electron)

### Dlaczego HMR (Hot Reload) nie działa?

**W Browser mode:** HMR powinno działać out-of-the-box.

**W Electron mode:** Electron wymaga restartu przy zmianach w `electron/` folderze. Zmiany w `src/` są hot-reloadowane.

**Fix:**
- Upewnij się że Vite działa (`npm run dev`)
- Sprawdź console dla błędów
- Restart `npm start`

### Jak dodać nowe zależności?

```bash
# Runtime dependencies
npm install some-package

# Dev dependencies
npm install --save-dev some-dev-package

# Rebuild electron-builder po dodaniu native modules
npm run build-electron
```

---

## 🔧 Electron Specific

### Jak działa IPC w tym szablonie?

Start Template używa 3-warstwowej architektury:

```
Renderer (React) → Preload (Bridge) → Main (Node.js)
```

Szczegóły: [IPC-GUIDE.md](./IPC-GUIDE.md)

### Jak dodać nowy IPC channel?

1. **Dodaj typ** w `src/types/electron.d.ts`
2. **Eksponuj w preload** `electron/preload.js`
3. **Handler w main** `electron/main.js`
4. **Użyj w komponencie** przez `window.api.yourFunction()`

Pełna instrukcja: [IPC-GUIDE.md - Jak dodać nowy channel](./IPC-GUIDE.md#-jak-dodać-nowy-channel)

### Dlaczego `require is not defined` w komponencie React?

To zamierzone! **contextIsolation** blokuje dostęp do Node.js w renderer process ze względów bezpieczeństwa.

**Rozwiązanie:** Użyj IPC do komunikacji z main process.

```typescript
// ❌ NIE DZIAŁA (security)
const fs = require('fs');

// ✅ DZIAŁA (przez IPC)
const result = await window.api.readFile(path);
```

### Czy mogę wyłączyć contextIsolation?

**NIE!** To podstawowa zasada bezpieczeństwa Electron.

Z [Electron Security Guide](https://www.electronjs.org/docs/latest/tutorial/security):
> Never set contextIsolation to false

Zamiast tego używaj IPC przez preload script.

---

## 📊 Excel & File System

### Jakie formaty plików są wspierane?

- ✅ `.xlsx` (Excel)
- ✅ `.csv` (Comma Separated Values)
- ⚠️ `.xls` (stary format Excel) - częściowe wsparcie przez ExcelJS

### Jak duże pliki mogę przetwarzać?

**Browser mode:** ~50MB (limit pamięci przeglądarki)
**Electron mode:** Zależy od RAM (~500MB+ możliwe)

Dla większych plików rozważ streaming lub chunking.

### File System Access API vs Electron File System?

| Feature | File System Access API | Electron fs |
|---------|------------------------|-------------|
| Środowisko | Browser (Chrome/Edge) | Electron only |
| Uprawnienia | User dialog | Direct access |
| Performance | Wolniejsze | Szybsze |
| Rekursja | Obsługiwana | Obsługiwana |
| Streaming | Ograniczone | Pełne wsparcie |

**Rekomendacja:** Rozwijaj z File System Access API (szybsze), finalne testy w Electron.

### Dlaczego `showDirectoryPicker()` nie działa?

1. **Browser:** Wymaga Chrome/Edge 86+ desktop
2. **HTTPS:** Wymagane (localhost jest wyjątkiem)
3. **User gesture:** Musi być wywołane z click handler
4. **Uprawnienia:** User musi zaakceptować dialog

```typescript
// ✅ POPRAWNIE
<button onClick={async () => {
  const dir = await window.showDirectoryPicker();
}}>Select</button>

// ❌ ŹLE (no user gesture)
useEffect(() => {
  window.showDirectoryPicker(); // Nie zadziała!
}, []);
```

---

## 🏗️ Building & Distribution

### Jak zbudować aplikację?

```bash
# Build React
npm run build

# Build Electron (Installer + Portable)
npm run build-electron

# Tylko portable
npm run dist:portable

# Tylko folder (bez pakowania)
npm run dist:dir
```

### Gdzie są pliki po buildzie?

- **React build:** `dist/` folder
- **Electron build:** `dist-electron/` folder
  - `Start Template Setup 1.0.0.exe` - Installer
  - `Start Template-1.0.0-portable.exe` - Portable
  - `win-unpacked/` - Rozpakowana wersja (debug)

### Dlaczego build jest taki duży (~83MB)?

To normalne dla aplikacji Electron:
- **Chromium engine:** ~60MB
- **Node.js runtime:** ~15MB
- **Twój kod + dependencies:** ~8MB

**Optymalizacje:**
- Code splitting (Vite)
- Tree shaking (automatyczne)
- Remove unused dependencies
- Użyj asar archiwum (domyślnie włączone)

### Jak zmienić ikonę aplikacji?

1. Stwórz `build/icon.ico` (256x256 px)
2. W `package.json`:

```json
{
  "build": {
    "win": {
      "icon": "build/icon.ico"
    }
  }
}
```

3. Rebuild: `npm run build-electron`

### Jak zmienić nazwę aplikacji?

W `package.json`:

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "build": {
    "appId": "com.mycompany.myapp",
    "productName": "My Awesome App"
  }
}
```

---

## 🐛 Troubleshooting

### `npm start` crashes po kilku sekundach

**Możliwe przyczyny:**
1. Port 5173 zajęty
2. Electron crash (sprawdź logi)
3. Vite nie zdążył wystartować

**Fix:**
```bash
# Sprawdź czy Vite jest gotowy
npm run dev
# Poczekaj na "ready in X ms"
# Dopiero teraz:
npm run electron:dev
```

### TypeScript pokazuje błędy ale app działa

To tylko linting issues. Fix:

```bash
# Sprawdź wszystkie błędy
npx tsc --noEmit

# Update typings
npm install --save-dev @types/node @types/react
```

### "Cannot find module 'exceljs'"

```bash
# Reinstalacja
npm install exceljs

# Pełna reinstalacja
rm -rf node_modules package-lock.json
npm install
```

### Build fails z "ENOENT" error

```bash
# Wyczyść poprzednie buildy
rm -rf dist dist-electron

# Sprawdź uprawnienia folderu
# Windows: Uruchom terminal jako Administrator

npm run build-electron
```

### Aplikacja nie startuje po instalacji

1. **Sprawdź logi:** `%APPDATA%\Start Template\logs\`
2. **Antivirus:** Dodaj wyjątek dla `.exe`
3. **Uprawnienia:** Instaluj w folderze z prawami zapisu
4. **Windows Defender:** Czasem blokuje nowe `.exe`

---

## 🔒 Security

### Czy ten szablon jest bezpieczny?

Tak! Implementujemy best practices Electron:
- ✅ `contextIsolation: true`
- ✅ `nodeIntegration: false`
- ✅ Preload whitelist APIs
- ✅ Input validation w IPC handlers
- ✅ No `eval()` or dynamic code execution

### Jak mogę zwiększyć bezpieczeństwo?

1. **CSP Headers** - Content Security Policy
2. **Validate ALL inputs** w IPC handlers
3. **Keep dependencies updated** - `npm audit`
4. **Sanitize file paths** - zapobiegnij path traversal
5. **Use HTTPS** dla zewnętrznych API

Więcej: [ARCHITECTURE.md - Bezpieczeństwo](./ARCHITECTURE.md#-bezpieczeństwo-i-uprawnienia)

### Czy mogę używać `dangerouslySetInnerHTML`?

**Unikaj jeśli możliwe!** Jest to źródło XSS vulnerabilities.

Jeśli musisz:
- Sanitize HTML przez `DOMPurify`
- Nigdy nie renderuj user input bez sanitization
- Używaj tylko dla zaufanych źródeł

---

## 📚 Learning Resources

### Gdzie mogę nauczyć się więcej o Electron?

- [Electron Official Docs](https://www.electronjs.org/docs/latest/)
- [Electron Security Guide](https://www.electronjs.org/docs/latest/tutorial/security)
- [IPC Communication](https://www.electronjs.org/docs/latest/tutorial/ipc)

### Materiały o React 19?

- [React Official Docs](https://react.dev/)
- [React Beta Docs (19)](https://react.dev/blog/2024/12/05/react-19)

### TypeScript resources?

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React + TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

## 🎨 Customization

### Jak dodać dark mode?

1. Dodaj theme do Zustand store:

```typescript
// src/store/appStore.ts
interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}
```

2. Conditional CSS classes:

```typescript
// src/App.tsx
const { theme } = useAppStore();
return <div className={`app ${theme}`}>...</div>;
```

3. CSS variables:

```css
/* src/index.css */
.app.dark {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
}
```

### Jak dodać więcej języków (i18n)?

Użyj `react-i18next`:

```bash
npm install i18next react-i18next
```

Setup: Zobacz [i18next documentation](https://react.i18next.com/)

### Jak dodać routing (multi-page)?

```bash
npm install react-router-dom
```

```typescript
// src/main.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
  </Routes>
</BrowserRouter>
```

---

## 🤝 Contributing

### Jak mogę pomóc w rozwoju?

1. **Report bugs** - GitHub Issues
2. **Suggest features** - GitHub Discussions
3. **Submit PRs** - z testami i dokumentacją
4. **Improve docs** - zawsze mile widziane!

### Znalazłem bug. Co dalej?

1. Sprawdź [GitHub Issues](https://github.com/Marcin-LWB/strt-Template-Elektron/issues)
2. Jeśli nie istnieje - stwórz nowy issue z:
   - Opisem problemu
   - Krokami do reprodukcji
   - Środowisko (OS, Node version)
   - Screenshots jeśli applicable

---

## ❓ Dalsze pytania?

**Nie znalazłeś odpowiedzi?**

- 📖 Sprawdź [ARCHITECTURE.md](./ARCHITECTURE.md)
- 🔌 Zobacz [IPC-GUIDE.md](./IPC-GUIDE.md)
- 💬 Zadaj pytanie na [GitHub Discussions](https://github.com/Marcin-LWB/strt-Template-Elektron/discussions)
- 🐛 Zgłoś bug na [GitHub Issues](https://github.com/Marcin-LWB/strt-Template-Elektron/issues)

---

<div align="center">

**Start Template v1.0.0**

Made with ❤️ by Marcin Ostrowski

[GitHub](https://github.com/Marcin-LWB/strt-Template-Elektron) • [Docs](./README.md) • [Quick Start](./QUICKSTART.md)

</div>
