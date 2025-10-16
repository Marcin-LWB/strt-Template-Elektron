# 🧪 Testing Guide - CPK Export Weryfikacja

## Quick Testing Checklist

Use this guide to verify that Iteration 0 + 1 are working correctly.

---

## ⚡ Quick Start Test (5 minutes)

### 1. Start the Application

```bash
# Terminal 1: Start Vite
npm run dev

# Terminal 2: Start Electron (after Vite starts)
npm run electron:dev
```

**Expected Result:**
- ✅ Vite server starts on `http://localhost:5173`
- ✅ Electron window opens with the application
- ✅ DevTools open automatically (in development mode)
- ✅ No errors in terminal or console

---

## 📁 Test 1: Folder Selection

### Steps:
1. Click **"📂 Wybierz folder"** button
2. Select a folder containing .xlsx files
3. Wait for automatic scan

### Expected Results:
- ✅ Native folder picker dialog appears
- ✅ After selection, folder path shows under "Folder roboczy"
- ✅ File list populates on the left side
- ✅ Badge shows count: "Wszystkich plików: X"
- ✅ Console log: "Found X xlsx files"

### If No Files Found:
- Try checking "Skanuj podkatalogi"
- Verify folder actually contains .xlsx files (not .xls)
- Check that files don't start with ~$ (temp files)

---

## ☑️ Test 2: File Selection

### Steps:
1. Click checkboxes next to individual files
2. Click **"☑️ Zaznacz wszystkie"**
3. Click **"☐ Odznacz wszystkie"**
4. Select 2-3 files manually

### Expected Results:
- ✅ Individual checkboxes toggle on click
- ✅ Selected files have blue highlight background
- ✅ "Zaznaczonych: X" badge updates
- ✅ Select/Deselect all works correctly
- ✅ Selection persists when scrolling

---

## 📊 Test 3: Excel Loading

### Steps:
1. Select 1-3 Excel files with checkboxes
2. Click **"📥 Załaduj wybrane pliki"**
3. Wait for loading (spinner appears)
4. Observe the data table on the right

### Expected Results:
- ✅ Button shows "⏳ Ładuję..." during loading
- ✅ No errors in console
- ✅ Data table populates with rows
- ✅ Headers match Excel column names
- ✅ "Źródłowe pliki" section shows file count
- ✅ "Wiersze: X" shows total row count
- ✅ Console log: "Loaded X rows"

### Sample Excel Format for Testing:
Create a simple test file `test.xlsx`:

| Name | Status | Date | Notes |
|------|--------|------|-------|
| Item1 | OK | 2025-01-01 | Test |
| Item2 | ERROR | 2025-01-02 | Demo |

---

## 🎨 Test 4: Color Preservation

### Steps:
1. Create an Excel file with colored rows
2. Add background colors to cells in column B (index 1)
3. Load the file
4. Check if colors appear in the table

### Expected Results:
- ✅ Rows with colored cells show tinted background
- ✅ Colors are subtle (30% opacity)
- ✅ Text remains readable

### How to Add Colors in Excel:
1. Select cells in column B
2. Home → Fill Color → Choose a color
3. Save as .xlsx
4. Load in the app

---

## ⚙️ Test 5: Configuration Panel

### Steps:
1. Click **"⚙️ Konfiguracja"** in header
2. Change "Liczba kolumn do odczytu" to 15
3. Reload files
4. Click "Przywróć domyślne"

### Expected Results:
- ✅ Dropdown panel appears
- ✅ All 4 config options are editable
- ✅ Changing columns affects loaded data
- ✅ "Przywróć domyślne" resets all values
- ✅ Settings persist after reload

---

## 💾 Test 6: State Persistence

### Steps:
1. Select a folder and load some files
2. Close the Electron app
3. Restart the Electron app
4. Check if folder path is remembered

### Expected Results:
- ✅ Folder path is restored
- ✅ Configuration is restored
- ✅ No file list (expected - files aren't persisted)
- ✅ Need to click "🔄 Odśwież" to rescan

---

## 🔄 Test 7: Refresh & Clear

### Steps:
1. Load some files
2. Click **"🔄 Odśwież"** (in file picker)
3. Click **"🗑️ Wyczyść"** (in data table)

### Expected Results:
- ✅ Refresh re-scans the folder
- ✅ File list updates if files changed
- ✅ Clear removes data from table
- ✅ File selections remain intact

---

## 🧩 Test 8: Multiple File Merging

### Steps:
1. Create 3 Excel files with same structure:
   - File1.xlsx: Headers (Name, Status, Value), 3 rows
   - File2.xlsx: Same headers, 5 rows
   - File3.xlsx: Same headers, 2 rows
2. Select all 3 files
3. Load them

### Expected Results:
- ✅ Total rows = 10 (3+5+2)
- ✅ "Źródłowe pliki: 3"
- ✅ Each row shows source file in table
- ✅ Headers are unified (from first file)
- ✅ All data visible in table

---

## 🚨 Test 9: Error Handling

### Test A: Empty Folder
1. Select folder with no .xlsx files
2. Expected: "Nie znaleziono plików Excel"

### Test B: Load Without Selection
1. Don't select any files
2. Click "Załaduj"
3. Expected: "Nie wybrano żadnych plików"

### Test C: Corrupted Excel
1. Create a text file, rename to .xlsx
2. Try to load
3. Expected: Error message in red box

### Expected Results:
- ✅ No app crashes
- ✅ Error messages are user-friendly
- ✅ Errors logged to console
- ✅ Can recover and continue using app

---

## 📊 Test 10: Large Dataset

### Steps:
1. Create/use an Excel file with 100+ rows
2. Load it
3. Scroll the table

### Expected Results:
- ✅ All rows load (may take 1-2 seconds)
- ✅ Table scrolls smoothly
- ✅ Headers stay sticky at top
- ✅ No performance issues
- ✅ Row numbers display correctly

---

## 🔍 Test 11: Developer Console

### Steps:
1. Open DevTools (Ctrl+Shift+I on Windows)
2. Check Console tab
3. Perform various actions
4. Watch for log messages

### Expected Log Messages:
- ✅ "CPK Export Weryfikacja - Aplikacja uruchomiona"
- ✅ "IPC handlers registered"
- ✅ "Loading Excel file: ..."
- ✅ "Found X xlsx files"
- ✅ "Loaded X rows from SheetName"

### No Errors Should Appear:
- ❌ No red errors
- ❌ No unhandled promise rejections
- ❌ No CORS errors

---

## 🌐 Test 12: Browser Mode (Should Fail Gracefully)

### Steps:
1. Open `http://localhost:5173` in Chrome
2. Try to use the app

### Expected Results:
- ✅ UI loads and displays
- ✅ Warning: "Aplikacja nie działa w trybie Electron"
- ✅ Warning: "Electron API niedostępne"
- ✅ Buttons show errors when clicked
- ✅ No JavaScript errors

---

## 📋 Test Results Template

Use this to track your testing:

```
Date: __________
Tester: __________

✅ Test 1: Folder Selection       [ PASS / FAIL ]
✅ Test 2: File Selection          [ PASS / FAIL ]
✅ Test 3: Excel Loading           [ PASS / FAIL ]
✅ Test 4: Color Preservation      [ PASS / FAIL ]
✅ Test 5: Configuration Panel     [ PASS / FAIL ]
✅ Test 6: State Persistence       [ PASS / FAIL ]
✅ Test 7: Refresh & Clear         [ PASS / FAIL ]
✅ Test 8: Multiple File Merging   [ PASS / FAIL ]
✅ Test 9: Error Handling          [ PASS / FAIL ]
✅ Test 10: Large Dataset          [ PASS / FAIL ]
✅ Test 11: Developer Console      [ PASS / FAIL ]
✅ Test 12: Browser Mode           [ PASS / FAIL ]

Overall: [ PASS / FAIL ]

Notes:
_____________________________________
_____________________________________
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module"
**Solution**: Run `npm install` again

### Issue: Electron window blank
**Solution**: 
1. Check if Vite is running (`npm run dev`)
2. Wait 5 seconds after Vite starts
3. Check DevTools console for errors

### Issue: No files found
**Solution**:
1. Verify folder has .xlsx files
2. Try "Skanuj podkatalogi"
3. Check file permissions

### Issue: Excel won't load
**Solution**:
1. Verify it's a real .xlsx file (not renamed)
2. Check if file is open in Excel (close it)
3. Try with a simple test file first

### Issue: Colors not showing
**Solution**:
1. Verify color is in column B (index 1)
2. Check config: "Indeks kolumny z kolorem" = 1
3. Use background color, not font color

---

## 🎯 Success Criteria

All tests should pass with:
- ✅ No application crashes
- ✅ No unhandled errors in console
- ✅ Expected UI behavior
- ✅ Data loads correctly
- ✅ State persists properly

If 10+ tests pass → **Iteration 0+1 is solid!** 🎉

---

## 📞 Reporting Issues

If you find bugs, note:
1. Which test failed
2. Steps to reproduce
3. Error message (if any)
4. Screenshot/console logs
5. Your environment (OS, Node version)

---

**Happy Testing!** 🧪🚀
