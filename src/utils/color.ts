function clamp(n: number) {
  return Math.min(255, Math.max(0, Math.round(n)));
}

/** Lightens (positive percent) or darkens (negative percent) a hex color. */
export function shade(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amount = 255 * (percent / 100);
  const r = clamp(((num >> 16) & 0xff) + amount);
  const g = clamp(((num >> 8) & 0xff) + amount);
  const b = clamp((num & 0xff) + amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
