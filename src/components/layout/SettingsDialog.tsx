import { useState, useEffect } from 'react';
import { useSettings, DEFAULT_SETTINGS } from '../../context/SettingsContext';
import type { Settings } from '../../context/SettingsContext';

export default function SettingsDialog() {
  const { settings, showSettings, setShowSettings, updateSetting, bulkUpdateSettings } = useSettings();
  const [snapshot, setSnapshot] = useState<Settings | null>(null);

  // Snapshot current settings when dialog opens
  useEffect(() => {
    if (showSettings) {
      setSnapshot({ ...settings });
    }
  }, [showSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 flex items-center justify-center p-6">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="border-b border-border px-5 py-3.5 flex items-center justify-between bg-surface-1">
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            ⚙ Application Settings
          </h2>
          <button
            onClick={() => {
              if (snapshot) bulkUpdateSettings(snapshot);
              setShowSettings(false);
            }}
            className="text-text-muted hover:text-text-primary text-xs transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Form Toggles */}
        <div className="p-6 space-y-4 text-xs font-medium text-text-secondary max-h-[70vh] overflow-y-auto">
          {/* General Preferences */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Visual Preferences
            </h3>
            <div className="flex justify-between items-center py-1">
              <span>Color Theme</span>
              <select
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value as 'dark' | 'light' | 'system')}
                className="bg-surface-2 border border-border rounded px-2 py-1 focus:outline-none focus:border-accent"
              >
                <option value="dark">Dark Theme</option>
                <option value="light">Light Theme</option>
                <option value="system">System Default</option>
              </select>
            </div>
          </div>

          <hr className="border-border" />

          {/* Map Overlay Visibility options */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Map Overlays
            </h3>
            <label className="flex items-center gap-2 cursor-pointer hover:text-text-primary py-0.5">
              <input
                type="checkbox"
                checked={settings.gridVisibility}
                onChange={(e) => updateSetting('gridVisibility', e.target.checked)}
                className="rounded border-border text-accent focus:ring-0 bg-surface-2 cursor-pointer"
              />
              Show Viewport Grid
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-text-primary py-0.5">
              <input
                type="checkbox"
                checked={settings.vertexLabels}
                onChange={(e) => updateSetting('vertexLabels', e.target.checked)}
                className="rounded border-border text-accent focus:ring-0 bg-surface-2 cursor-pointer"
              />
              Show Coordinates Labels
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-text-primary py-0.5">
              <input
                type="checkbox"
                checked={settings.northArrow}
                onChange={(e) => updateSetting('northArrow', e.target.checked)}
                className="rounded border-border text-accent focus:ring-0 bg-surface-2 cursor-pointer"
              />
              Show North Indicator Target
            </label>
          </div>

          <hr className="border-border" />

          {/* Unit defaults */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Defaults & Units
            </h3>
            <div className="flex justify-between items-center py-0.5">
              <span>Default Area Metric</span>
              <select
                value={settings.defaultUnits}
                onChange={(e) =>
                  updateSetting('defaultUnits', e.target.value as 'sqm' | 'sqkm' | 'ha' | 'ac')
                }
                className="bg-surface-2 border border-border rounded px-2 py-1 focus:outline-none focus:border-accent"
              >
                <option value="sqm">Square Meters (m²)</option>
                <option value="sqkm">Square Kilometers (km²)</option>
                <option value="ha">Hectares (ha)</option>
                <option value="ac">Acres (ac)</option>
              </select>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>Default Export Format</span>
              <select
                value={settings.defaultExportFormat}
                onChange={(e) =>
                  updateSetting('defaultExportFormat', e.target.value as 'json' | 'csv' | 'geojson')
                }
                className="bg-surface-2 border border-border rounded px-2 py-1 focus:outline-none focus:border-accent"
              >
                <option value="json">GeoTerrain Native (.json)</option>
                <option value="csv">CSV Coordinates (.csv)</option>
                <option value="geojson">GeoJSON Polygon (.geojson)</option>
              </select>
            </div>
          </div>

          <hr className="border-border" />

          {/* System preferences */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              System Preferences
            </h3>
            <div className="flex justify-between items-center py-0.5">
              <span>Autosave Backup Interval</span>
              <select
                value={settings.autosaveInterval}
                onChange={(e) => updateSetting('autosaveInterval', parseInt(e.target.value, 10))}
                className="bg-surface-2 border border-border rounded px-2 py-1 focus:outline-none focus:border-accent"
              >
                <option value={5}>Every 5 Seconds</option>
                <option value={10}>Every 10 Seconds</option>
                <option value={30}>Every 30 Seconds</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer hover:text-text-primary py-0.5">
              <input
                type="checkbox"
                checked={settings.restoreLastProject}
                onChange={(e) => updateSetting('restoreLastProject', e.target.checked)}
                className="rounded border-border text-accent focus:ring-0 bg-surface-2 cursor-pointer"
              />
              Restore Last Opened Project on Startup
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 flex items-center justify-between bg-surface-1">
          <button
            onClick={() => bulkUpdateSettings(DEFAULT_SETTINGS)}
            className="px-3 py-1.5 rounded text-xs text-text-muted hover:text-geo-red transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (snapshot) bulkUpdateSettings(snapshot);
                setShowSettings(false);
              }}
              className="px-4 py-1.5 rounded bg-surface-2 border border-border text-text-secondary hover:bg-surface-3 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-1.5 rounded bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-colors"
            >
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
