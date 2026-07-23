import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Settings {
  theme: 'dark' | 'light' | 'system';
  gridVisibility: boolean;
  vertexLabels: boolean;
  northArrow: boolean;
  defaultExportFormat: 'json' | 'csv' | 'geojson';
  defaultUnits: 'sqm' | 'sqkm' | 'ha' | 'ac';
  autosaveInterval: number;
  restoreLastProject: boolean;
}

interface SettingsContextValue {
  settings: Settings;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  bulkUpdateSettings: (newSettings: Settings) => Promise<void>;
  isLoading: boolean;
  globalError: string | null;
  setGlobalError: (err: string | null) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  gridVisibility: true,
  vertexLabels: true,
  northArrow: true,
  defaultExportFormat: 'json',
  defaultUnits: 'sqm',
  autosaveInterval: 10,
  restoreLastProject: true,
};

// ponytail: resolve effective theme from 'system' using OS media query
function resolveThemeClass(theme: 'dark' | 'light' | 'system'): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Load settings on startup
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await window.electronAPI.getAllSettings();
        if (res.success && res.data) {
          const dbSettings = res.data;
          const merged: Settings = { ...DEFAULT_SETTINGS };

          // Parse and merge values safely
          if (dbSettings.theme === 'dark' || dbSettings.theme === 'light' || dbSettings.theme === 'system') {
            merged.theme = dbSettings.theme;
          }
          if (dbSettings.gridVisibility !== undefined) {
            merged.gridVisibility = dbSettings.gridVisibility === 'true';
          }
          if (dbSettings.vertexLabels !== undefined) {
            merged.vertexLabels = dbSettings.vertexLabels === 'true';
          }
          if (dbSettings.northArrow !== undefined) {
            merged.northArrow = dbSettings.northArrow === 'true';
          }
          if (
            dbSettings.defaultExportFormat === 'json' ||
            dbSettings.defaultExportFormat === 'csv' ||
            dbSettings.defaultExportFormat === 'geojson'
          ) {
            merged.defaultExportFormat = dbSettings.defaultExportFormat;
          }
          if (
            dbSettings.defaultUnits === 'sqm' ||
            dbSettings.defaultUnits === 'sqkm' ||
            dbSettings.defaultUnits === 'ha' ||
            dbSettings.defaultUnits === 'ac'
          ) {
            merged.defaultUnits = dbSettings.defaultUnits;
          }
          if (dbSettings.autosaveInterval !== undefined) {
            const val = parseInt(dbSettings.autosaveInterval, 10);
            if (!isNaN(val)) merged.autosaveInterval = val;
          }
          if (dbSettings.restoreLastProject !== undefined) {
            merged.restoreLastProject = dbSettings.restoreLastProject === 'true';
          }

          setSettings(merged);
        }
      } catch (err) {
        console.error('Failed to load settings from database', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Sync HTML body theme class reactively
  useEffect(() => {
    const body = document.body;
    const effective = resolveThemeClass(settings.theme);
    body.classList.remove('dark', 'light');
    body.classList.add(effective);

    // If system theme, listen for OS changes
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        body.classList.remove('dark', 'light');
        body.classList.add(e.matches ? 'dark' : 'light');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  const updateSetting = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      // Optimistic state update
      setSettings((prev) => ({ ...prev, [key]: value }));

      try {
        await window.electronAPI.setSetting(key, value.toString());
      } catch (err) {
        console.error(`Failed to save setting "${key}" to database`, err);
      }
    },
    []
  );

  const bulkUpdateSettings = useCallback(
    async (newSettings: Settings) => {
      setSettings(newSettings);
      // Persist all changed values
      try {
        const keys = Object.keys(newSettings) as (keyof Settings)[];
        for (const key of keys) {
          await window.electronAPI.setSetting(key, newSettings[key].toString());
        }
      } catch (err) {
        console.error('Failed to save bulk settings to database', err);
      }
    },
    []
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        showSettings,
        setShowSettings,
        updateSetting,
        bulkUpdateSettings,
        isLoading,
        globalError,
        setGlobalError,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
