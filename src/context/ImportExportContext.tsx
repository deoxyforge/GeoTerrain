import React, { createContext, useContext, useState, useCallback } from 'react';
import { useProjectContext } from './ProjectContext';
import { useCoordinates } from '../hooks/useCoordinates';

interface ImportExportContextValue {
  isOperating: boolean;
  successMessage: string | null;
  errorMessage: string | null;
  clearNotifications: () => void;
  importData: (format: 'json' | 'csv' | 'geojson') => Promise<void>;
  exportData: (format: 'json' | 'csv' | 'geojson') => Promise<void>;
}

const ImportExportContext = createContext<ImportExportContextValue | null>(null);

export function ImportExportProvider({ children }: { children: React.ReactNode }) {
  const { activeProject, selectProject, loadProjects } = useProjectContext();
  const { coordinates, loadCoordinates, recordHistoryState } = useCoordinates();
  const [isOperating, setIsOperating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearNotifications = useCallback(() => {
    setSuccessMessage(null);
    setErrorMessage(null);
  }, []);

  const triggerNotificationTimeout = useCallback(() => {
    setTimeout(() => {
      clearNotifications();
    }, 4000);
  }, [clearNotifications]);

  const importData = useCallback(
    async (format: 'json' | 'csv' | 'geojson') => {
      setIsOperating(true);
      clearNotifications();

      // Record history state for CSV/GeoJSON imports to enable Undo
      if (format !== 'json' && activeProject) {
        recordHistoryState([...coordinates]);
      }

      try {
        const res = await window.electronAPI.importFromFile(format, activeProject?.id);

        if (res.success && res.data) {
          const importedProj = res.data;
          if (format === 'json' && !Array.isArray(importedProj)) {
            // Native project import: re-query projects list, and select the newly imported project
            await loadProjects();
            await selectProject(importedProj.id);
            setSuccessMessage(`Successfully imported project "${importedProj.name}"`);
          } else {
            // CSV/GeoJSON import: reload coordinates for active project
            if (activeProject) {
              await loadCoordinates(activeProject.id);
              setSuccessMessage(
                `Successfully imported vertices boundary from ${format.toUpperCase()}`
              );
            }
          }
          triggerNotificationTimeout();
        } else if (!res.success && res.error !== 'Import cancelled') {
          setErrorMessage(res.error ?? 'Failed to import file');
          triggerNotificationTimeout();
        }
      } catch (err) {
        setErrorMessage((err as Error).message);
        triggerNotificationTimeout();
      } finally {
        setIsOperating(false);
      }
    },
    [
      activeProject,
      loadProjects,
      selectProject,
      coordinates,
      loadCoordinates,
      recordHistoryState,
      clearNotifications,
      triggerNotificationTimeout,
    ]
  );

  const exportData = useCallback(
    async (format: 'json' | 'csv' | 'geojson') => {
      if (!activeProject) {
        setErrorMessage('No active project to export');
        triggerNotificationTimeout();
        return;
      }

      setIsOperating(true);
      clearNotifications();

      try {
        const res = await window.electronAPI.exportToFile(activeProject.id, format);
        if (res.success) {
          setSuccessMessage(`Project exported successfully as ${format.toUpperCase()}`);
          triggerNotificationTimeout();
        } else if (!res.success && res.error !== 'Export cancelled') {
          setErrorMessage(res.error ?? 'Failed to export project');
          triggerNotificationTimeout();
        }
      } catch (err) {
        setErrorMessage((err as Error).message);
        triggerNotificationTimeout();
      } finally {
        setIsOperating(false);
      }
    },
    [activeProject, clearNotifications, triggerNotificationTimeout]
  );

  return (
    <ImportExportContext.Provider
      value={{
        isOperating,
        successMessage,
        errorMessage,
        clearNotifications,
        importData,
        exportData,
      }}
    >
      {children}
    </ImportExportContext.Provider>
  );
}

export function useImportExport() {
  const ctx = useContext(ImportExportContext);
  if (!ctx) throw new Error('useImportExport must be used inside ImportExportProvider');
  return ctx;
}
