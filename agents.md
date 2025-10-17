# 🤖 agents.md – AI Agent Technical Specification

**Purpose:** authoritative reference for autonomous code-generation agents working on the Start Template (Electron + React) project. Read this document before modifying IPC contracts, security-sensitive code, or project architecture artifacts.

---

## 1. System Context

| Aspect | Details |
|--------|---------|
| Product | Start Template – Electron + React desktop application |
| Version | 1.0.0 |
| Runtime Targets | Windows desktop (Electron), optional browser mode via Vite dev server |
| Core Use Case | Excel/CSV processing with secure file-system access |
| IPC Pattern | Three-layer bridge (Renderer → Preload → Main) with async `invoke/handle` |

---

## 2. Layer Responsibilities

| Layer | Location | Responsibilities | Constraints |
|-------|----------|------------------|-------------|
| Renderer (React) | `src/**/*.tsx` | UI, Zustand state, user interactions | No Node.js APIs; access backend via `window.api.*` only |
| Preload (Bridge) | `electron/preload.js` | Expose whitelisted APIs through `contextBridge` | Never expose `require`; forward validated calls to Main |
| Main (Electron) | `electron/main.js`, `electron/services/**` | Handle IPC requests, run business logic, interact with fs/OS | Must validate inputs, normalize paths, and return standard responses |

---

## 3. IPC Contract Registry

### 3.1 Standard Response Shape

```ts
type IpcResponse<T> =
  | { status: 'ok'; data: T }
  | { status: 'error'; code: string; message: string };
```

Every handler **must** return the structure above. Include `requestId` in data payloads when propagation of correlation IDs is required.

### 3.2 File-System Channels

| Channel | Input | Output | Handler | Notes |
|---------|-------|--------|---------|-------|
| `dialog:openDirectory` | `void` | `{ success: boolean; path?: string }` | `electron/main.js` | Native folder picker. Return `success=false` when cancelled. |
| `files:scan` | `{ rootPath: string; patterns: string[]; recursive: boolean }` | `{ status: 'ok'; data: FileInfo[]; count: number }` | `electron/services/fileService.js` | Validate `rootPath`, ensure `patterns` not empty, normalize paths. |

```ts
interface FileInfo {
  name: string;
  path: string;
  size: number;
  mtime: number;
}
```

### 3.3 Excel Channels

| Channel | Input | Output | Handler | Notes |
|---------|-------|--------|---------|-------|
| `excel:parse` | `{ filePath: string }` | `{ status: 'ok'; data: ExcelData }` | `electron/services/excelService.js` | Reject on missing file or unsupported extension. |
| `excel:export` | `{ data: ExcelData; savePath: string }` | `{ status: 'ok'; path: string }` | `electron/services/excelService.js` | Normalize destination; ensure write permissions. |

```ts
interface ExcelData {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  stats: { rowCount: number; colCount: number; warnings?: string[] };
}
```

### 3.4 System Channels

| Channel | Input | Output | Handler | Notes |
|---------|-------|--------|---------|-------|
| `app:version` | `void` | `string` | `electron/main.js` | Returns application version. |
| `logger:write` | `{ level: 'info' | 'warn' | 'error'; message: string }` | `void` | `electron/utils/logger.js` | Development logging only; sanitize messages. |

---

## 4. Security Requirements

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` (where possible).
- Validate all IPC inputs (`typeof`, schema, range checks) before execution.
- Normalize file-system paths and reject traversal attempts (`..`).
- Prohibit `eval`, dynamic code loading, or exposing raw `require` to the renderer.
- Redact sensitive information from logs and error messages.

Failure to comply with the above is considered a **blocking issue**.

---

## 5. Adding or Modifying IPC Channels

1. **Define Types** in `src/types/electron.d.ts` (renderer) and relevant backend modules.
2. **Expose API** in `electron/preload.js` via `contextBridge.exposeInMainWorld`.
3. **Implement Handler** with `ipcMain.handle` in `electron/main.js` or a service module.
4. **Validate Inputs** (types, ranges, permissions) and normalize paths.
5. **Return Standard Response** in success and error cases; assign appropriate `code` values.
6. **Document** the channel in this file and extend the error-code registry if needed.
7. **Test** the new flow in both browser (where applicable) and Electron modes.

### Recommended Error Codes

| Code | Meaning | Typical Recovery |
|------|---------|------------------|
| `INVALID_INPUT` | Payload missing or malformed | Fix caller contract |
| `PATH_TRAVERSAL` | Suspicious path detected | Reject request; audit caller |
| `FILE_NOT_FOUND` | Requested file unavailable | Ask user to select another file |
| `PERMISSION_DENIED` | OS rejected access | Request elevated permissions |
| `PARSE_FAILED` | Excel/CSV parsing error | Verify file integrity or format |
| `EXPORT_FAILED` | Excel export failed | Check disk space / permissions |
| `TIMEOUT` | Operation exceeded allowed duration | Split workload or extend timeout |
| `EXECUTION_FAILED` | Unexpected error | Inspect logs and stack trace |

---

## 6. State Management (Renderer)

- Zustand store located in `src/store/appStore.ts`.
- `AppState` tracks Excel data, loading flags, and error messages.
- Extend state by updating the interface and providing setter actions in the same file.
- Persist long-lived values through utilities in `src/lib/storage.ts` (IndexedDB).

---

## 7. Testing Expectations

- **Unit Tests (Services):** place under `electron/services/__tests__/`; cover happy-path and failure-path scenarios, especially for file IO and Excel processing.
- **IPC Integration Tests:** mock `ipcRenderer.invoke` in renderer tests (`src/__tests__`) to ensure components call correct channels and handle error codes.
- **E2E / Workflow Tests:** optional Playwright/Cypress coverage for end-to-end flows (folder selection → parse → table render → export).
- Record test gaps or skipped cases in PR descriptions when automation is impractical.

---

## 8. Development Patterns

- Use async `ipcRenderer.invoke` / `ipcMain.handle` only; avoid synchronous IPC.
- Report progress for long-running operations by sending renderer events (`event.sender.send`) every N items; throttle frequency to avoid UI floods.
- Wrap operations prone to blocking (Excel parsing, large directory scans) in try/catch blocks and surface explicit status codes.
- Add concise comments for non-trivial business rules; avoid restating obvious code.

---

## 9. Definition of Done (DoD)

- ✅ IPC contracts validated, documented, and tested.
- ✅ Security requirements enforced (path normalization, input validation).
- ✅ Renderer reflects loading, success, and error states.
- ✅ Regression tests (service/unit or integration) updated or added.
- ✅ `agents.md` updated when channels or policies change.

Residual risks or untested scenarios **must** be highlighted in the PR description or release notes.

---

## 10. Reference Documents

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) – high-level architecture overview.
- [`BUILD.md`](./BUILD.md) – build/distribution configuration.
- [`QUICKSTART.md`](./QUICKSTART.md) – onboarding steps for humans.
- [`README.md`](./README.md) – general project summary.

---

**Document metadata**

- Version: 1.1
- Last updated: October 17, 2025
- Maintainer: Marcin Ostrowski
- Audience: AI code-generation agents and maintainers

End of specification.
# 🤖 agents.md - AI Agent Technical Specification# 🤖 agents.md - Technical Reference for AI Agents# 🔌 IPC Communication Guide



**For: Autonomous code generation agents, AI developers, and intelligent development assistants**



> Written in clear, structured format optimized for machine readability and understanding.> **PURPOSE:** This document defines the architecture, contracts, and specifications for AI agents working on the Start Template project. Written specifically for AI code generation and autonomous development.# 🤖 agents.md (FSD) – Electron + React App



---



## CONTEXT---**Praktyczny przewodnik komunikacji między procesami w Electron**



### Project Identity

```

Name:         Start Template## 📋 Quick ReferenceFunctional Specification Document dla warstw/agentów aplikacji typu:  

Type:         Desktop Application (Electron + React)

Language:     TypeScript

Version:      1.0.0

Purpose:      Excel/CSV processing with dual-mode (Browser + Desktop)### Project ContextStart Template implementuje bezpieczną architekturę IPC (Inter-Process Communication) zgodnie z najlepszymi praktykami Electron.**React (Renderer) + Electron (Main/Preload) + Excel/FS Services**

Architecture: 3-Layer IPC (Renderer → Preload → Main)

```- **Type:** Electron + React + TypeScript Application



### Tech Stack Summary- **Purpose:** Desktop template for Excel/CSV processing with File System API support

```

FRONTEND:    React 19, TypeScript 5.8, Vite 7, Zustand, CSS3- **Version:** 1.0.0

BACKEND:     Electron 33, Node.js, ExcelJS 4.4, Pino

DEVTOOLS:    ESLint, electron-builder, TypeScript Compiler- **Architecture Pattern:** 3-layer IPC (Renderer → Preload → Main)------

```



### Directory Map

```### Tech Stack

src/

  components/        (React UI components)```

  store/            (Zustand state management)

  types/            (TypeScript definitions)Frontend:   React 19, TypeScript 5.8, Vite 7, Zustand, CSS3## 📋 Spis treści## 0️⃣ Cel dokumentu

  utils/            (Utility functions)

  App.tsx, main.tsx (Entry points)Backend:    Electron 33, Node.js, ExcelJS 4.4, Pino Logger



electron/DevTools:   ESLint, TypeScript Compiler, electron-builder 26

  main.js           (Electron main + IPC handlers)

  preload.js        (IPC bridge via contextBridge)APIs:       IPC, File System Access API, IndexedDB

  services/         (Business logic)

    fileService.js```1. [Podstawy IPC](#-podstawy-ipc)Ten dokument definiuje:

    excelService.js

  utils/

    logger.js

```### Directory Structure2. [Architektura 3-warstwowa](#️-architektura-3-warstwowa)- Role i odpowiedzialności *agentów* (procesów warstwowych)



---```



## ARCHITECTURE SPECIFICATIONsrc/3. [Istniejące channels](#-istniejące-channels)- Kontrakty komunikacji (IPC + typy I/O)



### 3-Layer IPC Model├── components/           # React UI components



```│   ├── ExcelFilePicker.tsx4. [Jak dodać nowy channel](#-jak-dodać-nowy-channel)- Zasady bezpieczeństwa, jakości (DoD), wydajności (NFR)

LAYER 1: RENDERER (React, TypeScript)

├─ Location: src/components/**/*.tsx│   ├── ExcelDataTable.tsx

├─ Role: UI rendering, state management, user interactions

├─ Access: window.api.* ONLY│   ├── WorkflowPanel.tsx5. [Bezpieczeństwo](#-bezpieczeństwo)- Scenariusze użytkowe i obsługę błędów

├─ Restrictions: NO Node.js, NO fs, NO require()

└─ Pattern: const result = await window.api.functionName(args);│   └── CollapsiblePanel.tsx



        ↓↑ IPC Channel (contextBridge)├── store/               # Zustand state management6. [Obsługa błędów](#️-obsługa-błędów)



LAYER 2: PRELOAD (Bridge)├── types/               # TypeScript definitions

├─ Location: electron/preload.js

├─ Role: Safe API whitelist via contextBridge├── utils/               # Helper functions7. [Best Practices](#-best-practices)> `agents.md` opisuje **sposób pracy aplikacji**, a nie instalację czy build.  

├─ Responsibility: Forward validated IPC calls

├─ Security: Explicit function exposure only└── App.tsx, main.tsx

└─ Pattern: contextBridge.exposeInMainWorld('api', { func: invoke })

> Instrukcje techniczne znajdują się w `architecture.md` lub `README.md`.

        ↓↑ IPC Channel (ipcRenderer/ipcMain)

electron/

LAYER 3: MAIN (Node.js, Electron)

├─ Location: electron/main.js, electron/services/├── main.js              # Electron main process + IPC handlers---

├─ Role: Request handling, business logic, file operations

├─ Access: Full Node.js, fs, system APIs├── preload.js           # IPC bridge (contextBridge)

├─ Responsibility: Validate input, execute, return result

└─ Pattern: ipcMain.handle('channel', async (event, args) => {...})├── services/            # Business logic---

```

│   ├── fileService.js   # File system operations

### Security Constraints (MANDATORY)

```│   └── excelService.js  # Excel parsing/export## 🎯 Podstawy IPC

✅ MUST: contextIsolation = true

✅ MUST: nodeIntegration = false└── utils/

✅ MUST: All IPC input validation

✅ MUST: File path normalization (check for ../)    └── logger.js        # Pino logger## 1️⃣ Agenci / Warstwy (Roles & Responsibilities)

✅ MUST: Return standard response format

```

❌ NEVER: eval(), dynamic code execution

❌ NEVER: expose full require() to renderer### Co to jest IPC?

❌ NEVER: skip input validation

```---



---### 🖥️ Renderer Agent (React UI)



## IPC CONTRACT SPECIFICATION## 🏗️ Architecture Overview



### Standard Response Format**IPC (Inter-Process Communication)** to mechanizm komunikacji między:| Aspekt           | Opis |

```typescript

type IpcResponse<T> = ### Layer 1: Renderer Process (React)

  | { status: 'ok'; data: T }

  | { status: 'error'; code: string; message: string };**Location:** `src/components/**/*.tsx`  - **Renderer Process** (React UI) - brak dostępu do Node.js|------------------|------|

```

**Responsibilities:**

### Channel Registry

- React UI rendering- **Main Process** (Electron) - pełny dostęp do Node.js i systemu| Cel              | Interakcja z użytkownikiem, prezentacja danych |

#### FILE SYSTEM CHANNELS

- State management via Zustand

**CHANNEL:** `dialog:openDirectory`

- INPUT: void- User interactions| Odpowiada za     | Eventy UI, Zustand Store, renderowanie tabel |

- OUTPUT: `{ success: boolean; path?: string }`

- PURPOSE: Native folder picker dialog- IPC calls to preload

- HANDLER: electron/main.js

### Dlaczego 3 warstwy?| Komunikuje się   | IPC → Preload (żądania FS/Excel) |

**CHANNEL:** `files:scan`

- INPUT: `{ rootPath: string; patterns: string[]; recursive: boolean }`**Security Constraints:**

- OUTPUT: `{ status: 'ok' | 'error'; data?: FileInfo[]; count?: number }`

- PURPOSE: Recursive directory scanning- ❌ NO Node.js/fs access| Anti-scope       | Brak dostępu do Node.js / fs / OS |

- HANDLER: electron/services/fileService.js

- VALIDATION: Check rootPath exists, patterns array not empty- ❌ NO require() or native modules



```typescript- ✅ Access via `window.api.*` only```

interface FileInfo {

  name: string;

  path: string;

  size: number;**Example:**┌─────────────────┐---

  mtime: number;

}```typescript

```

// src/components/ExcelFilePicker.tsx│  Renderer (UI)  │  → React, TypeScript, brak Node.js

#### EXCEL CHANNELS

const result = await window.api.selectDirectory();

**CHANNEL:** `excel:parse`

- INPUT: `filePath: string`const files = await window.api.scanFiles({ rootPath: result.path });└────────┬────────┘### 🔗 Preload Agent (Bridge IPC)

- OUTPUT: `{ status: 'ok' | 'error'; data?: ExcelData }`

- PURPOSE: Parse .xlsx or .csv file```

- HANDLER: electron/services/excelService.js

- VALIDATION: Verify file exists, check extension         │ window.api.someFunction()| Aspekt           | Opis |



```typescript### Layer 2: Preload Script

interface ExcelData {

  columns: string[];**Location:** `electron/preload.js`           ↓|------------------|------|

  rows: Array<Record<string, any>>;

  stats: { rowCount: number; colCount: number; warnings?: string[] };**Responsibilities:**

}

```- Bridge between Renderer and Main┌─────────────────┐| Cel              | Bezpieczny pomost Renderer ↔ Main |



**CHANNEL:** `excel:export`- Whitelist safe APIs via contextBridge

- INPUT: `{ data: ExcelData; savePath: string }`

- OUTPUT: `{ status: 'ok' | 'error'; path?: string }`- Input validation (optional but recommended)│  Preload (IPC)  │  → contextBridge, whitelist APIs| Odpowiada za     | `contextIsolation`, walidacja IPC, `window.api` |

- PURPOSE: Export data to .xlsx file

- HANDLER: electron/services/excelService.js

- VALIDATION: Normalize savePath, verify write permissions

**Security Rules:**└────────┬────────┘| Komunikuje się   | Renderer ↔ Main (IPC channels) |

#### SYSTEM CHANNELS

- ✅ MUST use contextBridge

**CHANNEL:** `app:version`

- INPUT: void- ✅ MUST expose only needed functions         │ ipcRenderer.invoke()| Anti-scope       | Brak logiki biznesowej (tylko forwarding & whitelisting) |

- OUTPUT: `string` (e.g., "1.0.0")

- PURPOSE: Get application version- ❌ NEVER expose require() or full Node.js

- HANDLER: electron/main.js

- ❌ NEVER use dangerous globals         ↓

**CHANNEL:** `logger:write`

- INPUT: `{ level: 'info' | 'warn' | 'error'; message: string }`

- OUTPUT: void

- PURPOSE: Write to application logs**Pattern:**┌─────────────────┐---

- HANDLER: electron/utils/logger.js

```javascript

---

contextBridge.exposeInMainWorld('api', {│  Main (Server)  │  → Node.js, File System, Services

## STATE MANAGEMENT (ZUSTAND)

  functionName: (args) => ipcRenderer.invoke('ipc-channel', args),

### Store Location

`src/store/appStore.ts`});└─────────────────┘### ⚙️ Main Agent (Electron Main Process)



### Current AppState Interface```

```typescript

interface AppState {```| Aspekt           | Opis |

  excelData: ExcelRow[];

  setExcelData: (data: ExcelRow[]) => void;### Layer 3: Main Process

  

  isLoading: boolean;**Location:** `electron/main.js`, `electron/services/**`  |------------------|------|

  setLoading: (loading: boolean) => void;

  **Responsibilities:**

  error: string | null;

  setError: (error: string | null) => void;- Electron window management**Bezpieczeństwo:**| Cel              | Orkiestracja aplikacji, tworzenie okien |

}

```- IPC request handlers



### Adding New State- File system operations- ✅ Renderer nie ma bezpośredniego dostępu do Node.js| Odpowiada za     | Obsługa IPC, delegacja do services |

```typescript

// 1. Update interface- Business logic execution

interface AppState {

  myField: Type;- Error handling & validation- ✅ Preload wystawia tylko wybrane funkcje| Komunikuje się   | Services (fileService, excelService) |

  setMyField: (value: Type) => void;

}



// 2. Implement in store**Pattern:**- ✅ Main waliduje wszystkie dane wejściowe| Anti-scope       | Renderowanie UI, logika komponentów React |

const useAppStore = create<AppState>((set) => ({

  myField: initialValue,```javascript

  setMyField: (value) => set({ myField: value }),

}));ipcMain.handle('ipc-channel', async (event, args) => {

```

  // 1. Validate input

---

  // 2. Execute business logic------

## COMPONENT TEMPLATES

  // 3. Return { status: 'ok'|'error', data?, message? }

### React Component Template

```typescript});

// src/components/FeatureName.tsx

import { useAppStore } from '../store/appStore';```



interface Props {## 🏗️ Architektura 3-warstwowa### 📁 FileScan Agent (Service)

  title: string;

  // additional props---

}

| Aspekt           | Opis |

export default function FeatureName({ title }: Props) {

  const { excelData, isLoading, error } = useAppStore();## 📡 IPC Contracts (Specifications)



  const handleAction = async () => {### 1️⃣ Renderer Process (React)|------------------|------|

    // Implementation

  };### Standard Response Format



  return (```typescript| Cel              | Rekurencyjne skanowanie folderów, filtry plików |

    <div className="feature-name">

      <h2>{title}</h2>type IpcResponse<T> = 

      {/* JSX */}

    </div>  | { status: 'ok'; data: T }**Lokalizacja:** `src/components/*.tsx`| Wejścia (IPC)    | `fs/pickDir`, `fs/scan` |

  );

}  | { status: 'error'; code: string; message: string };

```

```| Wyjścia          | Lista plików, metadane, sygnały progresu |

### IPC Handler Template

```javascript

// electron/main.js

ipcMain.handle('namespace:action', async (event, args) => {### File System Channels```typescript| Anti-scope       | Parsowanie zawartości plików |

  try {

    // 1. VALIDATE input

    if (!args || typeof args !== 'object') {

      return { status: 'error', code: 'INVALID_INPUT', message: 'Invalid arguments' };**Channel: `dialog:openDirectory`**// src/components/ExcelFilePicker.tsx

    }

- Args: `void`

    // 2. NORMALIZE/SANITIZE (for file operations)

    const safePath = path.normalize(args.path);- Returns: `{ success: boolean; path?: string }`import { useAppStore } from '../store/appStore';---

    if (safePath.includes('..')) {

      return { status: 'error', code: 'PATH_TRAVERSAL', message: 'Invalid path' };- Purpose: Open native folder picker dialog

    }

- Location: `electron/main.js`

    // 3. EXECUTE business logic

    const result = await serviceModule.performAction(args);



    // 4. RETURN standard response**Channel: `files:scan`**export default function ExcelFilePicker() {### 📊 Excel Agent (Service)

    return { status: 'ok', data: result };

  } catch (error) {- Args: `{ rootPath: string; patterns: string[]; recursive: boolean }`

    console.error('Handler error:', error);

    return {- Returns: `{ status: 'ok'; data: FileInfo[]; count: number }`  const { setFiles, setLoading } = useAppStore();| Aspekt           | Opis |

      status: 'error',

      code: 'EXECUTION_FAILED',- Purpose: Recursively scan directory for files

      message: error.message

    };- Location: `electron/services/fileService.js`|------------------|------|

  }

});

```

**FileInfo structure:**  const handleSelectDirectory = async () => {| Cel              | Odczyt i eksport CSV/XLSX (ExcelJS) |

---

```typescript

## ERROR CODES REGISTRY

interface FileInfo {    try {| Wejścia (IPC)    | `excel/parse`, `excel/export` |

| CODE | MEANING | RECOVERY |

|------|---------|----------|  name: string;

| `INVALID_INPUT` | Input type/format incorrect | Validate & retry |

| `PATH_TRAVERSAL` | Security violation detected | Check path, reject |  path: string;      setLoading(true);| Wyjścia          | Tabele, typy kolumn, statystyki, raport błędów |

| `FILE_NOT_FOUND` | File doesn't exist | Verify path exists |

| `PERMISSION_DENIED` | No file system access | Check permissions |  size: number;

| `PARSE_FAILED` | Excel/CSV parsing error | Verify file format |

| `EXPORT_FAILED` | Export to Excel failed | Check disk space |  mtime: number;      | Anti-scope       | UI i wybór katalogów |

| `EXECUTION_FAILED` | Unexpected error | See error message |

| `TIMEOUT` | Operation exceeded limit | Increase timeout or split work |}



---```      // Wywołanie IPC przez window.api



## DEVELOPMENT PATTERNS



### Pattern: Async File Operation with Loading### Excel Channels      const result = await window.api.selectDirectory();---

```typescript

const handleLoadFile = async () => {

  const { setLoading, setExcelData, setError } = useAppStore();

  **Channel: `excel:parse`**      

  try {

    setLoading(true);- Args: `filePath: string`

    setError(null);

    - Returns: `{ status: 'ok'; data: ExcelData }`      if (result.success) {## 2️⃣ Kontrakty IPC – Źródło prawdy

    const result = await window.api.parseExcel(filePath);

    - Purpose: Parse Excel/CSV file and extract data

    if (result.status === 'ok') {

      setExcelData(result.data.rows);- Location: `electron/services/excelService.js`        console.log('Selected directory:', result.path);

    } else {

      setError(result.message);

    }

  } catch (error) {**ExcelData structure:**        ### 2.1 Struktura żądań

    setError(error.message);

  } finally {```typescript

    setLoading(false);

  }interface ExcelData {        // Skanowanie plików

};

```  columns: string[];



### Pattern: Progress Reporting (Long Operation)  rows: Array<Record<string, any>>;        const files = await window.api.scanFiles({```ts

```javascript

ipcMain.handle('operation:longRunning', async (event, args) => {  stats: {

  const items = args.items;

  const results = [];    rowCount: number;          rootPath: result.path,// fs/scan (Renderer → Preload → Main)

  

  for (let i = 0; i < items.length; i++) {    colCount: number;

    results.push(await processItem(items[i]));

        warnings?: string[];          patterns: ['*.xlsx', '*.csv'],type FsScanReq = {

    // Report progress every 10 items

    if (i % 10 === 0) {  };

      event.sender.send('operation:progress', {

        current: i,}          recursive: true  requestId: string;

        total: items.length,

        percent: Math.round((i / items.length) * 100)```

      });

    }        });  rootPath?: string;     // Electron

  }

  **Channel: `excel:export`**

  return { status: 'ok', data: results };

});- Args: `{ data: ExcelData; savePath: string }`          patterns: string[];    // ["*.csv", "*.xlsx"]

```

- Returns: `{ status: 'ok'; path: string }`

### Pattern: Input Validation in Handler

```javascript- Purpose: Export data to Excel file        setFiles(files.data);  recursive: boolean;

ipcMain.handle('operation:perform', async (event, args) => {

  try {- Location: `electron/services/excelService.js`

    // TYPE CHECK

    if (typeof args.value !== 'number') {      }  maxDepth?: number;

      throw new Error('value must be number');

    }### System Channels

    

    // RANGE CHECK    } catch (error) {};

    if (args.value < 0 || args.value > 100) {

      throw new Error('value must be 0-100');**Channel: `app:version`**

    }

    - Args: `void`      console.error('Error:', error);

    // EXECUTE

    const result = await doSomething(args.value);- Returns: `string` (e.g., "1.0.0")

    

    return { status: 'ok', data: result };- Purpose: Get application version    } finally {// excel/parse

  } catch (error) {

    return { status: 'error', code: 'INVALID_ARGS', message: error.message };

  }

});**Channel: `logger:write`**      setLoading(false);type ExcelParseReq = {

```

- Args: `{ level: 'info'|'warn'|'error'; message: string }`

---

- Returns: `void`    }  requestId: string;

## CHECKLIST: Adding New IPC Channel

- Purpose: Write to application logs

```

[ ] 1. Define TypeScript type in src/types/electron.d.ts  };  filePath: string;

[ ] 2. Add to window interface in electron.d.ts

[ ] 3. Expose via contextBridge in electron/preload.js---

[ ] 4. Implement handler in electron/main.js or service

[ ] 5. Validate ALL input arguments  sheet?: string|number;

[ ] 6. Normalize file paths, check for ../

[ ] 7. Return standard IpcResponse format## 🔒 Security Requirements

[ ] 8. Handle all error cases with codes

[ ] 9. Add to error codes registry (above)  return (  headerRow?: number;

[ ] 10. Test in Browser mode

[ ] 11. Test in Electron mode### MUST (Non-Negotiable)

[ ] 12. Update agents.md with new channel spec

[ ] 13. Add JSDoc comments- ✅ `contextIsolation: true` in BrowserWindow webPreferences    <button onClick={handleSelectDirectory}>};

```

- ✅ `nodeIntegration: false` in BrowserWindow webPreferences

---

- ✅ All IPC handlers validate input types      Select Folder````

## TESTING GUIDELINES

- ✅ File paths normalized and checked for `../` traversal

### Unit Tests (Main Process Services)

```javascript- ✅ No `eval()` or dynamic code execution    </button>

// electron/services/__tests__/fileService.test.js

const fileService = require('../fileService');- ✅ No sensitive data in console logs



describe('fileService', () => {  );### 2.2 Struktura odpowiedzi

  test('scanDirectory returns FileInfo array', async () => {

    const files = await fileService.scanDirectory('./test-dir', ['*.txt'], false);### SHOULD (Best Practices)

    expect(Array.isArray(files)).toBe(true);

    expect(files[0]).toHaveProperty('name', 'path', 'size');- ✅ All IPC responses include status + data/error}

  });

});- ✅ Implement timeout for long-running IPC calls

```

- ✅ Log all IPC calls (name + duration in dev mode)``````ts

### IPC Integration Tests

```typescript- ✅ Use TypeScript for all IPC function signatures

// src/__tests__/ipc.test.ts

const mockIpcRenderer = {- ✅ Implement error codes for different failure modestype Ok<T> = { requestId: string; status: "ok"; data: T };

  invoke: jest.fn()

};

window.api = {

  parseExcel: (path) => mockIpcRenderer.invoke('excel:parse', path)### Implementation Checklist for New IPC Handlers**Typy TypeScript:**type Err = { requestId: string; status: "error"; code: string; message: string };

};



test('Component calls correct IPC channel', async () => {

  mockIpcRenderer.invoke.mockResolvedValue({```

    status: 'ok',

    data: { columns: [], rows: [] }When adding new IPC channel:

  });

  ```typescripttype FsScanRes = {

  const result = await window.api.parseExcel('/path/to/file.xlsx');

  [ ] 1. Add TypeScript type to src/types/electron.d.ts

  expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(

    'excel:parse',[ ] 2. Add function signature to window.api in electron/preload.js// src/types/electron.d.ts  files: Array<{ path: string; name: string; size: number; mtime: number }>;

    '/path/to/file.xlsx'

  );[ ] 3. Add ipcMain.handle() in electron/main.js

});

```[ ] 4. Validate all input arguments (type check)interface ElectronAPI {};



---[ ] 5. Check file paths for safety (path.normalize, no ../)



## DEBUGGING REFERENCE[ ] 6. Return standard IpcResponse format  selectDirectory: () => Promise<{ success: boolean; path?: string }>;



### Browser Mode Issues[ ] 7. Handle all error cases

- **File System Access:** Only works in Chrome/Edge 86+

- **IPC Channels:** Not available (use File System Access API instead)[ ] 8. Add error codes to this doc  scanFiles: (options: ScanOptions) => Promise<ScanResult>;type ExcelParseRes = {

- **Debug:** F12 → Console

[ ] 9. Test in both Browser mode and Electron mode

### Electron Mode Issues

- **IPC Channel:** Should be registered in electron/main.js[ ] 10. Update agents.md with new channel spec  parseExcel: (filePath: string) => Promise<ExcelData>;  columns: string[];

- **Security Error:** Check contextIsolation, preload.js config

- **Debug:** Ctrl+Shift+I → Console, check terminal for Main process logs```



### Enable Debug Output  exportExcel: (data: ExcelData, savePath: string) => Promise<void>;  rows: Array<Record<string, unknown>>;

```bash

# Dev with debug logging---

ELECTRON_DEBUG=true npm start

}  stats: { rows: number; cols: number; warnings: string[] };

# Check logs location:

# Windows: %APPDATA%\Start Template\logs\## 🎯 State Management (Zustand)

# macOS: ~/Library/Logs/Start Template/

# Linux: ~/.config/Start Template/logs/};

```

### Store Location

---

`src/store/appStore.ts`declare global {```

## TYPESCRIPT TYPE DEFINITIONS (REFERENCE)



### File Operations

```typescript### Current State Interface  interface Window {

interface ScanOptions {

  rootPath: string;```typescript

  patterns: string[];

  recursive: boolean;interface AppState {    api: ElectronAPI;**Pełna lista kanałów →** `ipc-contracts.md`

  maxDepth?: number;

}  // Excel data



interface FileInfo {  excelData: ExcelRow[];  }

  name: string;

  path: string;  setExcelData: (data: ExcelRow[]) => void;

  size: number;

  mtime: number;}---

}

```  // Loading states



### Excel Operations  isLoading: boolean;```

```typescript

interface ExcelRow {  setLoading: (loading: boolean) => void;

  [key: string]: any;

}## 3️⃣ Bezpieczeństwo (Security Policies)



interface ExcelData {  // Error handling

  columns: string[];

  rows: ExcelRow[];  error: string | null;---

  stats: {

    rowCount: number;  setError: (error: string | null) => void;

    colCount: number;

    warnings?: string[];| Zasada             | Wymaganie                                    |

  };

}  // [Add new state fields here]

```

}### 2️⃣ Preload Script (Bridge)| ------------------ | -------------------------------------------- |

---

```

## AI AGENT INSTRUCTIONS

| `contextIsolation` | MUST be ON                                   |

When working on this project:

### Adding New State

1. **Read this document first** - Understand 3-layer IPC model

2. **Follow security rules** - contextIsolation, validate inputs, normalize paths```typescript**Lokalizacja:** `electron/preload.js`| `nodeIntegration`  | MUST be OFF in Renderer                      |

3. **Use patterns above** - Don't reinvent, copy & adapt templates

4. **Return standard format** - Always use `{ status, data/message }`// 1. Update AppState interface

5. **Add error codes** - Define error codes for new operations

6. **Test both modes** - Browser + Electroninterface AppState {| Uprawnienia FS     | Tylko przez user dialog / File System Access |

7. **Type everything** - Use TypeScript, no `any` types

8. **Document new channels** - Update agents.md  myNewField: string;

9. **Check existing patterns** - Look at similar features first

10. **Ask for clarification** - If architecture unclear  setMyNewField: (value: string) => void;```javascript| Dane wrażliwe      | Brak trwałego logowania zawartości komórek   |



---}



**Document Version:** 1.0  const { contextBridge, ipcRenderer } = require('electron');| Limity plików      | Max. rozmiar / timeout parsing               |

**Last Updated:** October 17, 2025  

**Target:** AI Code Generation Agents  // 2. Implement in store

**Format:** Optimized for machine readability

const useAppStore = create<AppState>((set) => ({

  myNewField: '',

  setMyNewField: (value) => set({ myNewField: value }),// Whitelist - tylko te funkcje są dostępne w renderer---

}));

```contextBridge.exposeInMainWorld('api', {



---  // File System Operations## 4️⃣ NFR – Non-Functional Requirements



## 🧪 Testing Strategy for AI Agents  selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),



### Unit Tests (Main Process Services)  | Obszar       | Parametr                                       |

```

Location: electron/services/__tests__/  scanFiles: (options) => ipcRenderer.invoke('files:scan', options),| ------------ | ---------------------------------------------- |

Pattern: fileService.test.js, excelService.test.js

Tool: Jest/Vitest  | Wydajność    | ≥1000 plików/s przy skanowaniu                 |

Coverage: Business logic only, no IPC

```  // Excel Operations| UI           | Zero blokowania głównego wątku                 |



### Integration Tests (IPC)  parseExcel: (filePath) => ipcRenderer.invoke('excel:parse', filePath),| Stabilność   | Retry 1x, poprawne komunikaty błędów           |

```

Location: src/__tests__/  | Portowalność | Windows / macOS / Linux, Browser (Chrome/Edge) |

Pattern: Mock ipcRenderer, test window.api calls

Tool: Jest/Vitest + @testing-library/react  exportExcel: (data, savePath) => 

Verify: Components correctly call IPC channels

```    ipcRenderer.invoke('excel:export', { data, savePath }),---



### E2E Tests (Full Flow)  

```

Location: e2e/__tests__/ (if exists)  // System Info## 5️⃣ Definition of Done (DoD)

Pattern: Open app, perform user actions, verify results

Tool: Playwright/Cypress  getAppVersion: () => ipcRenderer.invoke('app:version'),

Verify: Complete workflows (open file → parse → display)

```  ✔ Każdy agent ma zdefiniowany kontrakt IPC



---  // Logger (dev only)✔ UI wyświetla progres, błędy i retry



## 📊 Component Templates for AI Generation  log: (level, message) => ipcRenderer.invoke('logger:write', { level, message }),✔ contextIsolation i preload przetestowane



### New React Component Template});✔ Ścieżka: Pick → Scan → Parse → Export działa

```typescript

// src/components/NewFeature.tsx✔ Testy błędów: brak dostępu / zły plik / timeout

import { useAppStore } from '../store/appStore';

// Opcjonalnie: Event listeners (main → renderer)

interface Props {

  title: string;ipcRenderer.on('progress:update', (event, data) => {---

  // Add props

}  window.dispatchEvent(new CustomEvent('ipc-progress', { detail: data }));



export default function NewFeature({ title }: Props) {});## 6️⃣ Scenariusze (Playbooks)

  const { excelData, isLoading } = useAppStore();

```

  const handleAction = async () => {

    // Implementation### 📂 Import CSV/XLSX (end-to-end)

  };

**Zasady:**

  return (

    <div className="new-feature">- ✅ Tylko `invoke` (async) - nigdy `send` (sync)1️⃣ Użytkownik klik „Wybierz folder” → `fs/pickDir`

      <h2>{title}</h2>

      {/* JSX */}- ✅ Minimalna powierzchnia API2️⃣ Renderer → `fs/scan`

    </div>

  );- ✅ Walidacja argumentów po stronie main3️⃣ FileScan → progres → lista plików

}

```4️⃣ UI → wybór → `excel/parse`



### New IPC Handler Template---5️⃣ ExcelAgent → kolumny + dane → tabela React

```javascript

// electron/main.js

ipcMain.handle('your:channel', async (event, args) => {

  try {### 3️⃣ Main Process (Server)---

    // 1. VALIDATE

    if (!args || typeof args !== 'object') {

      return { status: 'error', code: 'INVALID_ARGS', message: 'Invalid arguments' };

    }**Lokalizacja:** `electron/main.js`### 📤 Eksport do Excel



    // 2. EXECUTE

    const result = await someService.doSomething(args);

```javascript1️⃣ UI → `excel/export`

    // 3. RETURN

    return { status: 'ok', data: result };const { app, BrowserWindow, ipcMain, dialog } = require('electron');2️⃣ ExcelAgent → zapis XLSX

  } catch (error) {

    return {const path = require('path');3️⃣ Main zwraca ścieżkę

      status: 'error',

      code: 'EXECUTION_FAILED',const fileService = require('./services/fileService');4️⃣ UI: „Plik zapisany jako …”

      message: error.message

    };const excelService = require('./services/excelService');

  }

});---

```

// IPC Handlers

---

## 7️⃣ Obsługa błędów

## 🚀 Common Development Patterns

// Dialog - wybór folderu

### Pattern 1: Async File Operation with Loading State

```typescriptipcMain.handle('dialog:openDirectory', async () => {| Kod                | Znaczenie                  |

const handleLoadFile = async () => {

  const { setLoading, setExcelData, setError } = useAppStore();  const result = await dialog.showOpenDialog({| ------------------ | -------------------------- |

  

  try {    properties: ['openDirectory'],| `FS_NO_PERMISSION` | Brak dostępu do katalogu   |

    setLoading(true);

    setError(null);    title: 'Select Folder'| `FS_NOT_FOUND`     | Plik przeniesiony/usunięty |

    

    const result = await window.api.parseExcel(filePath);  });| `XLS_PARSE_FAIL`   | Niepoprawny format XLS/CSV |

    

    if (result.status === 'ok') {  | `TOO_LARGE`        | Przekroczony limit danych  |

      setExcelData(result.data.rows);

    } else {  if (result.canceled) {| `TIMEOUT`          | Operacja trwa zbyt długo   |

      setError(result.message);

    }    return { success: false };

  } catch (error) {

    setError(error.message);  }---

  } finally {

    setLoading(false);  

  }

};  return {## 8️⃣ Telemetria (Dev Mode)

```

    success: true,

### Pattern 2: IPC Handler with Validation

```javascript    path: result.filePaths[0]* Log IPC: kanał + czas (ms)

ipcMain.handle('operation:perform', async (event, { filePath, options }) => {

  try {  };* Bez danych użytkownika

    // Input validation

    if (!filePath || typeof filePath !== 'string') {});* Statystyki: liczba plików, czas skanowania, błędy parsowania

      throw new Error('filePath must be string');

    }

    

    // Path safety// File scanning---

    const normalizedPath = path.normalize(filePath);

    if (normalizedPath.includes('..')) {ipcMain.handle('files:scan', async (event, options) => {

      throw new Error('Path traversal detected');

    }  try {## 9️⃣ Testy Akceptacyjne (UAT)

    

    // Business logic    // Walidacja

    const result = await service.perform(normalizedPath, options);

        if (!options || !options.rootPath) {| ID     | Scenariusz                             |

    // Success response

    return { status: 'ok', data: result };      throw new Error('rootPath is required');| ------ | -------------------------------------- |

  } catch (error) {

    return {    }| UAT-01 | Skan 2000 plików z progres barem       |

      status: 'error',

      code: 'OPERATION_FAILED',    | UAT-02 | Brak uprawnień → komunikat + retry     |

      message: error.message

    };    const files = await fileService.scanDirectory(| UAT-03 | Import 50k wierszy CSV + walidacja     |

  }

});      options.rootPath,| UAT-04 | Eksport XLSX + link „Pokaż w folderze” |

```

      options.patterns || ['*'],

### Pattern 3: Progress Reporting

```javascript      options.recursive || false---

ipcMain.handle('operation:longRunning', async (event, args) => {

  const total = args.items.length;    );

  

  for (let i = 0; i < total; i++) {    ## 🔗 Referencje

    // Process item

    await processItem(args.items[i]);    return {

    

    // Report progress every 10 items      status: 'ok',* `architecture.md` – struktura projektu + build

    if (i % 10 === 0) {

      event.sender.send('operation:progress', {      data: files,* `ipc-contracts.md` – pełne kanały IPC i typy

        current: i,

        total: total,      count: files.length* `types.ts` – TS source of truth (rekordy, dane)

        percent: Math.round((i / total) * 100)

      });    };* `security.md` – rozszerzona polityka dostępu

    }

  }  } catch (error) {

  

  return { status: 'ok', data: results };    return {---

});

```      status: 'error',



---      code: 'SCAN_FAILED',**Koniec dokumentu `agents.md` ✦**



## 🔍 Debugging Guidelines for AI Agents      message: error.message



### Enable Debug Logging    };```

```bash

# Run with debug output  }

ELECTRON_DEBUG=true npm run electron:dev

});---

# Check logs

# Windows: %APPDATA%\Start Template\logs\

# macOS: ~/Library/Logs/Start Template/

# Linux: ~/.config/Start Template/logs/// Excel parsing

```

ipcMain.handle('excel:parse', async (event, filePath) => {

### Console Access  try {

- **Browser mode:** F12 → Console    // Walidacja ścieżki

- **Electron mode:** Ctrl+Shift+I → Console    if (!filePath || typeof filePath !== 'string') {

- **Main process:** Check terminal output      throw new Error('Invalid file path');

    }

### IPC Debug Pattern    

```javascript    const data = await excelService.parseFile(filePath);

// In electron/main.js (development only)    

ipcMain.handle('your:channel', async (event, args) => {    return {

  console.time('your:channel');      status: 'ok',

  try {      data: {

    const result = await operation(args);        columns: data.columns,

    console.timeEnd('your:channel');        rows: data.rows,

    return { status: 'ok', data: result };        stats: {

  } catch (error) {          rowCount: data.rows.length,

    console.error('Error in your:channel:', error);          colCount: data.columns.length

    console.timeEnd('your:channel');        }

    return { status: 'error', code: 'ERROR', message: error.message };      }

  }    };

});  } catch (error) {

```    return {

      status: 'error',

---      code: 'PARSE_FAILED',

      message: error.message

## 📝 TypeScript Type Definitions    };

  }

### File Operation Types});

```typescript

interface ScanOptions {// Excel export

  rootPath: string;ipcMain.handle('excel:export', async (event, { data, savePath }) => {

  patterns: string[];  // e.g., ['*.xlsx', '*.csv']  try {

  recursive: boolean;    await excelService.exportToExcel(data, savePath);

  maxDepth?: number;    return { status: 'ok', path: savePath };

}  } catch (error) {

    return {

interface FileInfo {      status: 'error',

  name: string;      code: 'EXPORT_FAILED',

  path: string;      message: error.message

  size: number;    };

  mtime: number;  }

}});



interface ScanResult {// App version

  status: 'ok' | 'error';ipcMain.handle('app:version', () => {

  data?: FileInfo[];  return app.getVersion();

  count?: number;});

  code?: string;```

  message?: string;

}---

```

## 📡 Istniejące channels

### Excel Operation Types

```typescript### File System

interface ExcelRow {

  [key: string]: any;| Channel | Argumenty | Zwraca | Opis |

}|---------|-----------|--------|------|

| `dialog:openDirectory` | - | `{success, path?}` | Wybór folderu przez dialog |

interface ExcelColumn {| `files:scan` | `{rootPath, patterns, recursive}` | `{status, data, count}` | Skanowanie plików |

  name: string;

  type: 'string' | 'number' | 'date' | 'boolean';### Excel

  width?: number;

}| Channel | Argumenty | Zwraca | Opis |

|---------|-----------|--------|------|

interface ExcelData {| `excel:parse` | `filePath: string` | `{status, data}` | Parsowanie Excel/CSV |

  columns: ExcelColumn[];| `excel:export` | `{data, savePath}` | `{status, path}` | Eksport do Excel |

  rows: ExcelRow[];

  stats: {### System

    rowCount: number;

    colCount: number;| Channel | Argumenty | Zwraca | Opis |

    warnings?: string[];|---------|-----------|--------|------|

  };| `app:version` | - | `string` | Wersja aplikacji |

}| `logger:write` | `{level, message}` | `void` | Zapis do loggera |



interface ExcelExportOptions {---

  fileName: string;

  sheetName?: string;## ➕ Jak dodać nowy channel

  includeHeader?: boolean;

}### Przykład: Dodanie funkcji "kopiuj plik"

```

#### Krok 1: Dodaj typ w TypeScript

---

```typescript

## ✅ Definition of Done (DoD) for Features// src/types/electron.d.ts

interface ElectronAPI {

When implementing new features, AI agents should verify:  // ... istniejące

  copyFile: (source: string, dest: string) => Promise<CopyResult>;

- [ ] **Code Quality**}

  - TypeScript strict mode: no `any` types

  - ESLint: zero errorsinterface CopyResult {

  - Comments for non-obvious logic  status: 'ok' | 'error';

  message?: string;

- [ ] **Architecture**}

  - Renderer: React component or hook```

  - Preload: IPC channel exposed via contextBridge

  - Main: IPC handler with validation#### Krok 2: Eksponuj w Preload



- [ ] **Security**```javascript

  - All inputs validated// electron/preload.js

  - No Node.js access from RenderercontextBridge.exposeInMainWorld('api', {

  - File paths checked for traversal  // ... istniejące

  copyFile: (source, dest) => 

- [ ] **Testing**    ipcRenderer.invoke('file:copy', { source, dest }),

  - Unit tests for business logic});

  - IPC tests for handlers```

  - Error cases tested

#### Krok 3: Handler w Main

- [ ] **Documentation**

  - JSDoc comments on functions```javascript

  - Updated agents.md for new IPC channels// electron/main.js

  - Type definitions documentedconst fs = require('fs').promises;



- [ ] **Performance**ipcMain.handle('file:copy', async (event, { source, dest }) => {

  - No blocking operations on main thread  try {

  - Long operations use progress reporting    // Walidacja

  - Appropriate timeouts set    if (!source || !dest) {

      throw new Error('Source and destination required');

---    }

    

## 🔗 Related Documentation    // Security: sprawdź czy ścieżki są bezpieczne

    // (np. nie pozwalaj na ../ itp.)

- **[README.md](./README.md)** - Project overview    

- **[QUICKSTART.md](./QUICKSTART.md)** - Getting started guide    await fs.copyFile(source, dest);

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture    

- **[BUILD.md](./BUILD.md)** - Build & distribution    return {

- **[FAQ.md](./FAQ.md)** - Common questions      status: 'ok',

      message: `File copied to ${dest}`

---    };

  } catch (error) {

## 📞 AI Agent Instructions    return {

      status: 'error',

When working on this project, follow these guidelines:      message: error.message

    };

1. **Read this document first** - Understand the architecture and contracts  }

2. **Check existing patterns** - Look at similar implementations before creating new});

3. **Follow security rules** - Always validate input, check file paths```

4. **Update agents.md** - Any new IPC channel should be documented here

5. **Run in both modes** - Test in Browser mode and Electron mode#### Krok 4: Użyj w komponencie

6. **Error handling** - Always return proper error responses

7. **Types first** - Define TypeScript types before implementation```typescript

8. **Ask for clarification** - If architecture unclear, ask before proceeding// src/components/MyComponent.tsx

const handleCopy = async () => {

---  const result = await window.api.copyFile(

    'C:/source/file.xlsx',

**Last Updated:** October 17, 2025      'C:/backup/file.xlsx'

**Format Version:** 1.0    );

**Target Audience:** AI Code Generation Agents  

  if (result.status === 'ok') {
    console.log('Success!');
  } else {
    console.error(result.message);
  }
};
```

---

## 🔒 Bezpieczeństwo

### 1. Context Isolation

```javascript
// electron/main.js
const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,      // ✅ MUST BE TRUE
    nodeIntegration: false,       // ✅ MUST BE FALSE
    sandbox: true                 // ✅ Recommended
  }
});
```

### 2. Walidacja danych

**❌ Źle:**
```javascript
ipcMain.handle('file:delete', async (event, filePath) => {
  await fs.unlink(filePath); // NIEBEZPIECZNE!
});
```

**✅ Dobrze:**
```javascript
ipcMain.handle('file:delete', async (event, filePath) => {
  // Walidacja typu
  if (typeof filePath !== 'string') {
    throw new Error('Invalid file path type');
  }
  
  // Sprawdź czy ścieżka jest bezpieczna
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..')) {
    throw new Error('Path traversal detected');
  }
  
  // Sprawdź czy plik istnieje
  if (!fs.existsSync(normalizedPath)) {
    throw new Error('File not found');
  }
  
  // Sprawdź uprawnienia
  // ...
  
  await fs.unlink(normalizedPath);
});
```

### 3. Whitelist APIs

Tylko wymagane funkcje - **nigdy całe Node.js!**

❌ **NIE ROB TEGO:**
```javascript
contextBridge.exposeInMainWorld('node', {
  require: require // BARDZO NIEBEZPIECZNE!
});
```

✅ **Zamiast tego:**
```javascript
contextBridge.exposeInMainWorld('api', {
  specificFunction: () => ipcRenderer.invoke('channel')
});
```

---

## ⚠️ Obsługa błędów

### Standard zwracania błędów

```typescript
type IpcResult<T> = 
  | { status: 'ok'; data: T }
  | { status: 'error'; code: string; message: string };
```

### Kody błędów

| Kod | Znaczenie |
|-----|-----------|
| `FS_NO_PERMISSION` | Brak dostępu do pliku/folderu |
| `FS_NOT_FOUND` | Plik nie istnieje |
| `PARSE_FAILED` | Błąd parsowania pliku |
| `EXPORT_FAILED` | Błąd eksportu danych |
| `VALIDATION_ERROR` | Nieprawidłowe dane wejściowe |
| `TIMEOUT` | Operacja przekroczyła limit czasu |

### Przykład obsługi

```typescript
// Renderer
try {
  const result = await window.api.parseExcel(filePath);
  
  if (result.status === 'error') {
    switch (result.code) {
      case 'FS_NOT_FOUND':
        alert('Plik nie istnieje');
        break;
      case 'PARSE_FAILED':
        alert('Błąd odczytu pliku');
        break;
      default:
        alert(`Błąd: ${result.message}`);
    }
    return;
  }
  
  // Sukces
  console.log(result.data);
} catch (error) {
  console.error('Unexpected error:', error);
}
```

---

## 💡 Best Practices

### 1. Async zawsze

✅ Używaj `ipcRenderer.invoke()` + `ipcMain.handle()`  
❌ Unikaj `send()` + `on()` (synchroniczne)

### 2. Timeout dla długich operacji

```javascript
const parseWithTimeout = (filePath) => {
  return Promise.race([
    excelService.parseFile(filePath),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), 30000)
    )
  ]);
};
```

### 3. Progress reporting

```javascript
// Main → Renderer (events)
ipcMain.handle('files:scan', async (event, options) => {
  const files = [];
  let scanned = 0;
  
  for (const file of allFiles) {
    files.push(file);
    scanned++;
    
    // Wyślij progress co 10 plików
    if (scanned % 10 === 0) {
      event.sender.send('scan:progress', {
        total: allFiles.length,
        scanned
      });
    }
  }
  
  return { status: 'ok', data: files };
});
```

### 4. Typowanie

Zawsze dodawaj typy TypeScript dla wszystkich IPC calls!

### 5. Dokumentacja

Każdy channel powinien mieć:
- Opis funkcjonalności
- Argumenty + typy
- Zwracane dane + typy
- Możliwe kody błędów
- Przykład użycia

---

## 🧪 Testowanie IPC

### Unit testy (Main Process)

```javascript
// electron/services/__tests__/fileService.test.js
const fileService = require('../fileService');

describe('fileService', () => {
  test('scanDirectory returns files', async () => {
    const files = await fileService.scanDirectory(
      './test-data',
      ['*.xlsx'],
      false
    );
    
    expect(files).toHaveLength(3);
    expect(files[0]).toHaveProperty('name');
  });
});
```

### Integration testy (IPC)

```javascript
// Mock IPC
const mockIpcRenderer = {
  invoke: jest.fn()
};

window.api = {
  scanFiles: (options) => mockIpcRenderer.invoke('files:scan', options)
};

test('ExcelFilePicker calls IPC', async () => {
  mockIpcRenderer.invoke.mockResolvedValue({
    status: 'ok',
    data: []
  });
  
  const result = await window.api.scanFiles({ rootPath: '/test' });
  
  expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
    'files:scan',
    { rootPath: '/test' }
  );
});
```

---

## 📚 Dodatkowe zasoby

- [Electron IPC Documentation](https://www.electronjs.org/docs/latest/api/ipc-main)
- [Electron Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)

---

## 🎓 Przykładowe scenariusze

### Scenariusz 1: Batch processing z progress

```typescript
// Renderer
const processBatch = async (files: string[]) => {
  const total = files.length;
  let processed = 0;
  
  for (const file of files) {
    const result = await window.api.parseExcel(file);
    processed++;
    
    // Update UI
    setProgress((processed / total) * 100);
  }
};
```

### Scenariusz 2: Streaming dużych plików

```javascript
// Main
ipcMain.handle('excel:parseStream', async (event, filePath) => {
  const stream = fs.createReadStream(filePath);
  const chunks = [];
  
  stream.on('data', (chunk) => {
    event.sender.send('stream:chunk', chunk);
  });
  
  return new Promise((resolve) => {
    stream.on('end', () => resolve({ status: 'ok' }));
  });
});
```

---

**Koniec przewodnika IPC** 🎉

> Pamiętaj: **Bezpieczeństwo first!** Zawsze waliduj dane i używaj contextIsolation.

Ostatnia aktualizacja: October 17, 2025
