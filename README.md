# Start Template

Electron + React + TypeScript starter focused on Excel/CSV processing. The template ships with a secure IPC layer, ready-to-use UI components, and production build tooling for Windows.

**Quick links:** [Quick Start](#quick-start) · [Features](#features) · [Tech Stack](#tech-stack) · [Scripts](#scripts) · [Build & Distribution](#build--distribution) · [Documentation](#documentation)

## Features
- Dual-mode runtime: browser (File System Access API) and Electron desktop
- Hardened three-layer IPC bridge (Renderer → Preload → Main)
- Excel/CSV parsing and export powered by ExcelJS
- Zustand state management with persistence helpers
- Pre-configured linting, logging, and build pipelines (Vite, electron-builder)

## Tech Stack
- **Frontend:** React 19, TypeScript 5.8, Vite 7, Zustand, CSS3
- **Desktop/Main:** Electron 33, Node.js 20/22, ExcelJS 4.4, Pino logger
- **Tooling:** ESLint, electron-builder, TypeScript compiler

## Prerequisites
- Node.js **20.19+** or **22.12+**
- npm **10+**
- Windows x64 (primary target, dev also works on macOS/Linux)

## Quick Start
1. Clone the template
  ```bash
  git clone https://github.com/Marcin-LWB/strt-Template-Elektron.git my-app
  cd my-app
  ```
2. Install dependencies
  ```bash
  npm install
  ```
3. Start dev mode (Vite + Electron with HMR)
  ```bash
  npm start
  ```
  Alternative workflows:
  - `npm run dev` – browser-only mode (fast reload, File System Access API)
  - `npm run electron:dev` – Electron only (assumes Vite already running)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (`http://localhost:5173`) |
| `npm run electron:dev` | Electron in dev mode (expects Vite dev server) |
| `npm start` | Combined Vite + Electron dev workflow |
| `npm run build` | Production build of the renderer (outputs `dist/`) |
| `npm run build-electron` / `npm run dist` | Build renderer + Electron installer & portable exe |
| `npm run dist:portable` | Portable Windows build only |
| `npm run dist:dir` | Unpacked Electron build for inspection |
| `npm run electron` | Launch Electron against the production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production renderer build |

## Project Structure
```
timeCheck/
├── src/                  # React components, Zustand store, utils, types
├── electron/             # Electron main process, preload bridge, services
├── dist/                 # Renderer production build (npm run build)
├── dist-electron/        # Electron artifacts (npm run build-electron)
├── package.json          # npm scripts and electron-builder config
└── vite.config.ts        # Vite configuration
```

## Build & Distribution
- `npm run build-electron` (alias: `npm run dist`) produces:
  - `Start Template Setup 1.0.0.exe` – Windows installer (NSIS)
  - `Start Template-1.0.0-portable.exe` – portable executable
- `npm run dist:portable` builds only the portable binary.
- `npm run dist:dir` outputs an unpacked directory for debugging.
- Troubleshooting build issues:
  ```bash
  npm run clean
  npm install
  npm run build-electron
  ```
  See [`BUILD.md`](./BUILD.md) for full packaging details and configuration tweaks (icons, targets, etc.).

## Documentation
- [`QUICKSTART.md`](./QUICKSTART.md) – step-by-step onboarding
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) – renderer/main architecture overview
- [`BUILD.md`](./BUILD.md) – extended build & distribution guide
- [`agents.md`](./agents.md) – IPC contracts and rules for automation/AI agents
- [`FAQ.md`](./FAQ.md) – troubleshooting reference

## Notes for AI Agents
Automation agents should read [`agents.md`](./agents.md) before contributing. It captures IPC contracts, security requirements, and the Definition of Done for new channels and features.

## Maintainer
- Author: Marcin Ostrowski · [GitHub](https://github.com/Marcin-LWB/strt-Template-Elektron)
- Repository: `strt-Template-Elektron`
- Last updated: October 17, 2025
# Start Template# 🏗️ Build Instructions - Start Template



<div align="center">## Dostępne Wersje



**Profesjonalny szablon aplikacji desktopowej Electron + React + TypeScript**### 1. **Wersja Portable** 🚀

- **Plik**: `Start Template-1.0.0-portable.exe` (83.29 MB)

[Quick Start](#-quick-start) • [Dokumentacja](#-dokumentacja) • [Features](#-features) • [Stack](#-tech-stack)- **Cechy**:

  - Bez instalacji

</div>  - Można uruchomić z dowolnego miejsca (pendrive, folder)

  - Wszystko zawarte w jednym pliku

---  - Idealnie do testowania i dystrybucji



## 🎯 Co to jest Start Template?### 2. **Wersja Installer (NSIS)** 📦

- **Plik**: `Start Template Setup 1.0.0.exe` (83.51 MB)

**Start Template** to w pełni skonfigurowany, gotowy do użycia szablon aplikacji desktopowej łączący:- **Cechy**:

  - Klasyczny instalator Windows

- 🖥️ **Electron 33** - framework dla aplikacji desktop  - Skrót na pulpicie i w Start Menu

- ⚛️ **React 19** - nowoczesny UI z komponentami funkcyjnymi    - Uninstaller

- 📘 **TypeScript 5.8** - bezpieczeństwo typów i IntelliSense  - Rejestracja w Windows Add/Remove Programs

- ⚡ **Vite 7** - błyskawiczny dev server i optimized build  - Profesjonalna dystrybucja

- 🗂️ **Zustand** - eleganckie zarządzanie stanem

- 📊 **ExcelJS** - wbudowana obsługa plików Excel/CSV## Budowanie Aplikacji



### 💡 Dla kogo?### Wymagania

- Node.js 20.19+ lub 22.12+

- ✅ Developerzy startujący nowy projekt Electron- npm 10+

- ✅ Teams potrzebujący solidnej podstawy aplikacji desktop

- ✅ Projekty wymagające obsługi plików Excel### Kroki

- ✅ Aplikacje wykorzystujące File System Access API

#### 1. Zainstaluj zależności

---```bash

npm install

## 🚀 Quick Start```



### Wymagania#### 2. Wersja Development (z hot-reload)

```bash

- **Node.js** 20.19+ lub 22.12+npm start

- **npm** 10+# Uruchamia Vite na http://localhost:5173 i Electron jednocześnie

- **System** Windows / macOS / Linux```



### Instalacja w 30 sekund#### 3. Zbuduj obie wersje (Installer + Portable)

```bash

```bashnpm run dist

# 1. Klonuj szablon# lub

git clone https://github.com/Marcin-LWB/strt-Template-Elektron.git my-appnpm run build-electron

cd my-app```



# 2. Zainstaluj zależności#### 4. Zbuduj tylko Portable

npm install```bash

npm run dist:portable

# 3. Uruchom aplikację (Vite + Electron jednocześnie)```

npm start

```#### 5. Zbuduj bez pakowania (dla testowania)

```bash

**🎉 Gotowe!** Aplikacja otworzy się automatycznie na `http://localhost:5173`npm run dist:dir

```

### Alternatywne uruchomienie

## Struktura Projektu

```bash

# Tylko przeglądarka (development)```

npm run devtimeCheck/

├── src/                      # Kod React (TypeScript)

# Tylko Electron (po uruchomieniu dev)├── electron/                 # Kod Electron

npm run electron:dev├── dist/                     # Build React (po npm run build)

├── dist-electron/            # Binaria Electron (po npm run build-electron)

# Build produkcyjny├── package.json              # Konfiguracja npm i electron-builder

npm run build└── vite.config.ts           # Konfiguracja Vite

```

# Build Electron (Installer + Portable)

npm run build-electron## Output Build

```

Wyniki buildów znajdują się w folderze `dist-electron/`:

---

```

## ✨ Featuresdist-electron/

├── Start Template-1.0.0-portable.exe      # ← Portable version

### 🏗️ Architektura├── Start Template Setup 1.0.0.exe         # ← Installer

├── Start Template Setup 1.0.0.exe.blockmap

- ✅ **Dual-mode** - działa w przeglądarce i jako aplikacja desktop├── win-unpacked/                           # Rozpakowany build (do debugowania)

- ✅ **IPC Communication** - bezpieczna komunikacja Renderer ↔ Main├── builder-effective-config.yaml

- ✅ **Context Isolation** - pełne bezpieczeństwo Electron└── latest.yml                              # Plik aktualizacji

- ✅ **Hot Module Replacement** - natychmiastowe zmiany w dev mode```



### 📊 Excel Processing## Dystrybucja



- ✅ Wybór folderów i plików (File System Access API + Electron dialog)### Opcja 1: Portable (Rekomendowane dla prostoty)

- ✅ Parsowanie `.xlsx` i `.csv` (ExcelJS)- Po prostu skopiuj `Start Template-1.0.0-portable.exe`

- ✅ Dynamiczna tabela z kolumnami z arkusza- Użytkownik uruchamia plik - gotowe!

- ✅ Export danych do Excel- Brak zmian w rejestrze Windows

- ✅ Rekurencyjne skanowanie katalogów

### Opcja 2: Installer (Profesjonalne)

### 🎨 UI Components- Po prostu skopiuj `Start Template Setup 1.0.0.exe`

- Użytkownik klika -> Instaluje -> Skróty na pulpicie

| Komponent | Opis |

|-----------|------|## Troubleshooting

| `ExcelFilePicker` | Wybór i skanowanie plików Excel/CSV |

| `ExcelDataTable` | Wyświetlanie i edycja danych tabelarycznych |### Build nie działa?

| `WorkflowPanel` | 4-sekcyjny panel workflow (gotowy do rozbudowy) |```bash

| `CollapsiblePanel` | Zwijane sekcje UI |npm run clean  # Oczyść cache

npm install     # Reinstaluj zależności

### 🔧 Developer Experiencenpm run build-electron

```

- ✅ **TypeScript** - pełne typowanie w całym projekcie

- ✅ **ESLint** - automatyczne linting kodu### Port 5173 zajęty w dev?

- ✅ **Zustand** - prosty i wydajny state managementVite automatycznie użyje innego portu (5174, 5175, itd.)

- ✅ **IndexedDB** - persistence przez `idb-keyval`

- ✅ **Pino Logger** - strukturalne logowanie (dev mode)### Electron nie startuje?

```bash

---npm run electron      # Uruchom Electron bezpośrednio

# Sprawdź console dla error messages

## 📖 Dokumentacja```



| Dokument | Opis |## Konfiguracja Buildów

|----------|------|

| **[QUICKSTART.md](./QUICKSTART.md)** | Szczegółowy przewodnik dla początkujących |### Edycja electron-builder config

| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Architektura techniczna i wzorce |

| **[BUILD.md](./BUILD.md)** | Instrukcje buildowania i dystrybucji |Znajduje się w `package.json` w sekcji `"build"`:

| **[agents.md](./agents.md)** | 🤖 Specyfikacja techniczna dla AI agentów |

| **[FAQ.md](./FAQ.md)** | Często zadawane pytania i troubleshooting |```json

{

---  "build": {

    "appId": "com.starttemplate.app",

## 🔧 Dostępne komendy    "productName": "Start Template",

    "win": {

```bash      "target": ["nsis", "portable"]  // Dostępne: nsis, portable, msi, appx

# Development    }

npm run dev              # Vite dev server (http://localhost:5173)  }

npm run electron:dev     # Uruchom Electron w trybie dev}

npm start                # Vite + Electron jednocześnie (rekomendowane)```



# Build### Dodanie ikony

npm run build            # Build React do dist/

npm run build-electron   # Build Electron (Installer + Portable)Dodaj plik ikony:

npm run dist             # Alias dla build-electron1. Utwórz `build/icon.ico` (256x256 px)

npm run dist:portable    # Tylko portable .exe2. W `package.json` zmień na:

npm run dist:dir         # Build bez pakowania (debug)```json

"win": {

# Quality  "icon": "build/icon.ico"

npm run lint             # ESLint check}

npm run preview          # Preview production build```

```

## Skrypty NPM

---

| Skrypt | Opis |

## 🛠️ Tech Stack|--------|------|

| `npm run dev` | Vite dev server (http://localhost:5173) |

**Frontend:** React 19 • TypeScript 5.8 • Vite 7 • Zustand • CSS3| `npm run build` | Build React do `dist/` |

| `npm run build-electron` | Build React + Electron (obie wersje) |

**Backend:** Electron 33 • Node.js • ExcelJS 4.4 • Pino Logger| `npm run dist` | Alias dla `build-electron` |

| `npm run dist:portable` | Build tylko wersji portable |

**DevTools:** ESLint • electron-builder • TypeScript Compiler| `npm run dist:dir` | Build bez pakowaniu (do testów) |

| `npm run electron` | Uruchom Electron z dist/ |

---| `npm run electron:dev` | Uruchom Electron w development mode |

| `npm start` | Vite + Electron dev (rekomendowane) |

## 🚀 Jak zacząć?| `npm run lint` | ESLint sprawdzenie kodu |

| `npm run preview` | Podgląd production buildu |

1. **Czytaj README.md** - Overview projektu (ten plik)

2. **Uruchom QUICKSTART.md** - Szczegółowy poradnik## Informacje o Aplikacji

3. **Sprawdź ARCHITECTURE.md** - Zrozumienie architektury

4. **Przeczytaj agents.md** - Dla AI agentów pracujących nad projektem- **Nazwa**: Start Template

5. **Zajrzyj do FAQ.md** - Gdy masz pytania- **Wersja**: 1.0.0

- **Tech Stack**: Electron 33 + React 19 + TypeScript + Vite

---- **Rozmiar**: ~83 MB (zawiera ExcelJS)

- **Supportowane**: Windows x64

## 📦 Dystrybucja

## Notatki

Po `npm run build-electron`:

- **Installer** - `Start Template Setup 1.0.0.exe` (~83 MB)- ExcelJS (940 kB) jest duża - jeśli chcesz zmniejszyć rozmiar, rozważ webpack code-splitting

- **Portable** - `Start Template-1.0.0-portable.exe` (~83 MB)- Electron zawiera Chromium - stąd duży rozmiar

- Portable i Installer to ten sam kod - różni się sposób dostarczania

---- Oba buildują się jednocześnie dla oszczędności czasu



## 🤝 Contributing---



Sugestie, PRy i feedback mile widziane!**Ostatnia aktualizacja**: 2025-10-16  

**Twórca**: Marcin Ostrowski  

---**Repozytorium**: strt-Template-Elektron


<div align="center">

Made with ❤️ by Marcin Ostrowski  
[GitHub](https://github.com/Marcin-LWB/strt-Template-Elektron) • [Docs](./QUICKSTART.md)

Last update: October 17, 2025

</div>
