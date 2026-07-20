// Global type augmentation — makes window.electronAPI typed throughout renderer
import type { ElectronAPI } from './ipc';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
