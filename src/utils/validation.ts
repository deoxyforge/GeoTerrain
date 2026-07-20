// Client-side coordinate validation utilities (mirrors ValidationService for renderer use)
// ponytail: duplicates some server logic intentionally — renderer needs fast sync validation for UI feedback
// Ceiling: if logic diverges, extract to a shared package; for now duplication is acceptable

export function isValidLatitude(value: number): boolean {
  return value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return value >= -180 && value <= 180;
}

export function parseCoordinate(raw: string): number | null {
  const parsed = parseFloat(raw);
  return isNaN(parsed) ? null : parsed;
}
