# 🚀 Quick Start Guide - Start Template

## Szablon aplikacji Electron gotowy do użycia!

Szablon został skonfigurowany z następującymi funkcjonalnościami:
- ✅ **Electron 33** - Framework aplikacji desktopowej
- ✅ **React 19** - Nowoczesny interfejs użytkownika
- ✅ **TypeScript** - Bezpieczność typów
- ✅ **Vite 7** - Szybki development server
- ✅ **Zustand** - Lekkie zarządzanie stanem
- ✅ **ExcelJS** - Podstawowa obsługa plików Excel
- ✅ **ESLint** - Linting kodu

---

## 📋 Wymagania

- **Node.js**: 20.19+ lub 22.12+
- **npm**: 10+
- **System**: Windows (rekomendowany)

---

## 🛠️ Instalacja

Wszystkie zależności są już zainstalowane. Jeśli potrzebujesz reinstalacji:

```bash
npm install
```

---

## 🎮 Uruchamianie Aplikacji

### Tryb Development (Rekomendowany)

**Opcja 1: Automatyczny start (Vite + Electron)**
```bash
npm start
```
To uruchomi:
- Vite dev server na `http://localhost:5173`
- Electron app (czeka na Vite)

**Opcja 2: Ręczny start (2 terminale)**

Terminal 1 - Vite:
```bash
npm run dev
```

Terminal 2 - Electron (po starcie Vite):
```bash
npm run electron:dev
```

### Tryb Production

Build aplikacji:
```bash
npm run build
```

Budowanie instalatora Electron:
```bash
npm run build-electron
```

Instalator będzie w folderze `dist-electron/`

---

## 📖 Jak używać aplikacji

### 1. Użycie szablonu

1. **Klonuj szablon:**
   ```bash
   git clone <repository-url> my-app
   cd my-app
   ```

2. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

3. **Uruchom w development:**
   ```bash
   npm run dev      # Browser mode
   npm run electron:dev  # Electron mode
   ```

### 2. Podstawowe komponenty

- **ExcelFilePicker** - wybór plików Excel z File System Access API
- **ExcelDataTable** - wyświetlanie danych w tabeli z możliwością exportu
- **WorkflowPanel** - panel z 4 sekcjami (Excel + 3 szablony)
- **CollapsiblePanel** - zwijane sekcje interfejsu

### 3. Rozszerzanie szablonu

#### Dodawanie nowych komponentów:
```typescript
// src/components/MyComponent.tsx
import { useAppStore } from '../store/appStore';

export default function MyComponent() {
  const { someState, setSomeState } = useAppStore();
  
  return (
    <div>
      {/* Twój komponent */}
    </div>
  );
}
```

#### Rozszerzanie stanu:
```typescript
// src/store/appStore.ts
interface AppState {
  // Istniejące stany...
  myNewState: string;
}

const useAppStore = create<AppState & AppActions>((set, get) => ({
  // Istniejące stany...
  myNewState: '',
  
  // Nowe akcje
  setMyNewState: (value: string) => set({ myNewState: value }),
}));
```

### 4. Excel Processing

Szablon zawiera podstawową obsługę Excel:

```typescript
// Ładowanie pliku Excel
const loadExcelFile = async (file: File) => {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);
  
  const worksheet = workbook.getWorksheet(1);
  // Przetwarzanie danych...
};
```

---

## 🗂️ Struktura Projektu

```
start-template/
├── src/
│   ├── components/          # React components
│   │   ├── ExcelFilePicker.tsx     # Wybór plików Excel
│   │   ├── ExcelDataTable.tsx      # Tabela danych Excel
│   │   ├── CollapsiblePanel.tsx    # Zwijany panel UI
│   │   └── WorkflowPanel.tsx       # 4-sekcyjny panel
│   ├── store/
│   │   └── appStore.ts             # Zustand state management
│   ├── types/
│   │   ├── excel.types.ts          # Typy dla Excel
│   │   ├── ipc.types.ts            # IPC kontrakty
│   │   └── electron.d.ts           # Electron API types
│   ├── utils/
│   │   └── browserExcel.ts         # Excel utilities
│   ├── AppNew.tsx                  # Główny komponent
│   └── main.tsx                    # React entry point
│
├── electron/
│   ├── services/
│   │   ├── fileService.js          # File system operations
│   │   └── excelService.js         # Excel processing
│   ├── utils/
│   │   └── logger.js               # Logging utility
│   ├── main.js                     # Electron main process
│   └── preload.js                  # IPC bridge
│
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite configuration
├── eslint.config.js                # ESLint rules
├── README.md                       # Dokumentacja projektu
├── QUICKSTART.md                   # Ten plik
└── agents.md                       # Tech docs
```

---

## 🔧 Dostępne skrypty

```bash
npm run dev              # Vite dev server (browser mode)
npm run electron:dev     # Electron development mode
npm run build            # Build production
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

---

## 🧪 Testowanie szablonu

### Przygotuj testowe pliki Excel

1. Utwórz folder testowy z kilkoma plikami `.xlsx`
2. Pliki powinny mieć standardową strukturę:
   - Nagłówki w pierwszym wierszu
   - Dane w kolejnych wierszach

### Przykładowa struktura Excel:

| ID | Nazwa | Status | Data | Uwagi |
|----|-------|--------|------|-------|
| 1  | Element A | OK | 2025-10-16 | Test |
| 2  | Element B | PENDING | 2025-10-16 | Test |

---

## 🐛 Troubleshooting

### Electron nie startuje
```bash
# Sprawdź czy Vite działa
npm run dev
# Potem uruchom Electron
npm run electron:dev
```

### Błędy TypeScript
```bash
# Sprawdź typy
npx tsc --noEmit
```

### Problemy z Excel
Sprawdź konsolę deweloperską (`Ctrl+Shift+I` w Electron) dla błędów.

---

## � Kolejne kroki

1. **Dostosuj UI** - edytuj komponenty w `src/components/`
2. **Rozszerz funkcjonalność** - dodaj nowe features do `src/store/`
3. **Dodaj nowe typy** - w `src/types/`
4. **Dostosuj styl** - edytuj pliki `.css`

---

## � Wskazówki dla developerów

1. **State management** - Używaj Zustand dla prostego stanu
2. **Excel processing** - ExcelJS jest już skonfigurowany
3. **IPC komunikacja** - Zobacz `electron/preload.js` i `src/types/electron.d.ts`
4. **File System** - Użyj File System Access API w browser + Electron IPC

---

**Powodzenia z rozwojem aplikacji! 🚀**

Start Template v1.0.0  
Gotowy szablon Electron + React + TypeScript
