// General utility helpers

/** Returns ISO timestamp string for current time */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Formats an ISO timestamp to a readable locale string */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Truncates a string to maxLength, adding ellipsis if needed */
export function truncate(str: string, maxLength: number): string {
  return str.length <= maxLength ? str : `${str.slice(0, maxLength - 1)}…`;
}
