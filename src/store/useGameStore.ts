/**
 * Compatibility entry point for the authoritative Zustand game store.
 *
 * Gameplay state must have a single owner; the implementation lives in `src/stores/` and
 * dispatches only pure transitions from `src/game/engine.ts`.
 */
export { useGameStore } from '../stores/useGameStore';
export type { GameStoreState } from '../stores/useGameStore';
