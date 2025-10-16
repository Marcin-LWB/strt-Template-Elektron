# Start Template# Start Template



**Wersja:** v1.0.0 | **Typ:** Szablon Electron | **Data:** 2025-10-16**Wersja:** v1.0.0 | **Typ:** Szablon ---



Szablon aplikacji desktopowej (Electron + React + TypeScript) z podstawową funkcjonalnością przetwarzania plików Excel.## 🎯 Cel szablonu



**Status:** ✅ Szablon gotowy do użycia**Start Template** to gotowy do użycia szablon aplikacji Electron z React, który zapewnia:



---- 🚀 **Szybki start** – kompletna konfiguracja Electron + React + TypeScript

- 📊 **Excel processing** – podstawowa obsługa plików Excel (wybór, ładowanie, wyświetlanie)

## 🚀 Szybki start- 🏗️ **Modułowa struktura** – łatwe rozszerzanie o nowe funkcjonalności

- 🎨 **UI Components** – gotowe komponenty interfejsu użytkownika

```bash- ⚙️ **Development tools** – ESLint, TypeScript, Vite dev server | **Data:** 2025-10-16

# Instalacja zależności

npm installSzablon aplikacji desktopowej (Electron + React + TypeScript) z podstawową funkcjonalnością przetwarzania plików Excel.



# Uruchomienie w trybie developerskim (Browser)**Status:** ✅ Szablon gotowy do użycia

npm run dev

---

# Uruchomienie w trybie Electron

npm run electron:dev## 🚀 Szybki start



# Build produkcyjny```bash

npm run build# Instalacja zależności

```npm install



**Otwórz aplikację:** http://localhost:5173# Uruchomienie w trybie developerskim (Browser)

npm run dev

---

# Uruchomienie w trybie Electron

## ✨ Funkcjonalności szablonunpm run electron:dev



### 🏗️ Architektura aplikacji# Build produkcyjny

- **Electron 33** - framework aplikacji desktopowejnpm run build

- **React 19** - interfejs użytkownika z komponentami funkcyjnymi```

- **TypeScript** - bezpieczność typów i lepsze DX

- **Vite 7** - szybki build tool i dev server**Otwórz aplikację:** http://localhost:5173

- **Zustand** - lekkie zarządzanie stanem

---

### 📊 Podstawowe komponenty

- **ExcelFilePicker** - wybór i skanowanie plików Excel## ✨ Funkcjonalności szablonu

- **ExcelDataTable** - wyświetlanie danych w tabeli

- **WorkflowPanel** - 4-sekcyjny panel workflow### �️ Architektura aplikacji

- **CollapsiblePanel** - zwijane panele UI- **Electron 33** - framework aplikacji desktopowej

- **React 19** - interfejs użytkownika z komponentami funkcyjnymi

### 🔧 Gotowe funkcjonalności- **TypeScript** - bezpieczność typów i lepsze DX

- ✅ Wybór folderów i plików Excel (File System Access API + Electron)- **Vite 7** - szybki build tool i dev server

- ✅ Ładowanie i parsowanie plików .xlsx (ExcelJS)- **Zustand** - lekkie zarządzanie stanem

- ✅ Podstawowe wyświetlanie danych w tabeli

- ✅ Export danych do Excel### � Podstawowe komponenty

- ✅ Responsywny layout z trzema głównymi sekcjami- **ExcelFilePicker** - wybór i skanowanie plików Excel

- ✅ Zarządzanie stanem przez Zustand- **ExcelDataTable** - wyświetlanie danych w tabeli

- ✅ Typescript konfiguracja i linting- **WorkflowPanel** - 4-sekcyjny panel workflow

- **CollapsiblePanel** - zwijane panele UI

### 📖 Dokumentacja

- **[QUICKSTART.md](./QUICKSTART.md)** - Szybki start i instrukcje### 🔧 Gotowe funkcjonalności

- **[agents.md](./agents.md)** - Dokumentacja techniczna dla developerów- ✅ Wybór folderów i plików Excel (File System Access API + Electron)

- ✅ Ładowanie i parsowanie plików .xlsx (ExcelJS)

---- ✅ Podstawowe wyświetlanie danych w tabeli

- ✅ Export danych do Excel

## 🎯 Cel szablonu- ✅ Responsywny layout z trzema głównymi sekcjami

- ✅ Zarządzanie stanem przez Zustand

**Start Template** to gotowy do użycia szablon aplikacji Electron z React, który zapewnia:- ✅ Typescript konfiguracja i linting



- 🚀 **Szybki start** – kompletna konfiguracja Electron + React + TypeScript### 📖 Dokumentacja

- 📊 **Excel processing** – podstawowa obsługa plików Excel (wybór, ładowanie, wyświetlanie)- **[QUICKSTART.md](./QUICKSTART.md)** - Szybki start i instrukcje

- 🏗️ **Modułowa struktura** – łatwe rozszerzanie o nowe funkcjonalności- **[agents.md](./agents.md)** - Dokumentacja techniczna dla developerów

- 🎨 **UI Components** – gotowe komponenty interfejsu użytkownika

- ⚙️ **Development tools** – ESLint, TypeScript, Vite dev server---



## 📁 Struktura projektu## Misja i cele



```- � **Weryfikacja danych** – konsolidacja i kontrola jakości danych z wielu arkuszy Excel.

start-template/- 🧮 **Automatyzacja operacji** – kopiowanie, numerowanie i strukturyzowanie plików według reguł opisanych w Excelach.

├── electron/                   # Proces główny Electron- 🎯 **Porównanie źródeł** – szybkie zestawienie zawartości Excel vs pliki w katalogach, z wizualnym wyróżnianiem różnic.

│   ├── main.js                # Entry point Electron- 🧩 **Modułowość** – możliwość rozbudowy o kolejne narzędzia bez przebudowy rdzenia.

│   ├── preload.js             # Preload script dla IPC

│   └── services/              # Serwisy backendowe## Docelowe persony i scenariusze

├── public/                    # Zasoby statyczne

├── src/                       # Kod źródłowy React| Persona | Potrzeba | Najważniejsze ekrany |

│   ├── components/            # Komponenty UI| --- | --- | --- |

│   ├── store/                 # Zarządzanie stanem (Zustand)| Koordynator produkcji | Zidentyfikować brakujące nagrania/zdjęcia względem arkusza Excel | Panel plików, widok porównań | 

│   ├── types/                 # Definicje TypeScript| Analityk danych | Zweryfikować poprawność struktury arkusza i przygotować dane do eksportu | Łączenie arkuszy, tabela wynikowa |

│   └── utils/                 # Funkcje pomocnicze| Asystent techniczny | Szybko skopiować i ponumerować zasoby zgodnie z instrukcją | Moduł operacji na plikach |

├── package.json               # Konfiguracja i zależności

├── tsconfig.json              # Konfiguracja TypeScript## Modułowa architektura logiczna

├── vite.config.ts             # Konfiguracja Vite

└── eslint.config.js           # Konfiguracja lintera1. **Shell aplikacji (Electron + React)**  

```  - startuje okno, ładuje bundlowany frontend, wystawia IPC dla operacji plikowych, zarządza aktualizacjami.

2. **Workspace Manager**  

## 🚀 Jak zacząć  - wskazuje folder roboczy, przechowuje ścieżki i metadane plików `xlsx`, pozwala zaznaczać pliki (checkboxy) i zapamiętuje wybór.

3. **Excel Processing Service**  

1. **Klonuj szablon:**  - odczyt arkuszy (SheetJS/ExcelJS), pobieranie nagłówków, łączenie pierwszych arkuszy, odwzorowanie kolorów z drugiej kolumny, eksport intermediate data.

   ```bash4. **Verification Engine**  

   git clone <url-szablonu> my-electron-app  - porównuje dane arkuszy z realnym stanem plików, generuje raport różnic, wspiera kolorowanie/zaznaczanie rekordów wymagających akcji.

   cd my-electron-app5. **File Operations Service**  

   ```  - kopiowanie i numerowanie plików, tworzenie struktury katalogów, walidacja ścieżek docelowych, obsługa konfliktów i log błędów.

6. **Presentation / UI Layer**  

2. **Zainstaluj zależności:**  - zarządzanie stanem (np. Zustand/Redux Toolkit), widoki tabelaryczne, panel statusów, logi operacji, moduł konfiguracyjny.

   ```bash7. **Persistencja i konfiguracja**  

   npm install  - ustawienia użytkownika, parametry (liczba analizowanych kolumn, mapowanie kolorów, reguły numeracji) w `appConfig.json` lub IndexedDB.

   ```

## Proponowana struktura katalogów

3. **Uruchom w trybie developerskim:**

   ```bash```

   npm run dev          # Browser modecpk-export-weryfikacja/

   npm run electron:dev # Electron mode├── apps/

   ```│   ├── desktop-shell/          # Proces główny Electron + preload

│   └── renderer/               # Aplikacja React (Vite)

4. **Buduj i dostosowuj:**├── packages/

   - Edytuj komponenty w `src/components/`│   ├── excel-engine/           # Logika odczytu i łączenia arkuszy

   - Dodaj nowe funkcjonalności w `src/store/`│   ├── verification-core/      # Porównania, reguły, raporty

   - Rozszerzaj typy w `src/types/`│   ├── file-automation/        # Operacje kopiowania, numerowania, tworzenia katalogów

│   └── ui-toolkit/             # Reużywalne komponenty UI (tabela, statusy, kolorowanie)

## 🔧 Dostępne komendy├── resources/                  # Szablony raportów, ikony, style globalne

├── configs/

```bash│   ├── app-config.schema.json  # Walidacja ustawień

npm run dev              # Uruchom Vite dev server│   └── environments/           # Profile (dev, staging, production)

npm run electron:dev     # Uruchom w trybie Electron├── scripts/                    # Automatyzacje (build, release, lint)

npm run build            # Build produkcyjny└── docs/

npm run preview          # Podgląd build'a   └── architecture.md         # Bieżące notatki techniczne

npm run lint             # Uruchom ESLint```

```

> Startowo repo może wykorzystać istniejącą strukturę Vite/Electron, ale powyższy układ ułatwia późniejszy podział na pakiety oraz testowanie jednostkowe poza rendererem.

---

## Kluczowe przepływy użytkownika

**Start Template** - gotowy punkt startowy dla aplikacji Electron z React i TypeScript 🚀
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