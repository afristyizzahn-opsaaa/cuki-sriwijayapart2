import type {
  CaptureOpportunity,
  CaptureRoute,
  DiceValue,
  IntersectionAxis,
  IntersectionCoordinate,
  MovementDirection,
  MovementSegment,
  RuntimeGameState,
} from '../../types/game';
import {
  evaluateCaptureOpportunities,
  type CaptureOpportunityCandidate,
} from './captureOpportunities';

interface MaximalOncakRun {
  readonly color: 'BLACK' | 'WHITE';
  readonly coordinates: ReadonlyArray<IntersectionCoordinate>;
  readonly id: string;
}

/**
 * Enumerates maximal same-colour horizontal and vertical Oncak runs, then delegates all
 * structural and route legality decisions to the existing capture-opportunity engine.
 */
export function getLegalCaptureOpportunities(
  state: RuntimeGameState,
  diceValue: DiceValue,
): ReadonlyArray<CaptureOpportunity> {
  const activePlayer = state.players[state.activePlayerIndex];
  if (state.matchStatus !== 'ACTIVE' || !activePlayer) {
    return [];
  }

  const candidates = findMaximalOncakRuns(state)
    .filter((run) => run.coordinates.length === diceValue)
    .flatMap((run) => createCandidatesForRun(state, run));

  return mergeRoutesByOpportunity(
    evaluateCaptureOpportunities(state.board, activePlayer.pawn, diceValue, candidates),
  );
}

function findMaximalOncakRuns(state: RuntimeGameState): ReadonlyArray<MaximalOncakRun> {
  const runs = new Map<string, MaximalOncakRun>();

  for (let y = 0; y <= 10; y += 1) {
    collectLineRuns(
      Array.from({ length: 11 }, (_, x) => coordinate(x, y)),
      state,
      runs,
    );
  }
  for (let x = 0; x <= 10; x += 1) {
    collectLineRuns(
      Array.from({ length: 11 }, (_, y) => coordinate(x, y)),
      state,
      runs,
    );
  }

  return [...runs.values()];
}

function collectLineRuns(
  line: ReadonlyArray<IntersectionCoordinate>,
  state: RuntimeGameState,
  runs: Map<string, MaximalOncakRun>,
): void {
  let index = 0;
  while (index < line.length) {
    const coordinateAtIndex = line[index] as IntersectionCoordinate;
    const intersection = state.board[coordinateAtIndex.y]?.[coordinateAtIndex.x];
    if (intersection?.kind !== 'ONCAK') {
      index += 1;
      continue;
    }

    const color = intersection.oncak.color;
    const coordinates: IntersectionCoordinate[] = [];
    while (index < line.length) {
      const nextCoordinate = line[index] as IntersectionCoordinate;
      const nextIntersection = state.board[nextCoordinate.y]?.[nextCoordinate.x];
      if (nextIntersection?.kind !== 'ONCAK' || nextIntersection.oncak.color !== color) {
        break;
      }
      coordinates.push(nextCoordinate);
      index += 1;
    }

    const id = `run-${color}-${coordinates.map(coordinateKey).join('-')}`;
    runs.set(id, { id, color, coordinates });
  }
}

function createCandidatesForRun(
  state: RuntimeGameState,
  run: MaximalOncakRun,
): ReadonlyArray<CaptureOpportunityCandidate> {
  const orderedRuns = [run.coordinates, [...run.coordinates].reverse()];
  const routes = orderedRuns.flatMap((orderedCoordinates) =>
    createRoutesToRun(state, orderedCoordinates),
  );

  return routes.map((route) => ({
    id: run.id,
    oncakCoordinates: run.coordinates,
    route,
  }));
}

function createRoutesToRun(
  state: RuntimeGameState,
  orderedCoordinates: ReadonlyArray<IntersectionCoordinate>,
): ReadonlyArray<CaptureRoute> {
  const entry = orderedCoordinates[0] as IntersectionCoordinate;
  const endpoint = orderedCoordinates[orderedCoordinates.length - 1] as IntersectionCoordinate;
  if (state.players[state.activePlayerIndex]?.pawn.state.status === 'OFF_BOARD') {
    return [createRoute([entry, endpoint])].filter(isRouteValid);
  }

  const origin = state.players[state.activePlayerIndex]?.pawn.state.position;
  if (!origin) {
    return [];
  }

  // The Pawn must face the capture line directly. No diagonal or multi-corner detours.
  if (origin.x !== entry.x && origin.y !== entry.y) return [];
  const route = createRoute([origin, entry, endpoint]);
  return isRouteValid(route) && doesApproachAvoidRun(route, entry, orderedCoordinates)
    ? [route]
    : [];
}

function createRoute(waypoints: ReadonlyArray<IntersectionCoordinate>): CaptureRoute {
  const normalizedWaypoints = removeConsecutiveDuplicates(waypoints);
  const segments = createSegments(normalizedWaypoints);
  const intersections = segments.flatMap((segment, index) => {
    const nodes = expandSegment(segment);
    return index === 0 ? nodes : nodes.slice(1);
  });

  return {
    intersections: intersections.length > 0 ? intersections : [normalizedWaypoints[0] as IntersectionCoordinate],
    segments,
    finalEndpoint: normalizedWaypoints[normalizedWaypoints.length - 1] as IntersectionCoordinate,
  };
}

function createSegments(waypoints: ReadonlyArray<IntersectionCoordinate>): ReadonlyArray<MovementSegment> {
  const rawSegments = waypoints.slice(1).map((end, index) => {
    const start = waypoints[index] as IntersectionCoordinate;
    return { start, end, direction: directionBetween(start, end) };
  });

  return rawSegments.reduce<MovementSegment[]>((segments, segment) => {
    const previous = segments[segments.length - 1];
    if (previous && previous.direction === segment.direction && sameCoordinate(previous.end, segment.start)) {
      segments[segments.length - 1] = { ...previous, end: segment.end };
      return segments;
    }
    segments.push(segment);
    return segments;
  }, []);
}

function doesApproachAvoidRun(
  route: CaptureRoute,
  entry: IntersectionCoordinate,
  orderedCoordinates: ReadonlyArray<IntersectionCoordinate>,
): boolean {
  const entryIndex = route.intersections.findIndex((coordinateAtIndex) => sameCoordinate(coordinateAtIndex, entry));
  const runKeys = new Set(orderedCoordinates.map(coordinateKey));
  return entryIndex >= 0 && route.intersections.slice(0, entryIndex).every((coordinateAtIndex) => !runKeys.has(coordinateKey(coordinateAtIndex)));
}

function mergeRoutesByOpportunity(
  opportunities: ReadonlyArray<CaptureOpportunity>,
): ReadonlyArray<CaptureOpportunity> {
  const byId = new Map<string, CaptureOpportunity>();
  for (const opportunity of opportunities) {
    const existing = byId.get(opportunity.id);
    if (!existing) {
      byId.set(opportunity.id, opportunity);
      continue;
    }
    if (!existing.routes.some((route) => routesMatch(route, opportunity.routes[0]))) {
      byId.set(opportunity.id, { ...existing, routes: [...existing.routes, ...opportunity.routes] });
    }
  }
  return [...byId.values()];
}

function removeConsecutiveDuplicates(
  coordinates: ReadonlyArray<IntersectionCoordinate>,
): ReadonlyArray<IntersectionCoordinate> {
  return coordinates.filter((coordinateAtIndex, index) => !sameCoordinate(coordinateAtIndex, coordinates[index - 1]));
}

function expandSegment(segment: MovementSegment): ReadonlyArray<IntersectionCoordinate> {
  const deltaX = Math.sign(segment.end.x - segment.start.x);
  const deltaY = Math.sign(segment.end.y - segment.start.y);
  const length = Math.abs(segment.end.x - segment.start.x) + Math.abs(segment.end.y - segment.start.y);
  return Array.from({ length: length + 1 }, (_, index) =>
    coordinate(segment.start.x + deltaX * index, segment.start.y + deltaY * index),
  );
}

function directionBetween(start: IntersectionCoordinate, end: IntersectionCoordinate): MovementDirection {
  if (start.x === end.x) {
    return start.y < end.y ? 'DOWN' : 'UP';
  }
  return start.x < end.x ? 'RIGHT' : 'LEFT';
}

function isRouteValid(route: CaptureRoute): boolean {
  return route.segments.every((segment) => segment.start.x !== segment.end.x || segment.start.y !== segment.end.y);
}

function routesMatch(first: CaptureRoute, second: CaptureRoute | undefined): boolean {
  if (!second) {
    return false;
  }

  return (
    first.intersections.length === second.intersections.length &&
    first.intersections.every((coordinateAtIndex, index) => sameCoordinate(coordinateAtIndex, second.intersections[index])) &&
    first.segments.length === second.segments.length &&
    first.segments.every(
      (segment, index) =>
        sameCoordinate(segment.start, second.segments[index]?.start) &&
        sameCoordinate(segment.end, second.segments[index]?.end) &&
        segment.direction === second.segments[index]?.direction,
    )
  );
}

function coordinate(x: number, y: number): IntersectionCoordinate {
  return { x: x as IntersectionAxis, y: y as IntersectionAxis };
}

function coordinateKey(coordinateAtIndex: IntersectionCoordinate): string {
  return `${coordinateAtIndex.x},${coordinateAtIndex.y}`;
}

function sameCoordinate(
  first: IntersectionCoordinate | undefined,
  second: IntersectionCoordinate | undefined,
): boolean {
  return first?.x === second?.x && first?.y === second?.y;
}
