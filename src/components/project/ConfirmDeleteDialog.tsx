interface Props {
  open: boolean;
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteDialog({ open, projectName, onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-surface-1 border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-geo-red text-xl">⚠</span>
            <h2 className="text-sm font-semibold text-text-primary">Delete Project</h2>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="text-text-primary font-medium">&quot;{projectName}&quot;</span>? This
            action cannot be undone and all coordinates will be permanently removed.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-geo-red hover:bg-red-600 text-white text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
