# 🏗️ Architecture Diagram - CPK Export Weryfikacja

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CPK Export Weryfikacja                    │
│                   Electron Desktop Application                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────────────────┐
                              │                                 │
                    ┌─────────▼────────┐              ┌────────▼────────┐
                    │  Main Process     │              │  Renderer       │
                    │  (Node.js)        │◄────IPC─────►│  (React)        │
                    └─────────┬────────┘              └────────┬────────┘
                              │                                 │
                    ┌─────────▼────────┐              ┌────────▼────────┐
                    │   Services        │              │   Components    │
                    │  - File Service   │              │  - FilePicker   │
                    │  - Excel Service  │              │  - DataTable    │
                    │  - Logger         │              │  - ConfigPanel  │
                    └─────────┬────────┘              └────────┬────────┘
                              │                                 │
                    ┌─────────▼────────┐              ┌────────▼────────┐
                    │   Libraries       │              │   State         │
                    │  - ExcelJS        │              │  - Zustand      │
                    │  - Node FS        │              │  - IndexedDB    │
                    │  - Pino           │              │  - Zod          │
                    └───────────────────┘              └─────────────────┘
```

---

## Detailed Component Architecture

### 1. Electron Main Process

```
electron/main.js
├── Window Management
│   ├── BrowserWindow creation
│   ├── Security settings (context isolation)
│   └── DevTools in development
│
├── IPC Handler Registration
│   ├── File operations
│   ├── Excel operations
│   ├── Config operations
│   └── Logging operations
│
└── Lifecycle Management
    ├── App ready event
    ├── Window close handling
    └── Platform-specific behavior
```

### 2. Services Layer

```
electron/services/
│
├── fileService.js
│   ├── selectDirectory()
│   │   └── Uses Electron dialog API
│   │
│   └── scanXlsxFiles(path, recursive)
│       ├── Walks directory tree
│       ├── Filters .xlsx files
│       ├── Excludes temp files (~$)
│       └── Returns file metadata
│
└── excelService.js
    ├── loadExcelFile(path, config)
    │   ├── Opens workbook with ExcelJS
    │   ├── Reads first worksheet
    │   ├── Extracts headers
    │   ├── Reads configured columns
    │   ├── Preserves row colors
    │   └── Returns structured data
    │
    └── loadMultipleExcelFiles(paths, config)
        ├── Loads each file sequentially
        ├── Merges data structures
        ├── Tracks source files
        └── Returns combined dataset
```

### 3. IPC Communication Flow

```
Renderer (React)                  Preload                     Main Process
     │                              │                              │
     │  window.electronAPI.X()      │                              │
     ├─────────────────────────────►│                              │
     │                              │  ipcRenderer.invoke()        │
     │                              ├─────────────────────────────►│
     │                              │                              │
     │                              │                    ┌─────────▼────────┐
     │                              │                    │  IPC Handler     │
     │                              │                    │  (async function)│
     │                              │                    └─────────┬────────┘
     │                              │                              │
     │                              │                    ┌─────────▼────────┐
     │                              │                    │  Service Layer   │
     │                              │                    │  (fileService,   │
     │                              │                    │   excelService)  │
     │                              │                    └─────────┬────────┘
     │                              │                              │
     │                              │                    ┌─────────▼────────┐
     │                              │                    │  External Libs   │
     │                              │                    │  (ExcelJS, FS)   │
     │                              │                    └─────────┬────────┘
     │                              │                              │
     │                              │      Response                │
     │                              │◄─────────────────────────────┤
     │      Promise resolves        │                              │
     │◄─────────────────────────────┤                              │
     │                              │                              │
┌────▼─────┐                       │                              │
│ Update   │                       │                              │
│ Zustand  │                       │                              │
│ Store    │                       │                              │
└────┬─────┘                       │                              │
     │                              │                              │
┌────▼─────┐                       │                              │
│ React    │                       │                              │
│ Re-render│                       │                              │
└──────────┘                       │                              │
```

### 4. React Component Hierarchy

```
AppNew (Main Container)
│
├── Header
│   ├── Title & Subtitle
│   └── ConfigPanel (Dropdown)
│       ├── Columns to read
│       ├── Color column index
│       ├── Skip empty rows
│       ├── Header row index
│       └── Reset button
│
├── Main Layout (Grid)
│   │
│   ├── Sidebar (Left Column)
│   │   └── ExcelFilePicker
│   │       ├── Folder selection button
│   │       ├── Recursive checkbox
│   │       ├── Refresh button
│   │       ├── Statistics badges
│   │       ├── Bulk actions
│   │       └── File list (checkboxes)
│   │
│   └── Content (Right Column)
│       └── ExcelDataTable
│           ├── Load button
│           ├── Clear button
│           ├── Summary stats
│           ├── Source files list
│           └── Data table
│               ├── Sticky headers
│               ├── Dynamic columns
│               ├── Colored rows
│               └── Scrollable content
│
└── Footer
    └── Version info & status
```

### 5. State Management (Zustand)

```
appStore (Zustand)
│
├── Persisted State (IndexedDB)
│   ├── workspaceDir: string | null
│   └── config: ExcelConfig
│       ├── columnsToRead: number
│       ├── colorColumnIndex: number
│       ├── skipEmptyRows: boolean
│       └── headerRowIndex: number
│
├── Session State (Memory)
│   ├── excelFiles: ExcelFile[]
│   │   └── For each: { fileName, filePath, selected, ... }
│   │
│   ├── loadedData: ExcelData | null
│   │   ├── sourceFiles: ExcelFile[]
│   │   ├── headers: string[]
│   │   ├── rows: ExcelRow[]
│   │   ├── totalRows: number
│   │   └── columnsCount: number
│   │
│   ├── loading: boolean
│   └── error: string | null
│
└── Actions
    ├── setWorkspaceDir(dir)
    ├── setExcelFiles(files)
    ├── toggleFileSelection(filePath)
    ├── selectAllFiles()
    ├── deselectAllFiles()
    ├── setLoadedData(data)
    ├── updateConfig(config)
    ├── setLoading(loading)
    ├── setError(error)
    └── reset()
```

---

## Data Flow Diagrams

### Scenario 1: User Selects Folder

```
User clicks "Wybierz folder"
    │
    ├─► ExcelFilePicker.handleSelectFolder()
    │       │
    │       ├─► window.electronAPI.selectXlsxDirectory()
    │       │       │
    │       │       ├─► IPC: file:select-xlsx-directory
    │       │       │       │
    │       │       │       ├─► fileService.selectDirectory()
    │       │       │       │       │
    │       │       │       │       └─► Electron dialog.showOpenDialog()
    │       │       │       │
    │       │       │       └─► Returns: directoryPath
    │       │       │
    │       │       └─► Promise resolves with path
    │       │
    │       ├─► useAppStore.setWorkspaceDir(path)
    │       │       └─► Persisted to IndexedDB
    │       │
    │       └─► handleScanFiles(path)
    │               │
    │               └─► (See Scenario 2)
    │
    └─► UI updates to show folder path
```

### Scenario 2: Scan Files in Directory

```
handleScanFiles(directoryPath, recursive)
    │
    ├─► useAppStore.setLoading(true)
    │
    ├─► window.electronAPI.scanXlsxFiles(path, recursive)
    │       │
    │       ├─► IPC: file:scan-xlsx-files
    │       │       │
    │       │       ├─► fileService.scanXlsxFiles(path, recursive)
    │       │       │       │
    │       │       │       ├─► _walkDirectory() recursively
    │       │       │       │       ├─► fs.readdir()
    │       │       │       │       ├─► Filter .xlsx files
    │       │       │       │       ├─► Exclude ~$ temp files
    │       │       │       │       └─► Collect metadata
    │       │       │       │
    │       │       │       └─► Returns: { success, files[], error? }
    │       │       │
    │       │       └─► Response
    │       │
    │       └─► Promise resolves with result
    │
    ├─► useAppStore.setExcelFiles(files)
    │
    ├─► useAppStore.setLoading(false)
    │
    └─► UI re-renders with file list
```

### Scenario 3: Load Excel Files

```
User clicks "Załaduj wybrane pliki"
    │
    ├─► ExcelDataTable.handleLoadData()
    │       │
    │       ├─► Get selected files from store
    │       │
    │       ├─► useAppStore.setLoading(true)
    │       │
    │       ├─► window.electronAPI.loadMultipleExcelFiles(paths, config)
    │       │       │
    │       │       ├─► IPC: excel:load-multiple-files
    │       │       │       │
    │       │       │       ├─► excelService.loadMultipleExcelFiles(paths, config)
    │       │       │       │       │
    │       │       │       │       ├─► For each file:
    │       │       │       │       │   ├─► new ExcelJS.Workbook()
    │       │       │       │       │   ├─► workbook.xlsx.readFile(path)
    │       │       │       │       │   ├─► Get first worksheet
    │       │       │       │       │   ├─► Read headers (row 0)
    │       │       │       │       │   ├─► Read N columns (config)
    │       │       │       │       │   ├─► Extract row colors
    │       │       │       │       │   └─► Collect rows
    │       │       │       │       │
    │       │       │       │       ├─► Merge all rows
    │       │       │       │       ├─► Track source files
    │       │       │       │       └─► Return combined ExcelData
    │       │       │       │
    │       │       │       └─► Returns: { success, data, error? }
    │       │       │
    │       │       └─► Promise resolves with result
    │       │
    │       ├─► useAppStore.setLoadedData(data)
    │       │
    │       ├─► useAppStore.setLoading(false)
    │       │
    │       └─► ExcelDataTable re-renders with data
    │               │
    │               ├─► Render table headers (dynamic)
    │               ├─► Render table rows
    │               │   └─► Apply row colors (ARGB → rgba)
    │               └─► Show statistics
```

---

## Type System Flow

```
Runtime Data (Excel File)
    │
    ├─► ExcelJS reads file
    │
    ├─► Services transform to plain objects
    │
    ├─► [Optional] Zod validation
    │       ├─► ExcelRowSchema.parse()
    │       ├─► ExcelFileSchema.parse()
    │       └─► ExcelDataSchema.parse()
    │
    ├─► IPC sends data to renderer
    │
    ├─► TypeScript types enforce structure
    │       ├─► ExcelRow interface
    │       ├─► ExcelFile interface
    │       └─► ExcelData interface
    │
    └─► React components receive typed props
```

---

## Security Boundaries

```
┌────────────────────────────────────────────────┐
│              Untrusted Zone                     │
│         (User's File System)                    │
│                                                 │
│  - Excel files (.xlsx)                          │
│  - User-selected directories                    │
│  - Potentially malicious files                  │
└─────────────────┬──────────────────────────────┘
                  │
        ┌─────────▼─────────┐
        │  Security Layer    │
        │                    │
        │  - File validation │
        │  - Path sanitize   │
        │  - Type checking   │
        └─────────┬──────────┘
                  │
┌─────────────────▼──────────────────────────────┐
│            Electron Main Process                │
│          (Privileged - Node.js)                 │
│                                                 │
│  - Has file system access                       │
│  - Can execute system commands                  │
│  - Runs services and business logic             │
│  - Validates all IPC requests                   │
└─────────────────┬──────────────────────────────┘
                  │
        ┌─────────▼─────────┐
        │   Preload Script   │
        │                    │
        │  - contextBridge   │
        │  - Exposes API     │
        │  - No Node access  │
        └─────────┬──────────┘
                  │
┌─────────────────▼──────────────────────────────┐
│         Electron Renderer Process               │
│         (Sandboxed - Browser)                   │
│                                                 │
│  - No Node.js access                            │
│  - No file system access                        │
│  - Only IPC via window.electronAPI              │
│  - React UI runs here                           │
└─────────────────────────────────────────────────┘
```

---

## Performance Considerations

### Bottlenecks & Optimizations

```
File Scanning
├── Bottleneck: Large directories with 1000+ files
├── Mitigation: Async iteration, progress feedback
└── Future: Worker threads for heavy scans

Excel Loading
├── Bottleneck: Large .xlsx files (10k+ rows)
├── Mitigation: Stream processing, lazy loading
└── Future: Virtual scrolling in UI

State Updates
├── Bottleneck: Re-rendering large lists
├── Mitigation: Zustand selective subscriptions
└── Future: React.memo, useMemo for expensive renders

IPC Communication
├── Bottleneck: Large data payloads
├── Mitigation: Structured cloning, compression
└── Future: Chunked transfers for huge datasets
```

---

## File Structure Map

```
Project Root
│
├── src/ (Renderer Process - TypeScript)
│   ├── components/
│   │   ├── ExcelFilePicker.tsx ────┐
│   │   ├── ExcelFilePicker.css     │ Iteration 1
│   │   ├── ExcelDataTable.tsx      │ Components
│   │   └── ExcelDataTable.css ─────┘
│   │
│   ├── store/
│   │   └── appStore.ts ──── Zustand state management
│   │
│   ├── types/
│   │   ├── excel.types.ts ──── Zod schemas
│   │   ├── ipc.types.ts ────── IPC contracts
│   │   └── electron.d.ts ───── Type declarations
│   │
│   ├── AppNew.tsx ──────────── Main React component
│   ├── AppNew.css
│   ├── main.tsx ───────────── React entry point
│   └── index.css
│
├── electron/ (Main Process - JavaScript)
│   ├── services/
│   │   ├── fileService.js ──── File operations
│   │   └── excelService.js ─── Excel processing
│   │
│   ├── utils/
│   │   └── logger.js ──────── Pino logger
│   │
│   ├── main.js ────────────── Electron main
│   └── preload.js ─────────── IPC bridge
│
├── public/ ────────────────── Static assets
│
└── Documentation
    ├── README.md ──────────── Architecture plan
    ├── IMPLEMENTATION.md ──── Implementation log
    ├── QUICKSTART.md ──────── User guide
    ├── TESTING.md ─────────── Testing guide
    ├── SUMMARY.md ─────────── Project summary
    └── ARCHITECTURE.md ────── This file
```

---

## Technology Stack Layers

```
┌─────────────────────────────────────────────┐
│              User Interface                  │
│  React 19 + TypeScript + CSS3               │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           State Management                   │
│  Zustand + IndexedDB (via idb-keyval)       │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│            Type System                       │
│  TypeScript + Zod Schemas                   │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│        IPC Communication                     │
│  Electron IPC + Preload Bridge              │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          Business Logic                      │
│  Services (File, Excel) + Logger            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│        External Libraries                    │
│  ExcelJS + Node.js FS + Pino                │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Operating System                     │
│  File System + Native Dialogs               │
└─────────────────────────────────────────────┘
```

---

## Build & Deployment Flow

```
Development
    │
    ├─► npm run dev ─────────► Vite dev server (localhost:5173)
    │                           - Hot reload
    │                           - Source maps
    │                           - Fast refresh
    │
    └─► npm run electron:dev ─► Electron app
                                 - Loads from dev server
                                 - DevTools open
                                 - Live reload

Production Build
    │
    ├─► npm run build
    │       ├─► TypeScript compilation (tsc)
    │       └─► Vite build
    │           ├─► Bundle optimization
    │           ├─► Minification
    │           ├─► Tree shaking
    │           └─► Output: dist/
    │
    └─► npm run build-electron
            ├─► Electron Builder
            ├─► Package app + dist/
            ├─► Create installer (NSIS)
            └─► Output: dist-electron/
                    └─► Setup.exe (Windows)
```

---

This architecture supports the current implementation (Iterations 0+1) and is designed to scale for future iterations (2-5).

---

**CPK Export Weryfikacja**  
Architecture Documentation v1.0  
October 6, 2025
