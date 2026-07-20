// Unit conversion utilities — pure math, no dependencies

/** Square meters → hectares */
export function sqMetersToHectares(sqm: number): number {
  return sqm / 10_000;
}

/** Square meters → square kilometers */
export function sqMetersToSqKm(sqm: number): number {
  return sqm / 1_000_000;
}

/** Square meters → acres */
export function sqMetersToAcres(sqm: number): number {
  return sqm / 4046.856422;
}

/** Meters → kilometers */
export function metersToKm(m: number): number {
  return m / 1000;
}

/** Format a number with fixed decimal places and locale separator */
export function formatMeasurement(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
