// Map publication year to color (older = warm, newer = cool)
export function yearToColor(year: number): string {
  if (!year) return '#9ca3af';
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age <= 2) return '#10b981'; // emerald - very recent
  if (age <= 5) return '#3b82f6'; // blue - recent
  if (age <= 10) return '#6366f1'; // indigo - moderate
  if (age <= 20) return '#8b5cf6'; // violet - older
  return '#ec4899'; // pink - classic
}

// Map citation count to node size (log scale)
export function citationToSize(count: number): number {
  return Math.max(3, Math.log10(count + 1) * 4 + 2);
}
