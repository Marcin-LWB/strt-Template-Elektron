# CPK-Export-Weryfikacja

**Wersja:** v1.0.0 | **UI:** Redesign v2 | **Data:** 2025-10-07

Aplikacja desktopowa (Electron + React), która usprawnia weryfikację i eksport zasobów multimedialnych na podstawie arkuszy Excel.

**Status:** ✅ Iteration 0 + 1 + 2 Complete

---

## 🚀 Szybki start

```bash
# Instalacja zależności
npm install

# Uruchomienie w trybie developerskim (Browser)
npm run dev

# Uruchomienie w trybie Electron
npm run electron:dev

# Build produkcyjny
npm run build
```

**Otwórz aplikację:** http://localhost:5173

---

## ✨ Nowości w UI Redesign v2

### 🎨 Zwijany Panel Roboczy
- Jeden panel zawierający **Pliki Excel** i **Sprawdź pliki PDF**
- Możliwość zwijania/rozwijania dla większej przestrzeni roboczej
- Layout 1/5 (Excel) + 4/5 (PDF Checker)

### ⚡ Domyślne ścieżki projektu
- Konfiguracja w `src/config/defaultPaths.json`
- Szybkie ładowanie jednym kliknięciem (⚡ Domyślna)
- 3 predefiniowane ścieżki: Excel, PDF źródło, PDF cel

### 🔢 Numeracja 4-cyfrowa
- Pliki PDF kopiowane z formatem: `0001_P001XXX.pdf`
- Zamiast: `1_P001XXX.pdf`
- Profesjonalny format zgodny ze standardami

### 📖 Dokumentacja
- **[QUICKSTART.md](./QUICKSTART.md)** - Szybki start i podstawy użytkowania
- **[USER_GUIDE.md](./USER_GUIDE.md)** - Przewodnik użytkownika
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Log implementacji i postęp
- **[ITERATION2_SUMMARY.md](./ITERATION2_SUMMARY.md)** - Podsumowanie Iteration 2
- **[UI_REDESIGN_V2.md](./UI_REDESIGN_V2.md)** - Szczegółowy changelog
- **[UI_VISUAL_GUIDE.md](./UI_VISUAL_GUIDE.md)** - Wizualna dokumentacja
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architektura techniczna
- **[DOCS_INDEX.md](./DOCS_INDEX.md)** - Indeks wszystkich dokumentów

### 🎯 Ukończone funkcjonalności (Iteration 0-2)
- ✅ Wybór folderów i skanowanie plików Excel
- ✅ Ładowanie i łączenie wielu plików .xlsx
- ✅ Zachowanie kolorów wierszy z Excela
- ✅ Dynamiczne wyświetlanie kolumn
- ✅ Ekstrakcja hierarchii folderów (Tom 1, Tom 1/Tom 1.1)
- ✅ **Filtrowanie tagami folderów** (kolory hierarchiczne)
- ✅ **Wyszukiwanie dynamiczne** (FILE NUMBER, FILE TITLE)
- ✅ **Zwijane panele filtrów**
- ✅ **Reset filtrów**

---

## Misja i cele

- � **Weryfikacja danych** – konsolidacja i kontrola jakości danych z wielu arkuszy Excel.
- 🧮 **Automatyzacja operacji** – kopiowanie, numerowanie i strukturyzowanie plików według reguł opisanych w Excelach.
- 🎯 **Porównanie źródeł** – szybkie zestawienie zawartości Excel vs pliki w katalogach, z wizualnym wyróżnianiem różnic.
- 🧩 **Modułowość** – możliwość rozbudowy o kolejne narzędzia bez przebudowy rdzenia.

## Docelowe persony i scenariusze

| Persona | Potrzeba | Najważniejsze ekrany |
| --- | --- | --- |
| Koordynator produkcji | Zidentyfikować brakujące nagrania/zdjęcia względem arkusza Excel | Panel plików, widok porównań | 
| Analityk danych | Zweryfikować poprawność struktury arkusza i przygotować dane do eksportu | Łączenie arkuszy, tabela wynikowa |
| Asystent techniczny | Szybko skopiować i ponumerować zasoby zgodnie z instrukcją | Moduł operacji na plikach |

## Modułowa architektura logiczna

1. **Shell aplikacji (Electron + React)**  
  - startuje okno, ładuje bundlowany frontend, wystawia IPC dla operacji plikowych, zarządza aktualizacjami.
2. **Workspace Manager**  
  - wskazuje folder roboczy, przechowuje ścieżki i metadane plików `xlsx`, pozwala zaznaczać pliki (checkboxy) i zapamiętuje wybór.
3. **Excel Processing Service**  
  - odczyt arkuszy (SheetJS/ExcelJS), pobieranie nagłówków, łączenie pierwszych arkuszy, odwzorowanie kolorów z drugiej kolumny, eksport intermediate data.
4. **Verification Engine**  
  - porównuje dane arkuszy z realnym stanem plików, generuje raport różnic, wspiera kolorowanie/zaznaczanie rekordów wymagających akcji.
5. **File Operations Service**  
  - kopiowanie i numerowanie plików, tworzenie struktury katalogów, walidacja ścieżek docelowych, obsługa konfliktów i log błędów.
6. **Presentation / UI Layer**  
  - zarządzanie stanem (np. Zustand/Redux Toolkit), widoki tabelaryczne, panel statusów, logi operacji, moduł konfiguracyjny.
7. **Persistencja i konfiguracja**  
  - ustawienia użytkownika, parametry (liczba analizowanych kolumn, mapowanie kolorów, reguły numeracji) w `appConfig.json` lub IndexedDB.

## Proponowana struktura katalogów

```
cpk-export-weryfikacja/
├── apps/
│   ├── desktop-shell/          # Proces główny Electron + preload
│   └── renderer/               # Aplikacja React (Vite)
├── packages/
│   ├── excel-engine/           # Logika odczytu i łączenia arkuszy
│   ├── verification-core/      # Porównania, reguły, raporty
│   ├── file-automation/        # Operacje kopiowania, numerowania, tworzenia katalogów
│   └── ui-toolkit/             # Reużywalne komponenty UI (tabela, statusy, kolorowanie)
├── resources/                  # Szablony raportów, ikony, style globalne
├── configs/
│   ├── app-config.schema.json  # Walidacja ustawień
│   └── environments/           # Profile (dev, staging, production)
├── scripts/                    # Automatyzacje (build, release, lint)
└── docs/
   └── architecture.md         # Bieżące notatki techniczne
```

> Startowo repo może wykorzystać istniejącą strukturę Vite/Electron, ale powyższy układ ułatwia późniejszy podział na pakiety oraz testowanie jednostkowe poza rendererem.

## Kluczowe przepływy użytkownika

1. **Wybór plików źródłowych**
  - użytkownik wybiera folder zawierający `xlsx`, aplikacja skanuje go i prezentuje listę z checkboxami.
  - Workspace Manager zapamiętuje wybór oraz ostatnio użyte lokalizacje.

2. **Ładowanie i łączenie arkuszy**
  - po kliknięciu „Załaduj” Excel Processing Service:
    - otwiera pierwszy arkusz każdego wybranego pliku,
    - odczytuje nagłówki z pierwszego wiersza,
    - importuje konfigurację liczby kolumn (domyślnie 10, możliwość zmiany),
    - mapuje kolory z drugiej kolumny (np. zapisuje jako `rowColor` w modelu danych),
    - tworzy spójną tabelę wynikową przekazywaną do UI.

3. **Weryfikacja plików vs Excel**
  - Verification Engine zestawia rekordy z fizycznymi plikami:
    - obsługa wielu lokalizacji źródłowych,
    - raport braków/nadmiarów,
    - sugestie zmian (np. brakujące pliki, błędne nazwy).
  - Wyniki trafiają do UI z możliwością filtrowania i kolorowania.

4. **Operacje automatyzujące**
  - File Operations Service wykonuje kopiowanie i numerację zgodnie z regułami z arkusza,
  - tworzy strukturę katalogów (np. sezon/odcinek/ujęcie),
  - prowadzi log działań (pomyślne, ostrzeżenia, błędy).

5. **Kolorowanie/aktualizacja arkuszy**
  - moduł Excel może zwrotnie aktualizować kolory w arkuszu (np. oznaczać poprawione rekordy),
  - eksport zmian do osobnego pliku `xlsx` lub zapis bezpośredni.

## Warstwy techniczne i komunikacja

- **IPC (Electron)** – jasne kanały `main ↔ preload ↔ renderer` z kontraktami TypeScript (np. tRPC, zod).
- **Excel engine** – biblioteka (np. ExcelJS) pracująca w procesie głównym lub workerze Node (ze względu na potrzebę pełnych uprawnień do systemu plików).
- **Przechowywanie konfiguracji** – pliki JSON + persisted store (Zustand/Redux) w rendererze.
- **Logowanie** – centralny logger (np. Pino/Winston) z możliwością eksportu logów do CSV.

## Parametryzacja i rozszerzalność

- Liczba analizowanych kolumn (domyślnie 10) – przechowywana w ustawieniach, edytowalna z UI.
- Mapowanie kolorów wierszy – konfiguracja per projekt (np. `zielony = gotowy`, `czerwony = brakuje pliku`).
- Reguły numeracji i struktury katalogów – deklaratywne w formie szablonów (np. `${episode}_${scene}_${take}`).
- Dodawanie nowych narzędzi – każdy moduł w packages/ może wystawić własny panel w UI (dynamiczny routing/registry modułów).

## Roadmapa wdrożenia

1. **Iteracja 0 – fundament**
  - Przeniesienie istniejącego szablonu do układu Electron + React + TypeScript.
  - Konfiguracja IPC, struktura folderów, setup loggera i store.

2. **Iteracja 1 – wybór i ładowanie plików**
  - UI listy plików `xlsx` z checkboxami.
  - Implementacja „Załaduj” z odczytem pierwszego arkusza i budową tabeli.

3. **Iteracja 2 – prezentacja danych**
  - Widok tabelaryczny (kolumny dynamiczne, kolory wierszy), filtry, zapis presetów.

4. **Iteracja 3 – weryfikacja i raporty**
  - Mechanizmy porównawcze, generacja różnic, eksport raportów.

5. **Iteracja 4 – operacje na plikach**
  - Kopiowanie, numerowanie, tworzenie struktury katalogów, obsługa błędów.

6. **Iteracja 5 – ergonomia i automatyzacja**
  - Konfiguracja projektów, kolorowanie w Excelu, integracje dodatkowe.

## Testowanie i jakość

- **Testy jednostkowe** dla pakietów `excel-engine`, `verification-core`, `file-automation` (np. Vitest/Jest).
- **Testy integracyjne** procesów plikowych w środowisku Node (mock systemu plików).
- **Testy E2E** renderer + Electron (np. Playwright) dla krytycznych przepływów (wybór plików, generacja raportu).
- **Walidacja danych** – schematy z Zod/TypeBox dla rekordów wczytanych z Excela.

## Wizja dalszego rozwoju

- Integracja z chmurą (S3/SharePoint) jako alternatywne źródło plików.
- Harmonogramy zadań (watcher zmian na dysku + auto-raport).
- Moduł plug-inów: pozwalać organizacjom dostarczać własne reguły weryfikacji.
- Telemetria i monitorowanie błędów (Sentry) z poszanowaniem prywatności.

---

> Niniejszy dokument stanowi umowny blueprint projektu „CPK-Export-Weryfikacja”. Na jego podstawie można rozpocząć implementację modułami, iteracyjnie rozwijając aplikację w kontrolowany sposób.