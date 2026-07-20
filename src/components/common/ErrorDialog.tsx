import { useSettings } from '../../context/SettingsContext';

export default function ErrorDialog() {
  const { globalError, setGlobalError } = useSettings();

  if (!globalError) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-6">
      <div className="bg-surface border border-geo-red/30 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="border-b border-border px-5 py-3.5 flex items-center gap-2 bg-geo-red/5">
          <span className="text-geo-red text-base font-bold">⚠</span>
          <h2 className="text-xs font-bold text-geo-red uppercase tracking-wider">
            System Error Encountered
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 text-xs text-text-secondary font-medium space-y-2">
          <p className="leading-relaxed">
            An unexpected error occurred during execution. Please review the details below:
          </p>
          <div className="bg-surface-3 border border-border rounded-lg p-3 text-[10px] font-mono text-text-primary leading-normal whitespace-pre-wrap select-text max-h-[200px] overflow-y-auto">
            {globalError}
          </div>
          <p className="text-[10px] text-text-muted mt-2">
            If this issue persists, please restart the application or contact support.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 flex items-center justify-end bg-surface-1">
          <button
            onClick={() => setGlobalError(null)}
            className="px-4 py-1.5 rounded bg-geo-red hover:bg-red-600 text-white text-xs font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
