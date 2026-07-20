import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Coordinate } from '../types/coordinate';
import type { ValidationResult } from '../types/validation';
import { useProjectContext } from './ProjectContext';

interface CoordinateContextValue {
  coordinates: Coordinate[];
  isLoading: boolean;
  error: string | null;
  validationResult: ValidationResult | null;
  loadCoordinates: (projectId: string) => Promise<void>;
  addCoordinate: (
    latitude: number,
    longitude: number
  ) => Promise<{ success: boolean; error?: string }>;
  updateCoordinate: (
    id: string,
    latitude: number,
    longitude: number
  ) => Promise<{ success: boolean; error?: string }>;
  deleteCoordinate: (id: string) => Promise<{ success: boolean; error?: string }>;
  moveCoordinate: (
    id: string,
    direction: 'up' | 'down'
  ) => Promise<{ success: boolean; error?: string }>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  undoStack: Coordinate[][];
  redoStack: Coordinate[][];
  saveStatus: 'saved' | 'saving';
  recordHistoryState: (prevState: Coordinate[]) => void;
}

const CoordinateContext = createContext<CoordinateContextValue | null>(null);

export function CoordinateProvider({ children }: { children: React.ReactNode }) {
  const { activeProject } = useProjectContext();
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<Coordinate[][]>([]);
  const [redoStack, setRedoStack] = useState<Coordinate[][]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const recordHistoryState = useCallback((prevState: Coordinate[]) => {
    setUndoStack((prev) => [...prev, prevState]);
    setRedoStack([]);
  }, []);

  const loadCoordinates = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await window.electronAPI.getCoordinatesByProject(projectId);
      if (res.success && res.data) {
        setCoordinates(res.data);
      } else {
        setError(res.error ?? 'Failed to load coordinates');
      }
    } catch {
      setError('Failed to communicate with database');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCoordinate = useCallback(
    async (latitude: number, longitude: number) => {
      if (!activeProject) return { success: false, error: 'No active project' };
      setSaveStatus('saving');
      try {
        const res = await window.electronAPI.addCoordinate({
          projectId: activeProject.id,
          latitude,
          longitude,
        });
        if (res.success && res.data) {
          // Record current state before adding new point
          recordHistoryState([...coordinates]);
          setCoordinates((prev) => [...prev, res.data as Coordinate]);
          setSaveStatus('saved');
          return { success: true };
        }
        setSaveStatus('saved');
        return { success: false, error: res.error ?? 'Failed to add coordinate' };
      } catch {
        setSaveStatus('saved');
        return { success: false, error: 'Failed to communicate with database' };
      }
    },
    [activeProject, coordinates, recordHistoryState]
  );

  const updateCoordinate = useCallback(
    async (id: string, latitude: number, longitude: number) => {
      setSaveStatus('saving');
      try {
        const res = await window.electronAPI.updateCoordinate({ id, latitude, longitude });
        if (res.success && res.data) {
          // Record current state before modifying the point
          recordHistoryState([...coordinates]);
          setCoordinates((prev) => prev.map((c) => (c.id === id ? (res.data as Coordinate) : c)));
          setSaveStatus('saved');
          return { success: true };
        }
        setSaveStatus('saved');
        return { success: false, error: res.error ?? 'Failed to update coordinate' };
      } catch {
        setSaveStatus('saved');
        return { success: false, error: 'Failed to communicate with database' };
      }
    },
    [coordinates, recordHistoryState]
  );

  const deleteCoordinate = useCallback(
    async (id: string) => {
      if (!activeProject) return { success: false, error: 'No active project' };
      setSaveStatus('saving');
      try {
        // Record current state before deletion
        recordHistoryState([...coordinates]);
        const res = await window.electronAPI.deleteCoordinate(id);
        if (res.success) {
          await loadCoordinates(activeProject.id);
          setSaveStatus('saved');
          return { success: true };
        }
        setSaveStatus('saved');
        return { success: false, error: res.error ?? 'Failed to delete coordinate' };
      } catch {
        setSaveStatus('saved');
        return { success: false, error: 'Failed to communicate with database' };
      }
    },
    [activeProject, coordinates, loadCoordinates, recordHistoryState]
  );

  const moveCoordinate = useCallback(
    async (id: string, direction: 'up' | 'down') => {
      if (!activeProject) return { success: false, error: 'No active project' };
      const index = coordinates.findIndex((c) => c.id === id);
      if (index === -1) return { success: false, error: 'Coordinate not found' };

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= coordinates.length) {
        return { success: false, error: 'Invalid movement' };
      }

      setSaveStatus('saving');
      const reorderedList = [...coordinates];
      const [movedItem] = reorderedList.splice(index, 1);
      reorderedList.splice(targetIndex, 0, movedItem);

      const orderedIds = reorderedList.map((c) => c.id);

      try {
        // Record current state before reordering
        recordHistoryState([...coordinates]);
        const res = await window.electronAPI.reorderCoordinates(activeProject.id, orderedIds);
        if (res.success) {
          await loadCoordinates(activeProject.id);
          setSaveStatus('saved');
          return { success: true };
        }
        setSaveStatus('saved');
        return { success: false, error: res.error ?? 'Failed to reorder coordinates' };
      } catch {
        setSaveStatus('saved');
        return { success: false, error: 'Failed to communicate with database' };
      }
    },
    [activeProject, coordinates, loadCoordinates, recordHistoryState]
  );

  const undo = useCallback(async () => {
    if (undoStack.length === 0 || !activeProject) return;

    setSaveStatus('saving');
    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    setRedoStack((prev) => [...prev, coordinates]);
    setCoordinates(previousState);
    setUndoStack(newUndoStack);

    try {
      await window.electronAPI.syncCoordinates(activeProject.id, previousState);
    } catch (err) {
      console.error('Failed to sync coordinates during undo', err);
    } finally {
      setSaveStatus('saved');
    }
  }, [undoStack, coordinates, activeProject]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0 || !activeProject) return;

    setSaveStatus('saving');
    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    setUndoStack((prev) => [...prev, coordinates]);
    setCoordinates(nextState);
    setRedoStack(newRedoStack);

    try {
      await window.electronAPI.syncCoordinates(activeProject.id, nextState);
    } catch (err) {
      console.error('Failed to sync coordinates during redo', err);
    } finally {
      setSaveStatus('saved');
    }
  }, [redoStack, coordinates, activeProject]);

  // Load coordinates & reset history stacks when active project changes
  useEffect(() => {
    if (activeProject) {
      loadCoordinates(activeProject.id);
    } else {
      setCoordinates([]);
    }
    setUndoStack([]);
    setRedoStack([]);
  }, [activeProject, loadCoordinates]);

  // Run validation whenever coordinates or project changes
  useEffect(() => {
    if (activeProject && coordinates.length > 0) {
      window.electronAPI.validateCoordinateList(activeProject.id).then((res) => {
        if (res.success && res.data) {
          setValidationResult(res.data);
        }
      });
    } else {
      setValidationResult(null);
    }
  }, [coordinates, activeProject]);

  return (
    <CoordinateContext.Provider
      value={{
        coordinates,
        isLoading,
        error,
        validationResult,
        loadCoordinates,
        addCoordinate,
        updateCoordinate,
        deleteCoordinate,
        moveCoordinate,
        undo,
        redo,
        undoStack,
        redoStack,
        saveStatus,
        recordHistoryState,
      }}
    >
      {children}
    </CoordinateContext.Provider>
  );
}

export function useCoordinateContext() {
  const ctx = useContext(CoordinateContext);
  if (!ctx) throw new Error('useCoordinateContext must be used inside CoordinateProvider');
  return ctx;
}
