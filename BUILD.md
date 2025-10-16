# 🏗️ Build Instructions - Start Template

## Dostępne Wersje

### 1. **Wersja Portable** 🚀
- **Plik**: `Start Template-1.0.0-portable.exe` (83.29 MB)
- **Cechy**:
  - Bez instalacji
  - Można uruchomić z dowolnego miejsca (pendrive, folder)
  - Wszystko zawarte w jednym pliku
  - Idealnie do testowania i dystrybucji

### 2. **Wersja Installer (NSIS)** 📦
- **Plik**: `Start Template Setup 1.0.0.exe` (83.51 MB)
- **Cechy**:
  - Klasyczny instalator Windows
  - Skrót na pulpicie i w Start Menu
  - Uninstaller
  - Rejestracja w Windows Add/Remove Programs
  - Profesjonalna dystrybucja

## Budowanie Aplikacji

### Wymagania
- Node.js 20.19+ lub 22.12+
- npm 10+

### Kroki

#### 1. Zainstaluj zależności
```bash
npm install
```

#### 2. Wersja Development (z hot-reload)
```bash
npm start
# Uruchamia Vite na http://localhost:5173 i Electron jednocześnie
```

#### 3. Zbuduj obie wersje (Installer + Portable)
```bash
npm run dist
# lub
npm run build-electron
```

#### 4. Zbuduj tylko Portable
```bash
npm run dist:portable
```

#### 5. Zbuduj bez pakowania (dla testowania)
```bash
npm run dist:dir
```

## Struktura Projektu

```
timeCheck/
├── src/                      # Kod React (TypeScript)
├── electron/                 # Kod Electron
├── dist/                     # Build React (po npm run build)
├── dist-electron/            # Binaria Electron (po npm run build-electron)
├── package.json              # Konfiguracja npm i electron-builder
└── vite.config.ts           # Konfiguracja Vite
```

## Output Build

Wyniki buildów znajdują się w folderze `dist-electron/`:

```
dist-electron/
├── Start Template-1.0.0-portable.exe      # ← Portable version
├── Start Template Setup 1.0.0.exe         # ← Installer
├── Start Template Setup 1.0.0.exe.blockmap
├── win-unpacked/                           # Rozpakowany build (do debugowania)
├── builder-effective-config.yaml
└── latest.yml                              # Plik aktualizacji
```

## Dystrybucja

### Opcja 1: Portable (Rekomendowane dla prostoty)
- Po prostu skopiuj `Start Template-1.0.0-portable.exe`
- Użytkownik uruchamia plik - gotowe!
- Brak zmian w rejestrze Windows

### Opcja 2: Installer (Profesjonalne)
- Po prostu skopiuj `Start Template Setup 1.0.0.exe`
- Użytkownik klika -> Instaluje -> Skróty na pulpicie

## Troubleshooting

### Build nie działa?
```bash
npm run clean  # Oczyść cache
npm install     # Reinstaluj zależności
npm run build-electron
```

### Port 5173 zajęty w dev?
Vite automatycznie użyje innego portu (5174, 5175, itd.)

### Electron nie startuje?
```bash
npm run electron      # Uruchom Electron bezpośrednio
# Sprawdź console dla error messages
```

## Konfiguracja Buildów

### Edycja electron-builder config

Znajduje się w `package.json` w sekcji `"build"`:

```json
{
  "build": {
    "appId": "com.starttemplate.app",
    "productName": "Start Template",
    "win": {
      "target": ["nsis", "portable"]  // Dostępne: nsis, portable, msi, appx
    }
  }
}
```

### Dodanie ikony

Dodaj plik ikony:
1. Utwórz `build/icon.ico` (256x256 px)
2. W `package.json` zmień na:
```json
"win": {
  "icon": "build/icon.ico"
}
```

## Skrypty NPM

| Skrypt | Opis |
|--------|------|
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run build` | Build React do `dist/` |
| `npm run build-electron` | Build React + Electron (obie wersje) |
| `npm run dist` | Alias dla `build-electron` |
| `npm run dist:portable` | Build tylko wersji portable |
| `npm run dist:dir` | Build bez pakowaniu (do testów) |
| `npm run electron` | Uruchom Electron z dist/ |
| `npm run electron:dev` | Uruchom Electron w development mode |
| `npm start` | Vite + Electron dev (rekomendowane) |
| `npm run lint` | ESLint sprawdzenie kodu |
| `npm run preview` | Podgląd production buildu |

## Informacje o Aplikacji

- **Nazwa**: Start Template
- **Wersja**: 1.0.0
- **Tech Stack**: Electron 33 + React 19 + TypeScript + Vite
- **Rozmiar**: ~83 MB (zawiera ExcelJS)
- **Supportowane**: Windows x64

## Notatki

- ExcelJS (940 kB) jest duża - jeśli chcesz zmniejszyć rozmiar, rozważ webpack code-splitting
- Electron zawiera Chromium - stąd duży rozmiar
- Portable i Installer to ten sam kod - różni się sposób dostarczania
- Oba buildują się jednocześnie dla oszczędności czasu

---

**Ostatnia aktualizacja**: 2025-10-16  
**Twórca**: Marcin Ostrowski  
**Repozytorium**: strt-Template-Elektron
