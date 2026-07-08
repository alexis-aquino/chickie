function clamp(n: number) {
  return Math.min(255, Math.max(0, Math.round(n)));
}

/**
 * Lightens (positive percent) or darkens (negative percent) a hex color by
 * interpolating each channel toward white or black. A flat per-channel
 * offset (the old approach) clips low channels to the same value as high
 * ones at large percentages, washing every hue out to white — interpolating
 * toward the target keeps the hue visible at any percent.
 */
export function shade(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const fraction = percent / 100;
  const target = fraction >= 0 ? 255 : 0;
  const mix = (channel: number) => clamp(channel + (target - channel) * Math.abs(fraction));
  const r = mix((num >> 16) & 0xff);
  const g = mix((num >> 8) & 0xff);
  const b = mix(num & 0xff);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
