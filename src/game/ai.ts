import type { CaptureGroup, CaptureOpportunity, DiceValue, IntersectionCoordinate, RuntimeGameState } from '../types/game';
import { captureGroupFromOpportunity, findLegalCaptureOpportunities } from './rules';

export interface AIDecision {
  readonly kind: 'CAPTURE' | 'ROLL' | 'NONE';
  readonly group: CaptureGroup | null;
}

/** Finds a grid point from which the AI can capture exactly the rolled quantity. */
export function chooseAIMoveCoordinate(
  state: RuntimeGameState,
  diceValue: DiceValue,
): IntersectionCoordinate | null {
  const activePlayer = state.players[state.activePlayerIndex];
  if (!activePlayer || activePlayer.controllerType !== 'AI') return null;

  let best: { coordinate: IntersectionCoordinate; opportunity: CaptureOpportunity } | null = null;
  for (let y = 0; y <= 10; y += 1) {
    for (let x = 0; x <= 10; x += 1) {
      if (x === 5 && y === 5) continue;
      const coordinate = { x: x as IntersectionCoordinate['x'], y: y as IntersectionCoordinate['y'] };
      const pawn = {
        ...activePlayer.pawn,
        state: { status: 'ON_BOARD' as const, position: coordinate },
      };
      const opportunity = findLegalCaptureOpportunities(state.board, pawn, diceValue)[0];
      if (opportunity && (!best || compareOpportunities(opportunity, best.opportunity) < 0)) {
        best = { coordinate, opportunity };
      }
    }
  }
  return best?.coordinate ?? null;
}

/**
 * Chooses only from the same legal action set exposed to human players. The ordering is
 * deliberate and stable: capture quantity, then route simplicity, then board coordinates.
 */
export function chooseAICapture(
  state: RuntimeGameState,
  diceValue: DiceValue = state.turn.currentDiceValue as DiceValue,
): CaptureGroup | null {
  if (state.matchStatus !== 'ACTIVE' || !diceValue) {
    return null;
  }
  const activePlayer = state.players[state.activePlayerIndex];
  if (!activePlayer || activePlayer.controllerType !== 'AI') {
    return null;
  }
  const legal =
    state.legalOpportunities.length > 0 && state.turn.currentDiceValue === diceValue
      ? state.legalOpportunities
      : findLegalCaptureOpportunities(state.board, activePlayer.pawn, diceValue);
  const selected = [...legal].sort(compareOpportunities)[0];
  return selected ? captureGroupFromOpportunity(selected, bestRouteIndex(selected)) : null;
}

/** Returns the next legal engine action without mutating game state. */
export function decideAITurn(state: RuntimeGameState): AIDecision {
  if (state.matchStatus !== 'ACTIVE') {
    return { kind: 'NONE', group: null };
  }
  if (state.turn.phase === 'WAITING_FOR_DICE_ROLL' || state.turn.phase === 'REROLL_REQUIRED') {
    return { kind: 'ROLL', group: null };
  }
  if (
    state.turn.phase !== 'WAITING_FOR_CAPTURE_SELECTION' ||
    state.turn.currentDiceValue === null
  ) {
    return { kind: 'NONE', group: null };
  }
  const group = chooseAICapture(state, state.turn.currentDiceValue);
  return group ? { kind: 'CAPTURE', group } : { kind: 'NONE', group: null };
}

function compareOpportunities(first: CaptureOpportunity, second: CaptureOpportunity): number {
  // Quantity is normally equal to the current die, but retaining it makes this safe for
  // callers supplying a pre-filtered action list and documents the priority explicitly.
  const countDifference =
    second.candidateOncakCoordinates.length - first.candidateOncakCoordinates.length;
  if (countDifference !== 0) return countDifference;

  const firstRouteLength = shortestRouteLength(first);
  const secondRouteLength = shortestRouteLength(second);
  if (firstRouteLength !== secondRouteLength) return firstRouteLength - secondRouteLength;

  const firstCoordinate = first.candidateOncakCoordinates[0];
  const secondCoordinate = second.candidateOncakCoordinates[0];
  if (firstCoordinate?.y !== secondCoordinate?.y)
    return (firstCoordinate?.y ?? 0) - (secondCoordinate?.y ?? 0);
  if (firstCoordinate?.x !== secondCoordinate?.x)
    return (firstCoordinate?.x ?? 0) - (secondCoordinate?.x ?? 0);
  return first.id.localeCompare(second.id);
}

function bestRouteIndex(opportunity: CaptureOpportunity): number {
  let bestIndex = 0;
  for (let index = 1; index < opportunity.routes.length; index += 1) {
    const candidate = opportunity.routes[index];
    const current = opportunity.routes[bestIndex];
    if (candidate && current && compareRoutes(candidate, current) < 0) bestIndex = index;
  }
  return bestIndex;
}

function shortestRouteLength(opportunity: CaptureOpportunity): number {
  return opportunity.routes.reduce(
    (smallest, route) => Math.min(smallest, route.segments.length),
    Number.POSITIVE_INFINITY,
  );
}

function compareRoutes(
  first: CaptureOpportunity['routes'][number],
  second: CaptureOpportunity['routes'][number],
): number {
  if (first.segments.length !== second.segments.length)
    return first.segments.length - second.segments.length;
  if (first.intersections.length !== second.intersections.length)
    return first.intersections.length - second.intersections.length;
  const firstEnd = first.finalEndpoint;
  const secondEnd = second.finalEndpoint;
  return firstEnd.y - secondEnd.y || firstEnd.x - secondEnd.x;
}
