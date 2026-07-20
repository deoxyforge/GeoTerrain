import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { PolygonGeometry } from '../types/geometry';
import { useCoordinates } from '../hooks/useCoordinates';
import { useProjectContext } from './ProjectContext';

interface GeometryContextValue {
  geometry: PolygonGeometry | null;
  isLoading: boolean;
  error: string | null;
  reconstructGeometry: () => Promise<void>;
}

const GeometryContext = createContext<GeometryContextValue | null>(null);

export function GeometryProvider({ children }: { children: React.ReactNode }) {
  const { activeProject } = useProjectContext();
  const { coordinates, validationResult } = useCoordinates();
  const [geometry, setGeometry] = useState<PolygonGeometry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reconstructGeometry = useCallback(async () => {
    if (!activeProject) {
      setGeometry(null);
      setError(null);
      return;
    }

    // Refuse construction if validation is not completed or has errors
    if (!validationResult || !validationResult.valid || coordinates.length < 3) {
      setGeometry(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await window.electronAPI.constructGeometry(activeProject.id);
      if (res.success && res.data) {
        setGeometry(res.data);
      } else {
        setGeometry(null);
        setError(res.error ?? 'Failed to construct polygon geometry');
      }
    } catch {
      setGeometry(null);
      setError('Failed to communicate with geometry engine');
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, coordinates.length, validationResult]);

  // Reactively trigger geometry reconstruction when coordinate list or validation outcome changes
  useEffect(() => {
    reconstructGeometry();
  }, [reconstructGeometry]);

  return (
    <GeometryContext.Provider
      value={{
        geometry,
        isLoading,
        error,
        reconstructGeometry,
      }}
    >
      {children}
    </GeometryContext.Provider>
  );
}

export function useGeometryContext() {
  const ctx = useContext(GeometryContext);
  if (!ctx) throw new Error('useGeometryContext must be used inside GeometryProvider');
  return ctx;
}
