# 📘 Przewodnik użytkownika - CPK Export Weryfikacja v1.0 (UI v2)

## 🚀 Szybki start

### Uruchomienie aplikacji

**Tryb Electron (Desktop):**
```bash
npm run dev
# lub
npm run electron:dev
```

**Tryb Browser (Chrome/Edge):**
```bash
npm run dev
# Otwórz http://localhost:5173
```

---

## 🎯 Główne funkcje

### 1️⃣ Panel roboczy (Zwijany)

Po uruchomieniu aplikacji zobaczysz główny panel roboczy podzielony na dwie sekcje:

```
┌──────────────────────────────────────────────────────────┐
│ ▼ Panel roboczy - Zarządzanie plikami                     │
├──────────────┬───────────────────────────────────────────┤
│ 📊 Excel     │ 🔍 PDF Checker                            │
│ (20% ekranu) │ (80% ekranu)                              │
└──────────────┴───────────────────────────────────────────┘
```

**Aby zwinąć/rozwinąć panel:** Kliknij na nagłówek "▼ Panel roboczy"

---

### 2️⃣ Sekcja Excel (lewa strona)

#### A. Wybór plików Excel

1. **Kliknij** przycisk `📂 Wybierz folder`
2. **Wskaż** folder zawierający pliki `.xlsx`
3. **Zaznacz** checkbox `Skanuj podkatalogi` jeśli pliki są w podfolderach
4. **Wybierz** pliki do załadowania (checkboxy)

**Skrót - Domyślna ścieżka (tylko Electron):**
- Domyślna lokalizacja plików Excel jest zapisana w `src/config/defaultPaths.json`
- Ścieżka: `P:\PROJEKTY\2206_CPK_BARANOW\...\DRUKOWANIE DOKUMENTACJI`

#### B. Ładowanie danych

1. **Zaznacz** pliki Excel (checkboxy)
2. **Kliknij** `📥 Załaduj wybrane pliki`
3. **Poczekaj** na wczytanie (pojawi się podsumowanie)

**Wynik:**
```
✅ Załadowano: 245 wierszy z 3 plików
```

---

### 3️⃣ Sekcja PDF Checker (prawa strona)

#### A. Sprawdzanie istnienia plików PDF

**Krok 1: Wybierz folder źródłowy**
- **Opcja 1:** Kliknij `📁 Folder źródłowy PDF` i wybierz ręcznie
- **Opcja 2:** Kliknij `⚡ Domyślna` (tylko Electron) - załaduje domyślną ścieżkę

**Krok 2: Sprawdź pliki**
- Kliknij `✓ Sprawdź pliki P001`
- Aplikacja przeszukuje folder i porównuje z FILE NUMBER rozpoczynającymi się od "P001"

**Wynik:**
- W tabeli danych pojawi się kolumna "Exist"
- `✅ TAK + ścieżka` - plik istnieje
- `❌ BRAK` - plik nie został znaleziony

#### B. Kopiowanie znalezionych plików

**Krok 3: Wybierz folder docelowy**
- **Opcja 1:** Kliknij `📦 Folder docelowy` i wybierz ręcznie
- **Opcja 2:** Kliknij `⚡ Domyślna` (tylko Electron)

**Krok 4: Kopiuj pliki**
- Kliknij `💾 Kopiuj znalezione`
- Pliki zostaną skopiowane z numeracją 4-cyfrową

**Format nazwy pliku:**
```
0001_P001XXX.pdf
0002_P001YYY.pdf
0045_P001ZZZ.pdf  ← 4 cyfry!
```

---

## ⚙️ Konfiguracja

### Panel konfiguracji (prawy górny róg)

Kliknij `⚙️ Konfiguracja` aby zmienić ustawienia:

#### Tryb wyświetlania kolumn
- **Wszystkie kolumny** - odczytuje wszystkie kolumny z pliku Excel
- **Wybrane kolumny** - tylko konfigurowane kolumny

#### Parametry odczytu
- **Liczba kolumn do odczytu** (1-50, domyślnie: 10)
- **Indeks kolumny z kolorem** (0-based, domyślnie: 1)
- **Pomijaj puste wiersze** (checkbox)
- **Indeks wiersza nagłówków** (0-based, domyślnie: 0)

**Przywróć domyślne:** Kliknij link na dole panelu konfiguracji

---

## 🗂️ Domyślne ścieżki projektu

### Edycja ścieżek

**Plik:** `src/config/defaultPaths.json`

```json
{
  "excelSourcePath": "P:\\PROJEKTY\\...",
  "pdfSourcePath": "P:\\PROJEKTY\\...",
  "pdfDestinationPath": "P:\\PROJEKTY\\..."
}
```

**Jak zmienić:**
1. Otwórz plik w edytorze
2. Zmień ścieżki (użyj podwójnych backslash `\\` w Windows)
3. Zapisz plik
4. Przebuduj aplikację: `npm run build`

**Uwaga:** Ścieżki działają tylko w trybie Electron!

---

## 📊 Tabela danych

### Kolumny specjalne

Po sprawdzeniu plików pojawią się dodatkowe kolumny:

- **Exist** - status istnienia pliku PDF
  - `✅ TAK` - plik znaleziony + pełna ścieżka
  - `❌ BRAK` - plik nie istnieje

### Kolorowanie wierszy

Jeśli Twój Excel ma kolorowe wiersze w **drugiej kolumnie** (indeks 1):
- Kolory zostaną zachowane w tabeli
- Możesz zmienić kolumnę w konfiguracji: `Indeks kolumny z kolorem`

---

## 🔧 Rozwiązywanie problemów

### Problem 1: "Nie znaleziono kolumny FILE NUMBER"
**Rozwiązanie:** Upewnij się, że w pliku Excel jest kolumna zawierająca "file" i "number" w nazwie.

### Problem 2: "Brak uprawnień do odczytu folderu"
**Rozwiązanie (Browser mode):** 
- Wybierz ponownie folder źródłowy
- Przeglądarka poprosi o uprawnienia - zaakceptuj

### Problem 3: "Numeracja plików nieprawidłowa"
**Sprawdź:**
- Czy w pliku Excel kolumna "FILE NUMBER" ma wartości
- Czy wartości zaczynają się od "P001"

### Problem 4: Domyślne ścieżki nie działają
**Powód:** Domyślne ścieżki działają tylko w trybie **Electron**!
**Rozwiązanie:** Uruchom `npm run electron:dev` zamiast `npm run dev`

---

## 💡 Wskazówki

### ✅ Dobre praktyki

1. **Zawsze zaznaczaj "Skanuj podkatalogi"** jeśli pliki są w wielu folderach
2. **Sprawdź pliki przed kopiowaniem** - kolumna "Exist" pokaże co zostanie skopiowane
3. **Używaj domyślnych ścieżek** dla szybszego workflow (Electron)
4. **Zaznacz tylko potrzebne pliki Excel** - przyspiesza ładowanie

### ⚡ Skróty klawiszowe

- **Zwiń/rozwiń panel:** Kliknij nagłówek lub Enter na fokusie
- **Zaznacz wszystkie pliki:** Przycisk w sekcji Excel
- **Odznacz wszystkie:** Przycisk w sekcji Excel

---

## 📈 Workflow krok po kroku

### Typowy scenariusz pracy:

```
1. Uruchom aplikację
   ↓
2. [Excel] Wybierz folder z plikami .xlsx
   ↓
3. [Excel] Zaznacz pliki do załadowania
   ↓
4. [Excel] Kliknij "Załaduj wybrane pliki"
   ↓
5. [PDF] Kliknij "⚡ Domyślna" (folder źródłowy)
   ↓
6. [PDF] Kliknij "✓ Sprawdź pliki P001"
   ↓
7. Sprawdź kolumnę "Exist" w tabeli danych
   ↓
8. [PDF] Kliknij "⚡ Domyślna" (folder docelowy)
   ↓
9. [PDF] Kliknij "💾 Kopiuj znalezione"
   ↓
10. Gotowe! Pliki skopiowane z numeracją 0001, 0002, ...
```

---

## 🆘 Wsparcie

### Logi (tylko Electron)
Aplikacja zapisuje logi operacji w konsoli Electron.

### Browser console
W trybie przeglądarki otwórz Developer Tools (F12) aby zobaczyć logi.

### GitHub Issues
Zgłaszanie błędów: [Marcin-LWB/cpk-exportDocu/issues](https://github.com/Marcin-LWB/cpk-exportDocu/issues)

---

**Wersja aplikacji:** v1.0.0  
**Wersja UI:** Redesign v2  
**Data:** 2025-10-06
