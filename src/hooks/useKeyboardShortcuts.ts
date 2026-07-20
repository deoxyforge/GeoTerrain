import { useEffect } from 'react';
import { useImportExport } from '../context/ImportExportContext';
import { useCoordinates } from './useCoordinates';

export function useKeyboardShortcuts() {
  const { importData, exportData, isOperating } = useImportExport();
  const { undo, redo, isLoading } = useCoordinates();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts if an operation is running
      if (isOperating || isLoading) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      if (isCtrl && !isShift && key === 'o') {
        e.preventDefault();
        importData('json');
      } else if (isCtrl && isShift && key === 's') {
        e.preventDefault();
        exportData('csv');
      } else if (isCtrl && !isShift && key === 'e') {
        e.preventDefault();
        exportData('json');
      } else if (isCtrl && !isShift && key === 'z') {
        e.preventDefault();
        undo();
      } else if (isCtrl && !isShift && key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [importData, exportData, isOperating, undo, redo, isLoading]);
}
