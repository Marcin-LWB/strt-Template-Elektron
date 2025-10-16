# 🏷️ Final File Name Generator - Dokumentacja

## Opis funkcji

Komponent do generowania finalnych nazw plików zgodnie z wymaganiami projektu CPK. Dodaje nową kolumnę `Final File Name` z nazwami w formacie:

```
[tomy]_[numery]_[FILE NUMBER]
```

## Format nazwy pliku

### Składowe:

1. **[tomy]** - przekształcenie hierarchii folderów (TYLKO dla plików P00*)
   - Źródło: kolumna `Folder`
   - Transformacja: `/` → `---`, `.` → `-`
   - **Warunek:** FILE NUMBER musi zaczynać się od 'P00'
   - Przykłady:
     - `Tom 1/Tom 1.1` → `1---1-1` (dla P001_ABC)
     - `Tom 2/Tom 2.1/Tom 2.1.5` → `2---2-1---2-1-5` (dla P002_DEF)
     - **PUSTE** dla plików nie zaczynających się od P00

2. **[numery]** - sekwencyjny numer dla każdego tomu (TYLKO dla plików P00*)
   - Format: 3 cyfry z zerowaniem (`001`, `002`, etc.)
   - Resetuje się dla każdego unikalnego tomu
   - **Dla plików P00*:** grupuje po folderze
   - **Dla innych plików:** BRAK - kolumna Final File Name pozostaje pusta
   - Przykład:
     ```
     Tom 1 (P00*) → 001, 002, 003...
     Tom 1/Tom 1.1 (P00*) → 001, 002, 003... (nowa numeracja!)
     Inne pliki → 001, 002, 003... (bez [tomy])
     ```

3. **[FILE NUMBER]** - oryginalna nazwa z kolumny
   - Źródło: kolumna `FILE NUMBER`
   - Bez modyfikacji

## Przykłady

| Folder | FILE NUMBER | Typ | Numer | Final File Name |
|--------|-------------|-----|-------|-----------------|
| Tom 1 | P001_ABC | P00* | 001 | `1_001_P001_ABC` |
| Tom 1 | P001_DEF | P00* | 002 | `1_002_P001_DEF` |
| Tom 1/Tom 1.1 | P001_GHI | P00* | 001 | `1---1-1_001_P001_GHI` |
| Tom 1/Tom 1.1 | P001_JKL | P00* | 002 | `1---1-1_002_P001_JKL` |
| Tom 2/Tom 2.1/Tom 2.1.5 | P001_MNO | P00* | 001 | `2---2-1---2-1-5_001_P001_MNO` |
| Tom 2/Tom 2.1/Tom 2.1.5 | P001_PQR | P00* | 002 | `2---2-1---2-1-5_002_P001_PQR` |
| Tom 1 | A001_ABC | Inny | - | *(pusta)* |
| Tom 2 | B002_DEF | Inny | - | *(pusta)* |

## Użycie

### 1. Dodanie kolumny

1. Załaduj dane Excel (kliknij "Załaduj wybrane pliki")
2. Upewnij się, że kolumny `Folder` i `FILE NUMBER` istnieją
3. W sekcji **"Finalne nazwy plików"** kliknij przycisk:
   ```
   ➕ Dodaj kolumnę "Final File Name"
   ```
4. Kolumna zostanie automatycznie dodana do tabeli

### 2. Ukrycie kolumny

Jeśli kolumna jest już dodana, możesz ją ukryć:
```
➖ Ukryj kolumnę "Final File Name"
```

### 3. Ponowne dodanie

Możesz wielokrotnie dodawać/ukrywać kolumnę. Przy każdym dodaniu numeracja jest przeliczana od nowa.

## Wymagania

### Kolumny wymagane:
- ✅ `Folder` - automatycznie generowana przy ładowaniu danych
- ✅ `FILE NUMBER` - musi istnieć w źródłowych plikach Excel

### Brak wymaganych kolumn:
- Jeśli brakuje którejś z kolumn, w konsoli pojawi się ostrzeżenie
- Kolumna `Final File Name` nie zostanie dodana

## Logika numerowania

### Grupowanie po folderze:
```javascript
// Każdy unikalny folder ma własną sekwencję numerów
Tom 1 → counter = 0
  → row 1: counter++ (001)
  → row 2: counter++ (002)
  
Tom 1/Tom 1.1 → counter = 0 (nowy folder!)
  → row 1: counter++ (001)
  → row 2: counter++ (002)
```

### Kod transformacji:
```typescript
// Transformacja "Tom 1/Tom 1.1" → "1---1-1"
const transformTomFolder = (folder: string) => {
  const parts = folder.split('/');
  const numbers = parts.map(part => 
    part.match(/Tom\s+(\d+(?:\.\d+)*)/i)?.[1]
  );
  const transformed = numbers.map(num => 
    num.replace(/\./g, '-')
  );
  return transformed.join('---');
};
```

## Implementacja

### Pliki:
- `src/components/FinalFileNameGenerator.tsx` - komponent główny
- `src/components/FinalFileNameGenerator.css` - style
- `src/components/WorkflowPanel.tsx` - integracja (jedna z 4 sekcji w linii)
- `src/components/WorkflowPanel.css` - layout 4 kolumn (każda 25%)

### Zależności:
- `useAppStore` - dostęp do danych Excel
- `updateLoadedData` - aktualizacja danych z nową kolumną

### Funkcje kluczowe:

#### `transformTomFolder(folder: string): string`
Przekształca hierarchię folderów na format `[tomy]`.

#### `generateFinalFileName(folder, fileNumber, sequenceNumber): string`
Łączy wszystkie składowe w finalną nazwę.

#### `handleAddColumn()`
Dodaje kolumnę `Final File Name` do danych:
1. Sprawdza czy wymagane kolumny istnieją
2. Iteruje po wierszach i grupuje po folderze
3. Generuje nazwy z sekwencyjną numeracją
4. Aktualizuje store

#### `handleHideColumn()`
Usuwa kolumnę z nagłówków i wierszy.

## UI/UX

### Stan początkowy:
```
┌─────────────────────────────────────────┐
│ ➕ Dodaj kolumnę "Final File Name"      │
│                                         │
│ 📝 Format nazwy: [tomy]_[numery]_[...]  │
└─────────────────────────────────────────┘
```

### Po dodaniu kolumny:
```
┌─────────────────────────────────────────┐
│ ➖ Ukryj kolumnę "Final File Name"      │
│ ✅ Kolumna dodana. Format: [...]        │
│                                         │
│ 📝 Format nazwy: [tomy]_[numery]_[...]  │
└─────────────────────────────────────────┘
```

### Podpowiedzi:
- 🔹 **tomy:** Tom 1/Tom 1.1 → 1---1-1 (tylko dla plików P00*)
- 🔹 **numery:** Sekwencyjny numer (001, 002, 003...)
- 🔹 **FILE NUMBER:** Oryginalna nazwa
- ⚠️ **P00* files:** Pełny format z [tomy]
- ⚠️ **Inne pliki:** Format bez [tomy], tylko [numery]_[FILE NUMBER]

## Testowanie

### Test 1: Dodanie kolumny
1. Załaduj dane Excel
2. Kliknij "Dodaj kolumnę"
3. Sprawdź tabelę - kolumna `Final File Name` powinna być ostatnia
4. Sprawdź kilka wierszy - format powinien być poprawny

### Test 2: Numeracja sekwencyjna
1. Znajdź wiersze z tym samym folderem (np. `Tom 1`)
2. Sprawdź numery - powinny rosnąć: 001, 002, 003...
3. Znajdź wiersze z innym folderem (np. `Tom 1/Tom 1.1`)
4. Sprawdź numery - powinny zacząć się od 001

### Test 3: Transformacja tomy
1. Sprawdź wiersz z `Tom 1` → nazwa powinna zaczynać się od `1_`
2. Sprawdź wiersz z `Tom 1/Tom 1.1` → nazwa powinna zaczynać się od `1---1-1_`
3. Sprawdź wiersz z `Tom 2/Tom 2.1/Tom 2.1.5` → `2---2-1---2-1-5_`

### Test 4: Ukrycie/ponowne dodanie
1. Kliknij "Ukryj kolumnę"
2. Kolumna znika z tabeli
3. Kliknij "Dodaj kolumnę" ponownie
4. Kolumna pojawia się z przeliczoną numeracją

## Troubleshooting

### Problem: Kolumna nie dodaje się
**Przyczyna:** Brak wymaganych kolumn `Folder` lub `FILE NUMBER`

**Rozwiązanie:**
1. Sprawdź czy dane zostały załadowane
2. Sprawdź konsolę - powinno być ostrzeżenie
3. Upewnij się, że plik Excel ma kolumnę zawierającą "file" i "number"

### Problem: Błędna numeracja
**Przyczyna:** Folder jest pusty lub niepoprawny

**Rozwiązanie:**
1. Sprawdź kolumnę `Folder` - czy jest wypełniona?
2. Jeśli pusty folder, wszystkie wiersze z pustym folderem dostaną osobną sekwencję

### Problem: Dziwne znaki w nazwie
**Przyczyna:** FILE NUMBER zawiera specjalne znaki

**Rozwiązanie:**
- Komponent nie sanityzuje FILE NUMBER - używa wartości "as-is"
- Jeśli potrzebna sanityzacja, dodaj funkcję czyszczącą

## Przyszłe rozszerzenia

### Możliwe ulepszenia:
1. **Sanityzacja FILE NUMBER** - usuwanie niedozwolonych znaków
2. **Export do CSV** - eksport samej kolumny Final File Name
3. **Podgląd przed dodaniem** - modal z przykładowymi nazwami
4. **Konfiguracja separatorów** - możliwość zmiany `---` na inny separator
5. **Walidacja długości** - ostrzeżenie o za długich nazwach (>255 znaków)

---

**Data:** 7 października 2025  
**Wersja:** v1.0.0  
**Status:** ✅ Gotowe do użycia
