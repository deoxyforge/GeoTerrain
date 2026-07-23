import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { MeasurementResult } from '../types/measurement';
import { useGeometry } from '../hooks/useGeometry';
import { useProjectContext } from './ProjectContext';

interface MeasurementContextValue {
  measurements: MeasurementResult | null;
  isLoading: boolean;
  error: string | null;
  calculate: () => Promise<void>;
}

const MeasurementContext = createContext<MeasurementContextValue | null>(null);

export function MeasurementProvider({ children }: { children: React.ReactNode }) {
  const { activeProject } = useProjectContext();
  const { geometry } = useGeometry();
  const [measurements, setMeasurements] = useState<MeasurementResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep track of the last geometry timestamp to avoid redundant calculations
  const lastGeometryRef = useRef<string | null>(null);

  const calculate = useCallback(async () => {
    if (!activeProject || !geometry) {
      setMeasurements(null);
      setError(null);
      lastGeometryRef.current = null;
      return;
    }

    // Cache check: if the geometry hasn't changed (using its creation timestamp/serialized state), skip recalculating
    const geomKey = `${geometry.projectId}-${geometry.createdAt}`;
    if (lastGeometryRef.current === geomKey) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await window.electronAPI.calculateMeasurements(activeProject.id);
      if (res.success && res.data) {
        setMeasurements(res.data);
        lastGeometryRef.current = geomKey;
      } else {
        setMeasurements(null);
        setError(res.error ?? 'Failed to compute measurements');
        lastGeometryRef.current = null;
      }
    } catch {
      setMeasurements(null);
      setError('Failed to communicate with measurement engine');
      lastGeometryRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, geometry]);

  // ponytail: manual trigger clears cache so calculate() runs fresh
  const forceCalculate = useCallback(async () => {
    lastGeometryRef.current = null;
    await calculate();
  }, [calculate]);

  // Reactively calculate measurements whenever geometry updates
  useEffect(() => {
    calculate();
  }, [calculate]);

  return (
    <MeasurementContext.Provider
      value={{
        measurements,
        isLoading,
        error,
        calculate: forceCalculate,
      }}
    >
      {children}
    </MeasurementContext.Provider>
  );
}

export function useMeasurementContext() {
  const ctx = useContext(MeasurementContext);
  if (!ctx) throw new Error('useMeasurementContext must be used inside MeasurementProvider');
  return ctx;
}
