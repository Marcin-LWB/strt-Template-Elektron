# Changelog - CPK Export Weryfikacja

## [1.2.0] - 2025-10-07

### ✨ Iteration 2 - Advanced Data Presentation ✅

#### Nowe funkcjonalności

**FilterPanel Component** - Zaawansowane filtrowanie z zwijalnymi sekcjami
- Panel tagów folderów z automatyczną ekstrakcją z kolumny "Folder"
- Hierarchiczne tagi (Tom 1, Tom 1/Tom 1.1, Tom 1/Tom 1.1/Tom 1.1.1)
- Kolory hierarchiczne oparte na głębokości (5 kolorów):
  - Level 0 (Tom 1): Niebieski #3b82f6
  - Level 1 (Tom 1/Tom 1.1): Zielony #10b981
  - Level 2 (Tom 1/Tom 1.1/Tom 1.1.1): Pomarańczowy #f59e0b
  - Level 3+: Czerwony/Fioletowy #ef4444, #8b5cf6
- Kliknięcie tagu włącza/wyłącza filtr
- Wielokrotny wybór tagów (logika OR)
- Stan aktywny z kolorowym tłem

**Dynamic Search** - Wyszukiwanie w czasie rzeczywistym
- Pole wyszukiwania dla kolumny FILE NUMBER
- Pole wyszukiwania dla kolumny FILE TITLE (PL)
- Ignorowanie wielkości liter
- Live update podczas pisania
- Kombinacja z filtrami tagów (logika AND)

**Collapsible Sections** - Oszczędność przestrzeni
- Sekcja tagów zwija się/rozwija niezależnie
- Sekcja wyszukiwania zwija się/rozwija niezależnie
- Wskaźniki wizualne (▼/▶)
- Badges pokazujące aktywne filtry

**Reset Functionality**
- Przycisk "Reset wszystkich filtrów" pojawia się gdy filtry aktywne
- Czyści wszystkie tagi i pola wyszukiwania
- Przywraca wszystkie wiersze
- Czerwone stylowanie dla wyraźnej widoczności

**Smart Filtering** - Inteligentna logika
- Wiele aktywnych tagów (OR w ramach tagów)
- Połączenie wyszukiwania + tagi (AND między typami)
- Licznik wierszy pokazuje filtrowane/total
- Komunikat pustego stanu gdy brak wyników

#### Zmienione pliki
- `src/components/FilterPanel.tsx` - NOWY komponent (240 linii)
- `src/components/FilterPanel.css` - NOWE style (180 linii)
- `src/components/ExcelDataTable.tsx` - zintegrowano FilterPanel
- `src/components/ExcelDataTable.css` - dodano style filtered-badge i hint

#### Dokumentacja
- `IMPLEMENTATION.md` - zaktualizowano o Iteration 2
- `QUICKSTART.md` - dodano przewodnik filtrowania
- `DOCS_INDEX.md` - zaktualizowano metryki i status
- `ITERATION2_SUMMARY.md` - NOWY dokument ze szczegółowym podsumowaniem
- `README.md` - zaktualizowano status i funkcjonalności

#### Optymalizacje wydajności
- `useMemo` dla ekstrakcji tagów (tylko przy zmianie rows)
- `useMemo` dla logiki filtrowania (tylko przy zmianie zależności)
- Algorytm hierarchicznego sortowania tagów
- Efektywne filtrowanie dla dużych zbiorów danych

---

## [1.1.0] - 2025-10-06

### 🐛 Naprawione błędy

#### Krytyczny błąd renderowania React
- **Problem**: `Objects are not valid as a React child (found: object with keys {richText})`
- **Przyczyna**: ExcelJS zwraca wartości komórek jako obiekty (richText, formula, hyperlink) zamiast stringów
- **Rozwiązanie**: 
  - Dodano funkcję `getCellValueAsString()` w `browserExcel.ts` i `excelService.js`
  - Wszystkie wartości komórek są teraz konwertowane na stringi przed zapisem do state
  - Obsługuje: richText, formulas, hyperlinks, dates, arrays, objects

**Zmienione pliki:**
- `src/utils/browserExcel.ts` - dodano getCellValueAsString, używa w readExcelFile
- `electron/services/excelService.js` - dodano getCellValueAsString, używa w loadExcelFile

---

### ✨ Nowe funkcjonalności

#### 1. Dwa tryby wyświetlania kolumn

**Tryb 1: "Wszystkie kolumny"** (domyślny)
- Wyświetla wszystkie kolumny z pliku Excel
- Dynamiczny slider szerokości kolumn (80-400px)
- Konfigurowalny: liczba kolumn, indeks kolumny z kolorem

**Tryb 2: "Wybrane kolumny"**
- Predefiniowany zestaw kolumn z własnymi szerokościami
- Domyślna konfiguracja:
  ```
  - Plik źródłowy (100px)
  - Folder (60px)
  - FILE NUMBER (120px)
  - FILE TITLE (PL) (120px)
  - FILE TITLE (EN) (120px)
  ```
- Ukrywa kolumnę "Plik źródłowy" w trybie custom (duplikacja)
- Łatwa rozbudowa o kolejne kolumny w przyszłości

**Wybór trybu:**
- Panel konfiguracji (⚙️) → "Tryb wyświetlania kolumn"
- Zapisywane w localStorage (persisted state)

**Zmienione pliki:**
- `src/types/excel.types.ts` - dodano DisplayMode, ColumnDisplay, DEFAULT_CUSTOM_COLUMNS
- `src/store/appStore.ts` - zaktualizowano defaultConfig o displayMode i customColumns
- `src/components/ExcelDataTable.tsx` - warunkowe renderowanie kolumn, getColumnWidth
- `src/AppNew.tsx` - rozszerzono ConfigPanel o wybór trybu

---

#### 2. Hierarchiczna struktura folderów

**Przed:**
```
Tom 1.1
Tom 2.1.1
```

**Po:**
```
Tom 1/Tom 1.1
Tom 2/Tom 2.1/Tom 2.1.1
```

**Implementacja:**
- Analiza ilości kropek w numerze Tom
- Budowanie hierarchicznej ścieżki: `buildHierarchicalPath()`
- Przykłady:
  - `"1"` → `"Tom 1"`
  - `"1.1"` → `"Tom 1/Tom 1.1"`
  - `"2.1.1"` → `"Tom 2/Tom 2.1/Tom 2.1.1"`

**Zmienione pliki:**
- `src/utils/excelAnalysis.ts` - przepisano extractTomFromFileNumber, dodano buildHierarchicalPath

---

#### 3. Nazwa kolumny "Folder"

**Przed:**
- Kolumna wyświetlana bez nagłówka lub z generycznym "Column 1"

**Po:**
- Jawna nazwa: **"Folder"**
- Widoczna w obu trybach wyświetlania
- W trybie custom ma własną szerokość: 60px

**Zmienione pliki:**
- `src/utils/excelAnalysis.ts` - addTomColumn dodaje nazwę "Folder"
- `src/types/excel.types.ts` - DEFAULT_CUSTOM_COLUMNS zawiera "Folder"

---

### 🎨 Monochromatyczny design

**Wcześniejsze zmiany z tej sesji:**
- Główne tło: jasno szare (#e8e8e8)
- Nagłówek: ciemny (#2d2d2d)
- Tytuł: font Sora, font-weight 800
- Layout na pełną szerokość ekranu
- Przyciski: monochromatyczne szarości

---

### 📊 Metryki buildu

```
✓ Build successful
✓ Bundle: 1,206 kB (ExcelJS + Zod overhead)
✓ CSS: 11.31 kB
✓ Build time: 2.42s
✓ 116 modules transformed
```

---

## Instrukcje użycia

### Tryb wyświetlania kolumn

1. **Wszystkie kolumny (domyślnie):**
   - Kliknij ⚙️ Konfiguracja
   - Wybierz "Wszystkie kolumny (z pliku Excel)"
   - Ustaw liczbę kolumn (1-50)
   - Reguluj szerokość sliderrem

2. **Wybrane kolumny:**
   - Kliknij ⚙️ Konfiguracja
   - Wybierz "Wybrane kolumny (konfiguracja niestandardowa)"
   - Automatycznie wyświetli predefiniowane kolumny
   - Szerokości są stałe dla każdej kolumny

### Hierarchiczne foldery

- Automatycznie wykrywane z kolumny FILE NUMBER
- Przykłady obsługiwanych formatów:
  - `TOM 1` → `Tom 1`
  - `Tom 1.1 - opis` → `Tom 1/Tom 1.1`
  - `Tom 2.1.1 (część)` → `Tom 2/Tom 2.1/Tom 2.1.1`

---

## Znane ograniczenia

1. **Tryb custom - kolumny hardcoded:**
   - Obecnie kolumny są zdefiniowane w DEFAULT_CUSTOM_COLUMNS
   - Planowane: edytor kolumn w UI (przyszła iteracja)

2. **Bundle size:**
   - 1.2 MB głównie przez ExcelJS
   - Rozważyć lazy loading dla Excel engine

3. **Folder detection:**
   - Wymaga kolumny FILE NUMBER
   - Case insensitive regex pattern

---

## Migration Guide

### Dla istniejących użytkowników:

- Config automatycznie rozszerzy się o nowe pola przy pierwszym uruchomieniu
- Domyślny tryb: "all" (wszystkie kolumny) - zachowanie bez zmian
- Hierarchiczne foldery działają automatycznie

### Dla developerów:

**Dodawanie własnych kolumn do trybu custom:**

```typescript
// src/types/excel.types.ts
export const DEFAULT_CUSTOM_COLUMNS: ColumnDisplay[] = [
  { name: 'Plik źródłowy', width: 100, visible: true },
  { name: 'Folder', width: 60, visible: true },
  { name: 'FILE NUMBER', width: 120, visible: true },
  { name: 'FILE TITLE (PL)', width: 120, visible: true },
  { name: 'FILE TITLE (EN)', width: 120, visible: true },
  { name: 'NOWA_KOLUMNA', width: 150, visible: true }, // ← Dodaj tutaj
];
```

**Uwaga:** Nazwy muszą dokładnie pasować do nagłówków w Excel!

---

## Testing Checklist

### Przetestowane scenariusze:

- [x] Ładowanie plików w trybie browser (File System Access API)
- [x] Ładowanie plików w trybie Electron
- [x] Renderowanie komórek z richText
- [x] Renderowanie komórek z formułami
- [x] Hierarchiczne foldery: Tom 1, Tom 1.1, Tom 2.1.1
- [x] Przełączanie między trybami wyświetlania
- [x] Zapisywanie konfiguracji w localStorage
- [x] Build production
- [x] TypeScript compilation
- [x] ESLint validation

### Do przetestowania przez użytkownika:

- [ ] Załaduj rzeczywiste pliki Excel z projektu
- [ ] Sprawdź czy kolumny FILE NUMBER, FILE TITLE są poprawnie wykrywane
- [ ] Zweryfikuj hierarchię folderów na realnych danych
- [ ] Porównaj tryb "wszystkie" vs "wybrane" kolumny
- [ ] Sprawdź szerokości kolumn w trybie custom

---

## Podziękowania

Implementacja oparta na:
- ExcelJS 4.4.0 - parsing Excel files
- Zod 3.x - schema validation
- Zustand 5.x - state management
- File System Access API - browser file handling

---

**Wersja:** 1.1.0  
**Data:** 2025-10-06  
**Autor:** AI Assistant + Marcin Ostrowski  
**Status:** ✅ Production Ready
