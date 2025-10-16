# 🎨 UI Components Visual Reference

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 CPK Export Weryfikacja                          [⚙️ Konfiguracja] │
│ Weryfikacja i automatyzacja eksportu zasobów multimedialnych        │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Panel roboczy - Zarządzanie plikami              [Kliknij zwijanie]│
├────────────────────┬────────────────────────────────────────────────┤
│                    │                                                │
│  📊 EXCEL (20%)    │  🔍 PDF CHECKER (80%)                         │
│                    │                                                │
│  ┌──────────────┐  │  ┌──────────────────────────────────────────┐ │
│  │ Wybierz      │  │  │ [📁 Folder źródłowy] [⚡ Domyślna]       │ │
│  │ folder Excel │  │  │                                          │ │
│  │              │  │  │ [✓ Sprawdź pliki P001]                  │ │
│  │ □ Skanuj     │  │  │                                          │ │
│  │   podkatalogi│  │  │ [📦 Folder docelowy] [⚡ Domyślna]      │ │
│  │              │  │  │                                          │ │
│  │ [🔄 Odśwież] │  │  │ [💾 Kopiuj znalezione]                  │ │
│  └──────────────┘  │  └──────────────────────────────────────────┘ │
│                    │                                                │
│  Lista plików:     │  Status:                                       │
│  □ file1.xlsx      │  📁 Folder źródłowy: P:\PROJEKTY\...          │
│  ☑ file2.xlsx      │  📂 Folder docelowy: P:\PROJEKTY\...          │
│  □ file3.xlsx      │                                                │
│                    │  💡 Domyślne ścieżki:                          │
│  [📥 Załaduj]      │  📁 Źródło: P:\...\KONTENER                   │
│                    │  📂 Cel: P:\...\Tom 2.1                       │
│  ✅ Załadowano:    │                                                │
│  245 wierszy       │                                                │
│  z 3 plików        │                                                │
│                    │                                                │
│  💡 Domyślna       │                                                │
│  ścieżka:          │                                                │
│  P:\PROJEKTY\...   │                                                │
└────────────────────┴────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 TABELA DANYCH (EXCEL DATA TABLE)                                 │
├─────────────────────────────────────────────────────────────────────┤
│ [Załaduj] [Wyczyść]                    Wierszy: 245 | Kolumn: 12   │
├──────┬──────────────┬──────────┬──────────┬────────────────────────┤
│ Col1 │ FILE NUMBER  │ Folder   │ Col4...  │ Exist                  │
├──────┼──────────────┼──────────┼──────────┼────────────────────────┤
│ ABC  │ P001001      │ Tom 2    │ ...      │ ✅ TAK - C:\path\...   │
│ DEF  │ P001002      │ Tom 2.1  │ ...      │ ❌ BRAK                │
│ GHI  │ P001003      │ Tom 3    │ ...      │ ✅ TAK - C:\path\...   │
│ ...  │ ...          │ ...      │ ...      │ ...                    │
└──────┴──────────────┴──────────┴──────────┴────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ CPK Export v1.0.0 • UI Redesign v2 • ✅ Electron Mode               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. CollapsiblePanel (Zwijany panel)

**Stan rozwinięty:**
```
┌─────────────────────────────────────────────────────────┐
│ ▼ Panel roboczy - Zarządzanie plikami                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [ZAWARTOŚĆ PANELU]                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Stan zwinięty:**
```
┌─────────────────────────────────────────────────────────┐
│ ▶ Panel roboczy - Zarządzanie plikami                   │
└─────────────────────────────────────────────────────────┘
```

**Właściwości:**
- Background: `white`
- Shadow: `0 2px 8px rgba(0,0,0,0.08)`
- Animacja: `slideDown 0.3s ease`
- Interaktywność: Click na nagłówek + keyboard (Enter)

---

### 2. WorkflowPanel (Layout 1/5 + 4/5)

**Desktop (> 1200px):**
```
┌──────────────┬──────────────────────────────────────────┐
│  Excel       │  PDF Checker                             │
│  (20%)       │  (80%)                                   │
│              │                                          │
│  Wąska       │  Szeroka sekcja z przyciskami i info     │
│  kolumna     │                                          │
└──────────────┴──────────────────────────────────────────┘
```

**Mobile/Tablet (< 1200px):**
```
┌──────────────────────────────────────────────────────────┐
│  Excel (100%)                                            │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  PDF Checker (100%)                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**CSS:**
```css
.workflow-panel {
  display: flex;
  gap: 20px;
}

.workflow-excel {
  flex: 0 0 20%;  /* 1/5 */
  min-width: 280px;
}

.workflow-pdf {
  flex: 1;  /* 4/5 (pozostała przestrzeń) */
  min-width: 0;
}

@media (max-width: 1200px) {
  .workflow-panel {
    flex-direction: column;
  }
  .workflow-excel,
  .workflow-pdf {
    flex: 1;
    min-width: 100%;
  }
}
```

---

### 3. Excel Section (Sekcja Excel)

```
┌─────────────────────────┐
│ 📊 Pliki Excel          │
│ Wybierz pliki do...     │
├─────────────────────────┤
│                         │
│ ExcelFilePicker         │
│ (komponent istniejący)  │
│                         │
├─────────────────────────┤
│                         │
│ [📥 Załaduj wybrane]    │ ← NOWY przycisk
│                         │
│ ✅ Załadowano:          │ ← Status
│ 245 wierszy z 3 plików  │
│                         │
├─────────────────────────┤
│ 💡 Domyślna ścieżka:    │ ← Hint
│ P:\PROJEKTY\...         │
└─────────────────────────┘
```

**Elementy:**
- **Nagłówek** (`<h3>`) + opis
- **ExcelFilePicker** - lista plików z checkboxami
- **Przycisk ładowania** - gradient fioletowy
- **Status** - zielone tło po załadowaniu
- **Hint** - żółte tło z domyślną ścieżką

---

### 4. PDF Checker Section

```
┌──────────────────────────────────────────────────────────┐
│ 🔍 Sprawdź pliki PDF (P001)                              │
│ Weryfikacja i kopiowanie plików PDF...                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [📁 Folder źródłowy] [⚡ Domyślna]                       │
│                                                          │
│ [✓ Sprawdź pliki P001]                                  │
│                                                          │
│ [📦 Folder docelowy] [⚡ Domyślna]                       │
│                                                          │
│ [💾 Kopiuj znalezione]                                  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 📁 Folder źródłowy: P:\PROJEKTY\...                     │
│ 📂 Folder docelowy: P:\PROJEKTY\...                     │
├──────────────────────────────────────────────────────────┤
│ ✅ Sprawdzono 45 plików P001. Znaleziono: 42            │
├──────────────────────────────────────────────────────────┤
│ 💡 Domyślne ścieżki:                                     │
│ 📁 Źródło: P:\...\KONTENER                              │
│ 📂 Cel: P:\...\Tom 2.1                                  │
└──────────────────────────────────────────────────────────┘
```

**Action Groups:**
```html
<div class="action-group">
  <button class="btn-secondary">📁 Folder źródłowy</button>
  <button class="btn-link">⚡ Domyślna</button>
</div>
```

**Status boxes:**
- Niebieski (`#e7f3ff`) - info o folderach
- Zielony (`#d4edda`) - sukces
- Czerwony (`#f8d7da`) - błędy
- Jasnoniebieski (`#d1ecf1`) - procesy w toku

---

### 5. Button Styles

**Primary Button (Główny):**
```
┌────────────────────────┐
│ 📥 Załaduj wybrane     │  ← Gradient fioletowy
└────────────────────────┘     Shadow + hover animation
```

**CSS:**
```css
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
```

**Secondary Button:**
```
┌────────────────────────┐
│ 📁 Folder źródłowy     │  ← Szare tło
└────────────────────────┘     Minimalistyczny
```

**Link Button:**
```
⚡ Domyślna  ← Podkreślony link
```

---

## File Naming Convention (Numeracja)

### PRZED (v1):
```
1_P001001.pdf
2_P001002.pdf
...
45_P001045.pdf
```

### PO (v2):
```
0001_P001001.pdf
0002_P001002.pdf
...
0045_P001045.pdf
```

**Implementacja:**
```typescript
task.rowIndex.toString().padStart(4, '0')
// rowIndex = 45 → "0045"
```

---

## Color Scheme

### Kolory główne
```css
--primary: #667eea        /* Fioletowy (gradient start) */
--secondary: #764ba2      /* Ciemny fiolet (gradient end) */
--background: #e8e8e8     /* Jasne tło */
--white: #ffffff          /* Białe panele */
--dark: #2d2d2d           /* Ciemny tekst/header */
```

### Kolory statusów
```css
--success: #d4edda        /* Zielony background */
--success-text: #155724   /* Zielony tekst */
--error: #f8d7da          /* Czerwony background */
--error-text: #721c24     /* Czerwony tekst */
--info: #d1ecf1           /* Niebieski background */
--info-text: #0c5460      /* Niebieski tekst */
--warning: #fff3cd        /* Żółty background */
--warning-text: #856404   /* Żółty tekst */
```

---

## Responsive Breakpoints

```css
/* Desktop (default) */
@media (min-width: 1201px) {
  .workflow-panel { flex-direction: row; }
  .workflow-excel { flex: 0 0 20%; }
  .workflow-pdf { flex: 1; }
}

/* Tablet */
@media (max-width: 1200px) {
  .workflow-panel { flex-direction: column; }
}

/* Mobile */
@media (max-width: 768px) {
  .section-header h3 { font-size: 1rem; }
  .btn-primary, .btn-secondary { font-size: 13px; }
}
```

---

**Dokumentacja wizualna**  
**Wersja:** UI Redesign v2  
**Data:** 2025-10-06
