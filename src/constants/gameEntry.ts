export const SCRATCH_GAME_URL =
  import.meta.env.VITE_SCRATCH_GAME_URL ?? 'https://scratch.mit.edu/projects/1195779630';

export function hasScratchGameUrl(): boolean {
  return SCRATCH_GAME_URL.trim().length > 0;
}
