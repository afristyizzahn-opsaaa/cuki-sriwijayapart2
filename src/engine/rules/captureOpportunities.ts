import { MAX_MOVEMENT_SEGMENTS } from '../../constants/gameRules';
import type {
  CaptureOpportunity,
  CaptureRoute,
  DiceValue,
  IntersectionBoard,
  IntersectionCoordinate,
  IntersectionState,
  MovementDirection,
  MovementSegment,
  Pawn,
} from '../../types/game';
import { getIntersectionState } from '../board/initialization';

export interface CaptureOpportunityCandidate {
  readonly id: string;
  readonly oncakCoordinates: ReadonlyArray<IntersectionCoordinate>;
  readonly route: CaptureRoute;
}

export type RouteValidationReason =
  | 'EMPTY_ROUTE'
  | 'ORIGIN_MISMATCH'
  | 'SEGMENT_LIMIT_EXCEEDED'
  | 'DISCONNECTED_SEGMENTS'
  | 'NON_ORTHOGONAL_SEGMENT'
  | 'SEGMENT_DIRECTION_MISMATCH'
  | 'ROUTE_INTERSECTIONS_MISMATCH'
  | 'OUT_OF_BOUNDS'
  | 'CENTRAL_LOGO_BLOCKED'
  | 'PAWN_BLOCKED';

export interface RouteValidationResult {
  readonly isLegal: boolean;
  readonly reason: RouteValidationReason | null;
}

/**
 * Filters explicit capture-path candidates by the Rulebook's exact-size and same-colour
 * requirements. It intentionally does not flood-fill connected Oncak structures.
 */
export function discoverCaptureOpportunities(
  board: IntersectionBoard,
  diceValue: DiceValue,
  candidates: ReadonlyArray<CaptureOpportunityCandidate>,
): ReadonlyArray<CaptureOpportunity> {
  return candidates.flatMap((candidate) => {
    const opportunity = createStructuralOpportunity(board, diceValue, candidate);
    return opportunity ? [opportunity] : [];
  });
}

/** Validates every route of an opportunity against the active Pawn's board state. */
export function filterReachableCaptureOpportunities(
  board: IntersectionBoard,
  pawn: Pawn,
  opportunities: ReadonlyArray<CaptureOpportunity>,
): ReadonlyArray<CaptureOpportunity> {
  const origin = pawn.state.status === 'ON_BOARD' ? pawn.state.position : null;

  return opportunities.flatMap((opportunity) => {
    const routes = opportunity.routes.filter(
      (route) => validateCaptureRoute(board, route, pawn.id, origin).isLegal,
    );

    return routes.length > 0 ? [{ ...opportunity, routes }] : [];
  });
}

/** Combines structural discovery with route-based reachability filtering. */
export function evaluateCaptureOpportunities(
  board: IntersectionBoard,
  pawn: Pawn,
  diceValue: DiceValue,
  candidates: ReadonlyArray<CaptureOpportunityCandidate>,
): ReadonlyArray<CaptureOpportunity> {
  const structuralOpportunities = discoverCaptureOpportunities(board, diceValue, candidates);
  return filterReachableCaptureOpportunities(board, pawn, structuralOpportunities);
}

/**
 * Validates a complete route. OFF_BOARD routes receive a null origin and are evaluated
 * only within the board; no path from outside the board is constructed.
 */
export function validateCaptureRoute(
  board: IntersectionBoard,
  route: CaptureRoute,
  activePawnId: string,
  origin: IntersectionCoordinate | null,
): RouteValidationResult {
  if (route.intersections.length === 0) {
    return invalid('EMPTY_ROUTE');
  }
  if (route.segments.length > MAX_MOVEMENT_SEGMENTS) {
    return invalid('SEGMENT_LIMIT_EXCEEDED');
  }
  if (origin && !sameCoordinate(route.intersections[0], origin)) {
    return invalid('ORIGIN_MISMATCH');
  }

  const expandedRoute: IntersectionCoordinate[] = [];
  if (origin === null && route.segments.length === 0) {
    if (
      route.intersections.length !== 1 ||
      !sameCoordinate(route.intersections[0], route.finalEndpoint)
    ) {
      return invalid('EMPTY_ROUTE');
    }
    expandedRoute.push(route.intersections[0]);
  }

  for (let index = 0; index < route.segments.length; index += 1) {
    const segment = route.segments[index];
    const previousSegment = route.segments[index - 1];
    if (previousSegment && !sameCoordinate(previousSegment.end, segment.start)) {
      return invalid('DISCONNECTED_SEGMENTS');
    }

    const expansion = expandSegment(segment);
    if (!expansion) {
      return invalid(
        isOrthogonalSegment(segment) ? 'SEGMENT_DIRECTION_MISMATCH' : 'NON_ORTHOGONAL_SEGMENT',
      );
    }
    expandedRoute.push(...(index === 0 ? expansion : expansion.slice(1)));
  }

  if (!coordinatesMatch(expandedRoute, route.intersections)) {
    return invalid('ROUTE_INTERSECTIONS_MISMATCH');
  }
  if (!sameCoordinate(expandedRoute[expandedRoute.length - 1], route.finalEndpoint)) {
    return invalid('ROUTE_INTERSECTIONS_MISMATCH');
  }

  for (let index = 0; index < expandedRoute.length; index += 1) {
    const coordinate = expandedRoute[index];
    const intersection = getIntersectionState(board, coordinate.x, coordinate.y);
    if (!intersection) {
      return invalid('OUT_OF_BOUNDS');
    }
    if (intersection.kind === 'CENTRAL_LOGO') {
      return invalid('CENTRAL_LOGO_BLOCKED');
    }
    if (
      intersection.kind === 'PAWN' &&
      !(index === 0 && intersection.pawnOccupantId === activePawnId)
    ) {
      return invalid('PAWN_BLOCKED');
    }
  }

  return { isLegal: true, reason: null };
}

function createStructuralOpportunity(
  board: IntersectionBoard,
  diceValue: DiceValue,
  candidate: CaptureOpportunityCandidate,
): CaptureOpportunity | null {
  if (
    candidate.oncakCoordinates.length !== diceValue ||
    !hasUniqueCoordinates(candidate.oncakCoordinates)
  ) {
    return null;
  }

  const intersections = candidate.oncakCoordinates.map((coordinate) =>
    getIntersectionState(board, coordinate.x, coordinate.y),
  );
  if (!intersections.every(isOncakIntersection)) {
    return null;
  }

  const color = intersections[0]?.oncak.color;
  if (!color || !intersections.every((intersection) => intersection.oncak.color === color)) {
    return null;
  }
  if (
    !candidate.oncakCoordinates.every((coordinate) => routeContains(candidate.route, coordinate))
  ) {
    return null;
  }
  if (!routeContains(candidate.route, candidate.route.finalEndpoint)) {
    return null;
  }

  return {
    id: candidate.id,
    oncakColor: color,
    candidateOncakIds: intersections.map((intersection) => intersection.oncak.id),
    candidateOncakCoordinates: candidate.oncakCoordinates,
    routes: [candidate.route],
  };
}

function isOncakIntersection(
  intersection: IntersectionState | null,
): intersection is Extract<IntersectionState, { kind: 'ONCAK' }> {
  return intersection?.kind === 'ONCAK';
}

function expandSegment(segment: MovementSegment): IntersectionCoordinate[] | null {
  if (!isOrthogonalSegment(segment) || !hasMatchingDirection(segment)) {
    return null;
  }

  const deltaX = Math.sign(segment.end.x - segment.start.x);
  const deltaY = Math.sign(segment.end.y - segment.start.y);
  const length =
    Math.abs(segment.end.x - segment.start.x) + Math.abs(segment.end.y - segment.start.y);
  if (length === 0) {
    return null;
  }

  return Array.from({ length: length + 1 }, (_, index) => ({
    x: (segment.start.x + deltaX * index) as IntersectionCoordinate['x'],
    y: (segment.start.y + deltaY * index) as IntersectionCoordinate['y'],
  }));
}

function isOrthogonalSegment(segment: MovementSegment): boolean {
  return segment.start.x === segment.end.x || segment.start.y === segment.end.y;
}

function hasMatchingDirection(segment: MovementSegment): boolean {
  const expectedDirection = getDirection(segment.start, segment.end);
  return expectedDirection !== null && expectedDirection === segment.direction;
}

function getDirection(
  start: IntersectionCoordinate,
  end: IntersectionCoordinate,
): MovementDirection | null {
  if (start.x === end.x && start.y > end.y) {
    return 'UP';
  }
  if (start.x === end.x && start.y < end.y) {
    return 'DOWN';
  }
  if (start.y === end.y && start.x < end.x) {
    return 'RIGHT';
  }
  if (start.y === end.y && start.x > end.x) {
    return 'LEFT';
  }
  return null;
}

function routeContains(route: CaptureRoute, coordinate: IntersectionCoordinate): boolean {
  return route.intersections.some((routeCoordinate) => sameCoordinate(routeCoordinate, coordinate));
}

function hasUniqueCoordinates(coordinates: ReadonlyArray<IntersectionCoordinate>): boolean {
  return (
    new Set(coordinates.map((coordinate) => `${coordinate.x},${coordinate.y}`)).size ===
    coordinates.length
  );
}

function coordinatesMatch(
  first: ReadonlyArray<IntersectionCoordinate>,
  second: ReadonlyArray<IntersectionCoordinate>,
): boolean {
  return (
    first.length === second.length &&
    first.every((coordinate, index) => sameCoordinate(coordinate, second[index]))
  );
}

function sameCoordinate(
  first: IntersectionCoordinate | undefined,
  second: IntersectionCoordinate | undefined,
): boolean {
  return first?.x === second?.x && first?.y === second?.y;
}

function invalid(reason: RouteValidationReason): RouteValidationResult {
  return { isLegal: false, reason };
}
