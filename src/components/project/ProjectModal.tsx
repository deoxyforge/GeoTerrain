import { useState, useEffect, useRef, type FormEvent } from 'react';
import type { Project } from '../../types/project';

interface Props {
  open: boolean;
  editProject?: Project | null; // if set → edit mode
  onConfirm: (name: string, description: string) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export default function ProjectModal({ open, editProject, onConfirm, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const isEdit = !!editProject;

  useEffect(() => {
    if (open) {
      setName(editProject?.name ?? '');
      setDescription(editProject?.description ?? '');
      setError('');
      setSubmitting(false);
      // Focus name field after mount
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open, editProject]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Project name is required');
      return;
    }
    setSubmitting(true);
    setError('');
    const res = await onConfirm(trimmed, description.trim());
    if (!res.success) {
      setError(res.error ?? 'An unexpected error occurred');
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="bg-surface-1 border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">
            {isEdit ? 'Edit Project' : 'New Project'}
          </h2>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label
              className="block text-xs font-medium text-text-secondary mb-1.5"
              htmlFor="project-name"
            >
              Project Name <span className="text-geo-red">*</span>
            </label>
            <input
              ref={nameRef}
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Sector Alpha Survey"
              maxLength={100}
              disabled={submitting}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
            />
            {error && <p className="mt-1.5 text-xs text-geo-red">{error}</p>}
          </div>

          <div>
            <label
              className="block text-xs font-medium text-text-secondary mb-1.5"
              htmlFor="project-desc"
            >
              Description <span className="text-text-muted">(optional)</span>
            </label>
            <textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this survey area…"
              rows={3}
              maxLength={500}
              disabled={submitting}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
