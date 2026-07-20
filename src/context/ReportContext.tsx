import React, { createContext, useContext, useState, useCallback } from 'react';
import { useProjectContext } from './ProjectContext';
import { useCoordinates } from '../hooks/useCoordinates';
import { useMeasurements } from '../hooks/useMeasurements';

interface ReportContextValue {
  isGenerating: boolean;
  error: string | null;
  success: string | null;
  showPreview: boolean;
  generatePreview: () => void;
  exportPDF: (mapImageBase64?: string) => Promise<void>;
  closePreview: () => void;
  clearNotifications: () => void;
}

const ReportContext = createContext<ReportContextValue | null>(null);

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const { activeProject } = useProjectContext();
  const { coordinates } = useCoordinates();
  const { measurements } = useMeasurements();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const clearNotifications = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const triggerNotificationTimeout = useCallback(() => {
    setTimeout(() => {
      clearNotifications();
    }, 4000);
  }, [clearNotifications]);

  const generatePreview = useCallback(() => {
    clearNotifications();
    if (!activeProject) {
      setError('No active project is selected');
      triggerNotificationTimeout();
      return;
    }
    if (coordinates.length < 3) {
      setError('At least 3 coordinates are required to generate a report');
      triggerNotificationTimeout();
      return;
    }
    setShowPreview(true);
  }, [activeProject, coordinates.length, clearNotifications, triggerNotificationTimeout]);

  const closePreview = useCallback(() => {
    setShowPreview(false);
    clearNotifications();
  }, [clearNotifications]);

  const exportPDF = useCallback(
    async (mapImageBase64?: string) => {
      if (!activeProject) {
        setError('No active project to export');
        triggerNotificationTimeout();
        return;
      }
      if (coordinates.length < 3) {
        setError('No valid coordinates found');
        triggerNotificationTimeout();
        return;
      }

      setIsGenerating(true);
      clearNotifications();

      try {
        const payload = {
          project: activeProject,
          coordinates,
          measurements,
          mapImageBase64,
          version: '1.0.0',
        };

        const res = await window.electronAPI.exportReportPDF(payload);
        if (res.success) {
          setSuccess('Report PDF exported successfully');
          setShowPreview(false);
          triggerNotificationTimeout();
        } else if (!res.success && res.error !== 'Report export cancelled') {
          setError(res.error ?? 'Failed to export report');
          triggerNotificationTimeout();
        }
      } catch (err) {
        setError((err as Error).message);
        triggerNotificationTimeout();
      } finally {
        setIsGenerating(false);
      }
    },
    [activeProject, coordinates, measurements, clearNotifications, triggerNotificationTimeout]
  );

  return (
    <ReportContext.Provider
      value={{
        isGenerating,
        error,
        success,
        showPreview,
        generatePreview,
        exportPDF,
        closePreview,
        clearNotifications,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const ctx = useContext(ReportContext);
  if (!ctx) {
    throw new Error('useReport must be used inside a ReportProvider');
  }
  return ctx;
}
