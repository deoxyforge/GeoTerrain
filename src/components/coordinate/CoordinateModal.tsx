import { useState, useEffect, useRef, type FormEvent } from 'react';
import type { Coordinate } from '../../types/coordinate';
import { isValidLatitude, isValidLongitude, parseCoordinate } from '../../utils/validation';

interface Props {
  open: boolean;
  editCoordinate?: Coordinate | null; // if set → edit mode
  onConfirm: (latitude: number, longitude: number) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export default function CoordinateModal({ open, editCoordinate, onConfirm, onCancel }: Props) {
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const latRef = useRef<HTMLInputElement>(null);

  const isEdit = !!editCoordinate;

  useEffect(() => {
    if (open) {
      setLatInput(editCoordinate ? editCoordinate.latitude.toString() : '');
      setLonInput(editCoordinate ? editCoordinate.longitude.toString() : '');
      setError('');
      setSubmitting(false);
      setTimeout(() => latRef.current?.focus(), 50);
    }
  }, [open, editCoordinate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const latVal = parseCoordinate(latInput);
    const lonVal = parseCoordinate(lonInput);

    if (latVal === null || !isValidLatitude(latVal)) {
      setError('Latitude must be a valid number between -90 and 90');
      return;
    }
    if (lonVal === null || !isValidLongitude(lonVal)) {
      setError('Longitude must be a valid number between -180 and 180');
      return;
    }

    setSubmitting(true);
    const res = await onConfirm(latVal, lonVal);
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
      <div className="bg-surface-1 border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">
            {isEdit ? `Edit Coordinate (${editCoordinate?.pointOrder})` : 'Add Coordinate'}
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
              htmlFor="lat-input"
            >
              Latitude <span className="text-geo-red">*</span>
            </label>
            <input
              ref={latRef}
              id="lat-input"
              type="number"
              step="any"
              value={latInput}
              onChange={(e) => {
                setLatInput(e.target.value);
                setError('');
              }}
              placeholder="e.g. 28.6139"
              disabled={submitting}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium text-text-secondary mb-1.5"
              htmlFor="lon-input"
            >
              Longitude <span className="text-geo-red">*</span>
            </label>
            <input
              id="lon-input"
              type="number"
              step="any"
              value={lonInput}
              onChange={(e) => {
                setLonInput(e.target.value);
                setError('');
              }}
              placeholder="e.g. 77.2090"
              disabled={submitting}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {error && <p className="text-xs text-geo-red leading-normal">{error}</p>}

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
              disabled={submitting || !latInput || !lonInput}
              className="flex-1 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
