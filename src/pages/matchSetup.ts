import type { PlayerCount } from '../types/game';

const MAX_LAYOUT_ATTEMPTS = 32;
const RANDOM_VALUES_PER_ATTEMPT = 119;

/** Builds application-provided initialization input without owning board or game rules. */
export function createLocalMatchInput(
  playerCount: PlayerCount,
  includeEasyAI = false,
  primaryHumanName?: string,
) {
  return {
    gameMode: 'LOCAL_MULTIPLAYER' as const,
    playerCount,
    players: Array.from({ length: playerCount }, (_, index) => ({
      id: `player-${index + 1}`,
      name:
        index === 0 && primaryHumanName && primaryHumanName.trim().length > 0
          ? primaryHumanName.trim()
          : includeEasyAI && index === 1
            ? 'Easy AI'
            : `Player ${index + 1}`,
      controllerType: includeEasyAI && index === 1 ? ('AI' as const) : ('HUMAN' as const),
    })),
    randomValues: Array.from({ length: RANDOM_VALUES_PER_ATTEMPT * MAX_LAYOUT_ATTEMPTS }, () => Math.random()),
    maxLayoutAttempts: MAX_LAYOUT_ATTEMPTS,
  };
}
