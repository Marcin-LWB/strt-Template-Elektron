# 🚀 Quick Start Guide - CPK Export Weryfikacja

## Iteration 0 + 1 + 2 Complete!

Aplikacja została skonfigurowana z następującymi funkcjonalnościami:
- ✅ **Electron** - Dostęp do systemu plików
- ✅ **Excel Processing** - Odczyt i łączenie plików .xlsx
- ✅ **State Management** - Zustand z persistencją
- ✅ **Type Safety** - TypeScript + Zod
- ✅ **Logging** - Pino z pretty output
- ✅ **Advanced Filtering** - Tagi folderów i wyszukiwanie dynamiczne
- ✅ **Collapsible UI** - Zwijane panele filtrów

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

### 1. Wybór plików Excel

1. Kliknij **"📂 Wybierz folder"**
2. Wskaż folder zawierający pliki `.xlsx`
3. (Opcjonalnie) Zaznacz **"Skanuj podkatalogi"**
4. Aplikacja wyświetli listę znalezionych plików

### 2. Zaznaczanie plików

- Użyj checkboxów przy każdym pliku
- **"☑️ Zaznacz wszystkie"** - zaznaczy wszystkie pliki
- **"☐ Odznacz wszystkie"** - odznacza wszystkie

### 3. Ładowanie danych

1. Wybierz pliki (zaznacz checkboxy)
2. Kliknij **"📥 Załaduj wybrane pliki"**
3. Dane pojawią się w tabeli po prawej stronie

### 4. Przeglądanie danych

- Tabela pokazuje **wszystkie kolumny** z Excela
- **Kolory wierszy** są zachowane z oryginalnych arkuszy
- **Kolumna "Folder"** pokazuje hierarchię Tom (Tom 1, Tom 1/Tom 1.1, etc.)
- **Kolumna "Plik źródłowy"** pokazuje, skąd pochodzi wiersz
- Przewiń w prawo/lewo, aby zobaczyć wszystkie kolumny

### 5. Filtrowanie danych (Iteration 2 - NEW!)

#### Panel tagów folderów
- **Automatyczne tagi** - generowane z kolumny "Folder"
- **Kolory hierarchiczne**:
  - 🔵 Tom 1 - niebieski
  - 🟢 Tom 1/Tom 1.1 - zielony
  - 🟠 Tom 1/Tom 1.1/Tom 1.1.1 - pomarańczowy
  - 🔴 Głębsze poziomy - czerwony/fioletowy
- **Kliknij tag** aby filtrować wiersze
- **Wiele tagów** - możesz wybrać kilka naraz
- **Zwiń/rozwiń** sekcję klikając nagłówek

#### Wyszukiwanie dynamiczne
- **FILE NUMBER** - wpisz numer pliku (np. "Tom 1", "PZT")
- **FILE TITLE (PL)** - wpisz część tytułu
- **Live search** - wyniki aktualizują się podczas pisania
- **Case-insensitive** - wielkość liter nie ma znaczenia

#### Reset filtrów
- Przycisk **"🔄 Reset wszystkich filtrów"** pojawia się gdy aktywne są filtry
- Czyści tagi, wyszukiwanie i pokazuje wszystkie wiersze

### 6. Konfiguracja

Kliknij **"⚙️ Konfiguracja"** w nagłówku:

- **Liczba kolumn do odczytu** (domyślnie: 10)
- **Indeks kolumny z kolorem** (domyślnie: 1)
- **Pomijaj puste wiersze** (domyślnie: włączone)
- **Indeks wiersza nagłówków** (domyślnie: 0)

---

## 🗂️ Struktura Projektu

```
cpk-exportDocu/
├── src/
│   ├── components/          # React components
│   │   ├── ExcelFilePicker.tsx     # Wybór plików
│   │   ├── ExcelDataTable.tsx      # Tabela danych
│   │   ├── FilterPanel.tsx         # Panel filtrów (NEW)
│   │   ├── CollapsiblePanel.tsx    # Zwijany panel
│   │   └── WorkflowPanel.tsx       # Workflow
│   ├── store/
│   │   └── appStore.ts             # Zustand state
│   ├── types/
│   │   ├── excel.types.ts          # Typy Excel
│   │   ├── ipc.types.ts            # IPC kontrakty
│   │   └── electron.d.ts           # Electron API
│   ├── utils/
│   │   ├── excelAnalysis.ts        # Analiza Tom/Folder (NEW)
│   │   └── browserExcel.ts         # Browser Excel
│   ├── AppNew.tsx                  # Główny komponent
│   └── main.tsx                    # React entry
│
├── electron/
│   ├── services/
│   │   ├── fileService.js          # Operacje na plikach
│   │   └── excelService.js         # Przetwarzanie Excel
│   ├── utils/
│   │   └── logger.js               # Pino logger
│   ├── main.js                     # Electron main process
│   └── preload.js                  # IPC bridge
│
├── IMPLEMENTATION.md               # Log implementacji
└── QUICKSTART.md                   # Ten plik
```

---

## 🧪 Testowanie

### Przygotuj dane testowe

1. Utwórz folder testowy, np. `C:\TestExcel\`
2. Umieść tam kilka plików `.xlsx`
3. Pliki powinny mieć:
   - Nagłówki w pierwszym wierszu
   - Dane w kolejnych wierszach
   - (Opcjonalnie) Kolory w drugiej kolumnie
   - (Opcjonalnie) Kolumnę "FILE NUMBER" z wartościami jak "Tom 1", "Tom 1.1"

### Przykładowa struktura Excel:

| FILE NUMBER | Status | FILE TITLE (PL) | Data | Uwagi |
|-------------|--------|-----------------|------|-------|
| Tom 1       | OK     | Dokumentacja projektowa | 2025 | Główny |
| Tom 1.1     | OK     | Część opisowa | 2025 | Podsekcja |
| Tom 1.1.1   | ERROR  | Szczegóły | 2025 | Podsekcja 2 |
| Tom 2       | OK     | Projekty budowlane | 2025 | OK |

---

## 🐛 Troubleshooting

### Electron nie startuje

Sprawdź czy Vite działa:
```bash
npm run dev
```
Otwórz `http://localhost:5173` - powinien pokazać aplikację w przeglądarce.

### Błąd "Electron API niedostępne"

To normalne w trybie browser. Musisz użyć Electron:
```bash
npm run electron:dev
```

### Nie widać plików Excel

1. Sprawdź czy folder zawiera pliki `.xlsx`
2. Sprawdź konsolę Electron (DevTools otworzy się automatycznie)
3. Logi są w konsoli

### Filtry nie działają

1. Upewnij się, że dane zawierają kolumnę "FILE NUMBER" z wartościami "Tom X"
2. Kolumna "Folder" powinna być automatycznie wypełniona
3. Jeśli brak tagów - sprawdź czy FILE NUMBER zawiera "Tom" w nazwach

### Błędy w logach

Otwórz DevTools w Electron:
- Windows: `Ctrl + Shift + I`
- Mac: `Cmd + Option + I`

Sprawdź zakładkę Console i Network.

---

## 📊 IPC Channels (dla developerów)

Dostępne kanały komunikacji:

**File Operations:**
- `file:select-xlsx-directory` - Wybór folderu
- `file:scan-xlsx-files` - Skanowanie plików

**Excel Operations:**
- `excel:load-file` - Wczytaj pojedynczy plik
- `excel:load-multiple-files` - Wczytaj wiele plików

**Config:**
- `config:get` - Pobierz konfigurację
- `config:set` - Zapisz konfigurację

**Logs:**
- `log:info`, `log:error`, `log:warn` - Logowanie

---

## 🎯 Następne Kroki (Roadmap)

✅ **Iteration 0**: Fundament Electron + IPC  
✅ **Iteration 1**: Wybór i ładowanie plików  
✅ **Iteration 2**: Filtrowanie, tagi, wyszukiwanie (COMPLETE!)  
⬜ **Iteration 3**: Weryfikacja vs system plików  
⬜ **Iteration 4**: Operacje na plikach  
⬜ **Iteration 5**: Automatyzacja i polish  

---

## 📝 Logi

Logi w development wyświetlają się w konsoli terminala i w DevTools.

W production logi są zapisywane w:
```
%APPDATA%/cpk-export-weryfikacja/logs/app.log
```

---

## 💡 Wskazówki

1. **Zachowaj stan** - Aplikacja zapisuje wybrany folder w IndexedDB
2. **Kolory** - Kolory z Excela są zachowywane i wyświetlane w tabeli
3. **Performance** - Dla bardzo dużych plików (>10k wierszy) może być wolniej
4. **Konfiguracja** - Zmień liczbę kolumn jeśli Excel ma więcej/mniej

---

## 🆘 Pomoc

Jeśli masz problemy:
1. Sprawdź logi w konsoli
2. Zobacz `IMPLEMENTATION.md` dla szczegółów technicznych
3. Przejrzyj kod w `src/` i `electron/`

---

**Powodzenia! 🚀**

CPK Export Weryfikacja v1.0.0  
Iteration 0 + 1 + 2 Complete
