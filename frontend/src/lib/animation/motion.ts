export const REDUCED_MOTION_SCALE = 0.2;

export function scaleDuration(ms: number, reducedMotion: boolean): number {
  if (ms === 0) return 0;
  if (!reducedMotion) return ms;
  return Math.max(50, Math.round(ms * REDUCED_MOTION_SCALE));
}
