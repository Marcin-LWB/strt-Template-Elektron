
# 🤖 agents.md (FSD) – Electron + React App

Functional Specification Document dla warstw/agentów aplikacji typu:  
**React (Renderer) + Electron (Main/Preload) + Excel/FS Services**

---

## 0️⃣ Cel dokumentu

Ten dokument definiuje:
- Role i odpowiedzialności *agentów* (procesów warstwowych)
- Kontrakty komunikacji (IPC + typy I/O)
- Zasady bezpieczeństwa, jakości (DoD), wydajności (NFR)
- Scenariusze użytkowe i obsługę błędów

> `agents.md` opisuje **sposób pracy aplikacji**, a nie instalację czy build.  
> Instrukcje techniczne znajdują się w `architecture.md` lub `README.md`.

---

## 1️⃣ Agenci / Warstwy (Roles & Responsibilities)

### 🖥️ Renderer Agent (React UI)
| Aspekt           | Opis |
|------------------|------|
| Cel              | Interakcja z użytkownikiem, prezentacja danych |
| Odpowiada za     | Eventy UI, Zustand Store, renderowanie tabel |
| Komunikuje się   | IPC → Preload (żądania FS/Excel) |
| Anti-scope       | Brak dostępu do Node.js / fs / OS |

---

### 🔗 Preload Agent (Bridge IPC)
| Aspekt           | Opis |
|------------------|------|
| Cel              | Bezpieczny pomost Renderer ↔ Main |
| Odpowiada za     | `contextIsolation`, walidacja IPC, `window.api` |
| Komunikuje się   | Renderer ↔ Main (IPC channels) |
| Anti-scope       | Brak logiki biznesowej (tylko forwarding & whitelisting) |

---

### ⚙️ Main Agent (Electron Main Process)
| Aspekt           | Opis |
|------------------|------|
| Cel              | Orkiestracja aplikacji, tworzenie okien |
| Odpowiada za     | Obsługa IPC, delegacja do services |
| Komunikuje się   | Services (fileService, excelService) |
| Anti-scope       | Renderowanie UI, logika komponentów React |

---

### 📁 FileScan Agent (Service)
| Aspekt           | Opis |
|------------------|------|
| Cel              | Rekurencyjne skanowanie folderów, filtry plików |
| Wejścia (IPC)    | `fs/pickDir`, `fs/scan` |
| Wyjścia          | Lista plików, metadane, sygnały progresu |
| Anti-scope       | Parsowanie zawartości plików |

---

### 📊 Excel Agent (Service)
| Aspekt           | Opis |
|------------------|------|
| Cel              | Odczyt i eksport CSV/XLSX (ExcelJS) |
| Wejścia (IPC)    | `excel/parse`, `excel/export` |
| Wyjścia          | Tabele, typy kolumn, statystyki, raport błędów |
| Anti-scope       | UI i wybór katalogów |

---

## 2️⃣ Kontrakty IPC – Źródło prawdy

### 2.1 Struktura żądań

```ts
// fs/scan (Renderer → Preload → Main)
type FsScanReq = {
  requestId: string;
  rootPath?: string;     // Electron
  patterns: string[];    // ["*.csv", "*.xlsx"]
  recursive: boolean;
  maxDepth?: number;
};

// excel/parse
type ExcelParseReq = {
  requestId: string;
  filePath: string;
  sheet?: string|number;
  headerRow?: number;
};
````

### 2.2 Struktura odpowiedzi

```ts
type Ok<T> = { requestId: string; status: "ok"; data: T };
type Err = { requestId: string; status: "error"; code: string; message: string };

type FsScanRes = {
  files: Array<{ path: string; name: string; size: number; mtime: number }>;
};

type ExcelParseRes = {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  stats: { rows: number; cols: number; warnings: string[] };
};
```

**Pełna lista kanałów →** `ipc-contracts.md`

---

## 3️⃣ Bezpieczeństwo (Security Policies)

| Zasada             | Wymaganie                                    |
| ------------------ | -------------------------------------------- |
| `contextIsolation` | MUST be ON                                   |
| `nodeIntegration`  | MUST be OFF in Renderer                      |
| Uprawnienia FS     | Tylko przez user dialog / File System Access |
| Dane wrażliwe      | Brak trwałego logowania zawartości komórek   |
| Limity plików      | Max. rozmiar / timeout parsing               |

---

## 4️⃣ NFR – Non-Functional Requirements

| Obszar       | Parametr                                       |
| ------------ | ---------------------------------------------- |
| Wydajność    | ≥1000 plików/s przy skanowaniu                 |
| UI           | Zero blokowania głównego wątku                 |
| Stabilność   | Retry 1x, poprawne komunikaty błędów           |
| Portowalność | Windows / macOS / Linux, Browser (Chrome/Edge) |

---

## 5️⃣ Definition of Done (DoD)

✔ Każdy agent ma zdefiniowany kontrakt IPC
✔ UI wyświetla progres, błędy i retry
✔ contextIsolation i preload przetestowane
✔ Ścieżka: Pick → Scan → Parse → Export działa
✔ Testy błędów: brak dostępu / zły plik / timeout

---

## 6️⃣ Scenariusze (Playbooks)

### 📂 Import CSV/XLSX (end-to-end)

1️⃣ Użytkownik klik „Wybierz folder” → `fs/pickDir`
2️⃣ Renderer → `fs/scan`
3️⃣ FileScan → progres → lista plików
4️⃣ UI → wybór → `excel/parse`
5️⃣ ExcelAgent → kolumny + dane → tabela React

---

### 📤 Eksport do Excel

1️⃣ UI → `excel/export`
2️⃣ ExcelAgent → zapis XLSX
3️⃣ Main zwraca ścieżkę
4️⃣ UI: „Plik zapisany jako …”

---

## 7️⃣ Obsługa błędów

| Kod                | Znaczenie                  |
| ------------------ | -------------------------- |
| `FS_NO_PERMISSION` | Brak dostępu do katalogu   |
| `FS_NOT_FOUND`     | Plik przeniesiony/usunięty |
| `XLS_PARSE_FAIL`   | Niepoprawny format XLS/CSV |
| `TOO_LARGE`        | Przekroczony limit danych  |
| `TIMEOUT`          | Operacja trwa zbyt długo   |

---

## 8️⃣ Telemetria (Dev Mode)

* Log IPC: kanał + czas (ms)
* Bez danych użytkownika
* Statystyki: liczba plików, czas skanowania, błędy parsowania

---

## 9️⃣ Testy Akceptacyjne (UAT)

| ID     | Scenariusz                             |
| ------ | -------------------------------------- |
| UAT-01 | Skan 2000 plików z progres barem       |
| UAT-02 | Brak uprawnień → komunikat + retry     |
| UAT-03 | Import 50k wierszy CSV + walidacja     |
| UAT-04 | Eksport XLSX + link „Pokaż w folderze” |

---

## 🔗 Referencje

* `architecture.md` – struktura projektu + build
* `ipc-contracts.md` – pełne kanały IPC i typy
* `types.ts` – TS source of truth (rekordy, dane)
* `security.md` – rozszerzona polityka dostępu

---

**Koniec dokumentu `agents.md` ✦**

```

---


