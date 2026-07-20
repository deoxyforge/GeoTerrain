// Header component — application top bar
// Phase 2: add project name, save status indicator, menu actions
export default function Header() {
  return (
    <header className="flex items-center justify-between h-12 px-4 bg-surface-1 border-b border-border shrink-0">
      {/* Logo + app name */}
      <div className="flex items-center gap-2">
        <span className="text-accent font-bold text-lg tracking-tight">⬡</span>
        <span className="font-semibold text-text-primary text-sm tracking-wide">
          GeoTerrain Analyzer
        </span>
        <span className="text-text-muted text-xs ml-1">v1.0</span>
      </div>

      {/* Right side — placeholder for future actions */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-muted font-mono">Offline</span>
        <span className="w-2 h-2 rounded-full bg-geo-green" title="Offline mode active" />
      </div>
    </header>
  );
}
