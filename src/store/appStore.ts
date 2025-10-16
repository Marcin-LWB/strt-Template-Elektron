import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExcelFile, ExcelData } from '../types/excel.types';

/**
 * Główny store aplikacji - Zustand
 */

interface AppState {
  // Workspace
  workspaceDir: string | null;
  setWorkspaceDir: (dir: string | null) => void;
  
  // Excel files
  excelFiles: ExcelFile[];
  setExcelFiles: (files: ExcelFile[]) => void;
  toggleFileSelection: (filePath: string) => void;
  selectAllFiles: () => void;
  deselectAllFiles: () => void;
  
  // Loaded data
  loadedData: ExcelData | null;
  setLoadedData: (data: ExcelData | null) => void;
  updateLoadedData: (data: ExcelData) => void;
  
  // UI state
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  
  // Actions
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      workspaceDir: null,
      excelFiles: [],
      loadedData: null,
      loading: false,
      error: null,
      
      // Workspace actions
      setWorkspaceDir: (dir) => set({ workspaceDir: dir }),
      
      // Excel files actions
      setExcelFiles: (files) => set({ excelFiles: files }),
      
      toggleFileSelection: (filePath) => set((state) => ({
        excelFiles: state.excelFiles.map((f) =>
          f.filePath === filePath ? { ...f, selected: !f.selected } : f
        ),
      })),
      
      selectAllFiles: () => set((state) => ({
        excelFiles: state.excelFiles.map((f) => ({ ...f, selected: true })),
      })),
      
      deselectAllFiles: () => set((state) => ({
        excelFiles: state.excelFiles.map((f) => ({ ...f, selected: false })),
      })),
      
      // Data actions
      setLoadedData: (data) => set({ loadedData: data }),
      updateLoadedData: (data) => set({ loadedData: data }),
      
      // UI actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      // Reset
      reset: () => set({
        workspaceDir: null,
        excelFiles: [],
        loadedData: null,
        loading: false,
        error: null,
      }),
    }),
    {
      name: 'cpk-export-storage',
      partialize: (state) => ({
        workspaceDir: state.workspaceDir,
      }),
    }
  )
);
