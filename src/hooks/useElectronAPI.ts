import type { ElectronAPI } from '../types/ipc';

// Typed accessor for window.electronAPI — throws in browser context (non-Electron)
// ponytail: simple accessor, not a hook with state. Phase 2 can add error boundary if needed.
export function useElectronAPI(): ElectronAPI {
  if (typeof window === 'undefined' || !window.electronAPI) {
    throw new Error(
      'electronAPI is not available. Ensure this is running inside Electron with preload configured.'
    );
  }
  return window.electronAPI;
}
