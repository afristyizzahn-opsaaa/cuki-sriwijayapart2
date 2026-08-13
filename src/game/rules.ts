import {
  CENTRAL_LOGO_COORDINATE,
  INTERSECTION_GRID_SIZE,
  MAX_MOVEMENT_SEGMENTS,
} from '../constants/gameRules';
import type {
  CaptureGroup,
  CaptureOpportunity,
  CaptureRoute,
  DiceValue,
  IntersectionAxis,
  IntersectionBoard,
  IntersectionCoordinate,
  IntersectionState,
  MovementDirection,
  MovementSegment,
  OncakColor,
  Pawn,
  SequentialCaptureDraft,
} from '../types/game';

/** Readable aliases for UI and integration callers. Gameplay still uses intersection nodes. */
export type Coordinates = IntersectionCoordinate;
export type BoardState = IntersectionBoard;

/** The only values a canonical six-sided CUKI die may produce. */
export const DICE_VALUES: readonly DiceValue[] = [1, 2, 3, 4, 5, 6];

export type RuleViolation =
  | 'INVALID_DICE_VALUE'
  | 'EMPTY_ROUTE'
  | 'ORIGIN_MISMATCH'
  | 'OUT_OF_BOUNDS'
  | 'DIAGONAL_MOVEMENT'
  | 'ZERO_LENGTH_SEGMENT'
  | 'DISCONNECTED_SEGMENTS'
  | 'SEGMENT_DIRECTION_MISMATCH'
  | 'SEGMENT_LIMIT_EXCEEDED'
  | 'CENTRAL_LOGO_BLOCKED'
  | 'PAWN_BLOCKED'
  | 'ONCAK_BLOCKED'
  | 'GROUP_SIZE_MISMATCH'
  | 'MIXED_COLOR_GROUP'
  | 'ONCAK_NOT_PRESENT'
  | 'DUPLICATE_ONCAK'
  | 'ROUTE_DOES_NOT_CAPTURE_GROUP'
  | 'ILLEGAL_CAPTURE_SELECTION';

export interface RuleValidationResult {
  readonly isLegal: boolean;
  readonly reason: RuleViolation | null;
}

export interface CaptureGroupValidationResult extends RuleValidationResult {
  readonly group: CaptureGroup | null;
}

/** A deterministic die adapter: provide a seeded random value for reproducible replays. */
export function rollDice(randomValue: number): DiceValue {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError('INVALID_DICE_VALUE');
  }
  return (Math.floor(randomValue * DICE_VALUES.length) + 1) as DiceValue;
}

/** Validates an externally resolved die value without silently coercing invalid input. */
export function isDiceValue(value: unknown): value is DiceValue {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6;
}

export function validateDiceValue(value: unknown): RuleValidationResult {
  return isDiceValue(value) ? legal() : invalid('INVALID_DICE_VALUE');
}

/**
 * Ownership is an input rule, not merely a visual convention. UI controllers must use
 * this guard before selecting, dragging, or committing movement for a Pawn.
 */
export function canControlPawn(
  pawn: Pick<Pawn, 'playerId'>,
  activePlayerId: string | null,
): boolean {
  return activePlayerId !== null && pawn.playerId === activePlayerId;
}

/**
 * Returns true only when each visited intersection on a route is traversable. The origin
 * may contain the active Pawn; selected capture Oncak may be visited only as they are being
 * removed. Every other Pawn or Oncak is a hard line-of-sight obstacle.
 */
export function hasClearMovementPath(
  board: IntersectionBoard,
  route: CaptureRoute,
  activePawnId: string,
  origin: IntersectionCoordinate | null,
  capturedOncakCoordinates: ReadonlyArray<IntersectionCoordinate> = [],
): boolean {
  return validateMovementRoute(board, route, activePawnId, origin, capturedOncakCoordinates)
    .isLegal;
}

/**
 * Returns whether a Pawn has at least one reachable, exact-size capture for a resolved die.
 * A null position represents an OFF_BOARD Pawn, whose first capture is evaluated board-wide.
 */
export function hasValidCaptureMoves(
  pawnPos: Coordinates | null,
  diceVal: DiceValue,
  board: BoardState,
  activePawnId?: string,
): boolean {
  if (!isDiceValue(diceVal)) {
    return false;
  }

  const occupant = pawnPos ? board[pawnPos.y]?.[pawnPos.x] : null;
  const pawnId =
    activePawnId ??
    (occupant?.kind === 'PAWN' ? occupant.pawnOccupantId : 'reachability-off-board-pawn');
  const pawn: Pawn = {
    id: pawnId,
    playerId: pawnId,
    state:
      pawnPos === null
        ? { status: 'OFF_BOARD', position: null }
        : { status: 'ON_BOARD', position: pawnPos },
  };

  return findLegalCaptureOpportunities(board, pawn, diceVal).length > 0;
}

export function isValidIntersection(coordinate: {
  readonly x: number;
  readonly y: number;
}): boolean {
  return (
    Number.isInteger(coordinate.x) &&
    Number.isInteger(coordinate.y) &&
    coordinate.x >= 0 &&
    coordinate.x < INTERSECTION_GRID_SIZE &&
    coordinate.y >= 0 &&
    coordinate.y < INTERSECTION_GRID_SIZE
  );
}

export function isCentralLogo(coordinate: { readonly x: number; readonly y: number }): boolean {
  return coordinate.x === CENTRAL_LOGO_COORDINATE.x && coordinate.y === CENTRAL_LOGO_COORDINATE.y;
}

/** Expands a waypoint path into contiguous intersections, rejecting diagonal waypoints. */
export function createCaptureRoute(
  waypoints: ReadonlyArray<IntersectionCoordinate>,
): CaptureRoute | null {
  const normalized = removeConsecutiveDuplicates(waypoints);
  if (normalized.length === 0) {
    return null;
  }
  if (normalized.length === 1) {
    return {
      intersections: normalized,
      segments: [],
      finalEndpoint: normalized[0] as IntersectionCoordinate,
    };
  }

  const segments: MovementSegment[] = [];
  for (let index = 1; index < normalized.length; index += 1) {
    const start = normalized[index - 1] as IntersectionCoordinate;
    const end = normalized[index] as IntersectionCoordinate;
    const direction = directionBetween(start, end);
    if (direction === null) {
      return null;
    }
    const previous = segments[segments.length - 1];
    if (previous && previous.direction === direction && sameCoordinate(previous.end, start)) {
      segments[segments.length - 1] = { ...previous, end };
    } else {
      segments.push({ start, end, direction });
    }
  }

  const intersections = segments.flatMap((segment, index) => {
    const expanded = expandSegment(segment);
    return index === 0 ? expanded : expanded.slice(1);
  });
  return {
    intersections,
    segments,
    finalEndpoint: normalized[normalized.length - 1] as IntersectionCoordinate,
  };
}

/**
 * Validates all geometry and hard blocks for a complete route. Every Oncak not in the
 * selected capture group is a hard obstacle: a Pawn may not jump or slide through it.
 */
export function validateMovementRoute(
  board: IntersectionBoard,
  route: CaptureRoute,
  activePawnId: string,
  origin: IntersectionCoordinate | null,
  capturedOncakCoordinates: ReadonlyArray<IntersectionCoordinate> = [],
): RuleValidationResult {
  if (route.intersections.length === 0) {
    return invalid('EMPTY_ROUTE');
  }
  if (route.segments.length > MAX_MOVEMENT_SEGMENTS) {
    return invalid('SEGMENT_LIMIT_EXCEEDED');
  }
  if (origin !== null && !sameCoordinate(route.intersections[0], origin)) {
    return invalid('ORIGIN_MISMATCH');
  }

  const expanded: IntersectionCoordinate[] = [];
  if (route.segments.length === 0) {
    if (
      origin !== null ||
      route.intersections.length !== 1 ||
      !sameCoordinate(route.finalEndpoint, route.intersections[0])
    ) {
      return invalid('EMPTY_ROUTE');
    }
    expanded.push(route.intersections[0] as IntersectionCoordinate);
  }

  for (let index = 0; index < route.segments.length; index += 1) {
    const segment = route.segments[index] as MovementSegment;
    const previous = route.segments[index - 1];
    if (previous && !sameCoordinate(previous.end, segment.start)) {
      return invalid('DISCONNECTED_SEGMENTS');
    }
    const direction = directionBetween(segment.start, segment.end);
    if (direction === null) {
      return segment.start.x === segment.end.x && segment.start.y === segment.end.y
        ? invalid('ZERO_LENGTH_SEGMENT')
        : invalid('DIAGONAL_MOVEMENT');
    }
    if (direction !== segment.direction) {
      return invalid('SEGMENT_DIRECTION_MISMATCH');
    }
    const nodes = expandSegment(segment);
    expanded.push(...(index === 0 ? nodes : nodes.slice(1)));
  }

  if (
    !sameCoordinates(expanded, route.intersections) ||
    !sameCoordinate(expanded[expanded.length - 1], route.finalEndpoint)
  ) {
    return invalid('EMPTY_ROUTE');
  }
  const capturedOncakKeys = new Set(capturedOncakCoordinates.map(keyOf));
  for (let index = 0; index < expanded.length; index += 1) {
    const coordinate = expanded[index] as IntersectionCoordinate;
    if (!isValidIntersection(coordinate) || !board[coordinate.y]?.[coordinate.x]) {
      return invalid('OUT_OF_BOUNDS');
    }
    if (isCentralLogo(coordinate)) {
      return invalid('CENTRAL_LOGO_BLOCKED');
    }
    const intersection = board[coordinate.y]?.[coordinate.x];
    // The active Pawn vacates its origin as soon as the route begins. It may therefore
    // cross that original intersection again while resolving a two-sided capture. Any
    // other Pawn remains an absolute obstacle at every point in the route.
    if (intersection?.kind === 'PAWN' && intersection.pawnOccupantId !== activePawnId) {
      return invalid('PAWN_BLOCKED');
    }
    // Only the explicitly selected group is traversable, because each of those Oncak
    // is removed as part of this capture. Every other present Oncak is a line-of-sight
    // obstacle and cannot be jumped over or used as a teleport waypoint.
    if (intersection?.kind === 'ONCAK' && !capturedOncakKeys.has(keyOf(coordinate))) {
      return invalid('ONCAK_BLOCKED');
    }
    if (
      capturedOncakKeys.size > 0 &&
      !capturedOncakKeys.has(keyOf(coordinate)) &&
      !sameCoordinate(coordinate, origin)
    ) {
      return invalid('ONCAK_BLOCKED');
    }
  }
  return legal();
}

/** Compatibility alias for callers that name a route after its capture action. */
export const validateCaptureRoute = validateMovementRoute;

/**
 * Finds legal opportunities without flood-filling. Groups are exact straight same-colour
 * runs, plus groups that span the two opposite rays around an ON_BOARD Pawn. A spanning
 * group may use the full length of a clear horizontal or vertical board line; its route
 * still uses no more than two direction segments (out one side, then through the vacated
 * origin to the other side).
 */
export function findLegalCaptureOpportunities(
  board: IntersectionBoard,
  pawn: Pawn,
  diceValue: DiceValue,
): ReadonlyArray<CaptureOpportunity> {
  if (!isDiceValue(diceValue)) {
    return [];
  }
  const opportunities = new Map<string, CaptureOpportunity>();
  const addOpportunity = (opportunity: CaptureOpportunity): void => {
    const groupKey = `${opportunity.oncakColor}:${opportunity.candidateOncakCoordinates
      .map(keyOf)
      .join('-')}`;
    if (!opportunities.has(groupKey)) {
      opportunities.set(groupKey, opportunity);
    }
  };
  for (const run of collectExactRuns(board, diceValue)) {
    const routes = routesForRun(board, pawn, run.coordinates);
    if (routes.length === 0) {
      continue;
    }
    addOpportunity({
      id: `run-${run.color}-${run.coordinates.map(keyOf).join('-')}`,
      oncakColor: run.color,
      candidateOncakIds: run.coordinates.map((coordinate) => oncakAt(board, coordinate)?.id ?? ''),
      candidateOncakCoordinates: run.coordinates,
      routes,
    });
  }
  for (const directionalGroup of collectPawnDirectionalGroups(board, pawn, diceValue)) {
    addOpportunity(directionalGroup);
  }
  for (const spanningGroup of collectPawnSpanningGroups(board, pawn, diceValue)) {
    addOpportunity(spanningGroup);
  }
  return [...opportunities.values()].filter((opportunity) =>
    isMaximalCaptureCoordinates(board, opportunity.candidateOncakCoordinates, opportunity.oncakColor) &&
    opportunity.routes.some((route) =>
      isCaptureOpportunityRouteValid(board, pawn, opportunity, route),
    ),
  );
}

/** Prevents the UI from exposing a dice-sized slice of a longer straight run. */
function isMaximalCaptureCoordinates(
  board: IntersectionBoard,
  coordinates: ReadonlyArray<IntersectionCoordinate>,
  color: OncakColor,
): boolean {
  if (coordinates.length === 0) return false;
  const first = coordinates[0] as IntersectionCoordinate;
  const last = coordinates[coordinates.length - 1] as IntersectionCoordinate;
  const horizontal = coordinates.every((coordinateAtIndex) => coordinateAtIndex.y === first.y);
  const vertical = coordinates.every((coordinateAtIndex) => coordinateAtIndex.x === first.x);
  if (!horizontal && !vertical) return true;

  const delta = horizontal
    ? { x: Math.sign(last.x - first.x), y: 0 }
    : { x: 0, y: Math.sign(last.y - first.y) };
  if (delta.x === 0 && delta.y === 0) {
    const adjacent = [
      coordinate(first.x - 1, first.y),
      coordinate(first.x + 1, first.y),
      coordinate(first.x, first.y - 1),
      coordinate(first.x, first.y + 1),
    ];
    return adjacent.every((position) => oncakAt(board, position)?.color !== color);
  }

  const before = coordinate(first.x - delta.x, first.y - delta.y);
  const after = coordinate(last.x + delta.x, last.y + delta.y);
  return oncakAt(board, before)?.color !== color && oncakAt(board, after)?.color !== color;
}

function isCaptureOpportunityRouteValid(
  board: IntersectionBoard,
  pawn: Pawn,
  opportunity: CaptureOpportunity,
  route: CaptureRoute,
): boolean {
  const targetKeys = new Set(opportunity.candidateOncakCoordinates.map(keyOf));
  const routeKeys = new Set(route.intersections.map(keyOf));
  return (
    opportunity.candidateOncakCoordinates.every((coordinate) => routeKeys.has(keyOf(coordinate))) &&
    targetKeys.has(keyOf(route.finalEndpoint)) &&
    validateMovementRoute(
      board,
      route,
      pawn.id,
      pawn.state.status === 'ON_BOARD' ? pawn.state.position : null,
      opportunity.candidateOncakCoordinates,
    ).isLegal
  );
}

/**
 * Scratch-compatible scan entry point. It scans horizontal and vertical exact-size runs,
 * then retains only routes that satisfy the canonical line-of-sight validation.
 */
export function scanReachableCaptureGroups(
  board: IntersectionBoard,
  pawn: Pawn,
  diceValue: DiceValue,
): ReadonlyArray<CaptureOpportunity> {
  return findLegalCaptureOpportunities(board, pawn, diceValue);
}

export const evaluateCaptureOpportunities = findLegalCaptureOpportunities;

/** Validates a player supplied group against the already-authoritative legal action set. */
export function validateCaptureGroup(
  board: IntersectionBoard,
  pawn: Pawn,
  diceValue: DiceValue,
  group: CaptureGroup,
  legalOpportunities: ReadonlyArray<CaptureOpportunity> = findLegalCaptureOpportunities(
    board,
    pawn,
    diceValue,
  ),
): CaptureGroupValidationResult {
  if (
    !isDiceValue(diceValue) ||
    group.oncakCoordinates.length !== diceValue ||
    group.oncakIds.length !== diceValue
  ) {
    return invalidGroup('GROUP_SIZE_MISMATCH');
  }
  if (new Set(group.oncakCoordinates.map(keyOf)).size !== group.oncakCoordinates.length) {
    return invalidGroup('DUPLICATE_ONCAK');
  }
  const selected = group.oncakCoordinates.map((coordinate) => oncakAt(board, coordinate));
  if (!selected.every((piece): piece is NonNullable<typeof piece> => piece !== null)) {
    return invalidGroup('ONCAK_NOT_PRESENT');
  }
  if (!selected.every((piece) => piece.color === selected[0]?.color)) {
    return invalidGroup('MIXED_COLOR_GROUP');
  }
  if (
    !sameCoordinate(group.finalEndpoint, group.route.finalEndpoint) ||
    !group.oncakCoordinates.some((coordinate) => sameCoordinate(coordinate, group.finalEndpoint))
  ) {
    return invalidGroup('ROUTE_DOES_NOT_CAPTURE_GROUP');
  }
  const origin = pawn.state.status === 'ON_BOARD' ? pawn.state.position : null;
  const routeResult = validateMovementRoute(
    board,
    group.route,
    pawn.id,
    origin,
    group.oncakCoordinates,
  );
  if (!routeResult.isLegal) {
    return { ...routeResult, group: null };
  }
  const opportunity = legalOpportunities.find(
    (candidate) =>
      candidate.id === group.opportunityId &&
      candidate.oncakColor === group.oncakColor &&
      sameCoordinates(candidate.candidateOncakCoordinates, group.oncakCoordinates) &&
      sameStrings(candidate.candidateOncakIds, group.oncakIds) &&
      candidate.routes.some((route) => routesEqual(route, group.route)),
  );
  if (!opportunity || !isMaximalCaptureGroup(board, group)) {
    return invalidGroup('ILLEGAL_CAPTURE_SELECTION');
  }
  return { ...legal(), group };
}

/** Prevents a stale/malformed selection from taking a slice of a longer straight run. */
function isMaximalCaptureGroup(board: IntersectionBoard, group: CaptureGroup): boolean {
  if (group.oncakCoordinates.length < 1) return false;
  const coordinates = group.oncakCoordinates;
  const first = coordinates[0] as IntersectionCoordinate;
  const last = coordinates[coordinates.length - 1] as IntersectionCoordinate;
  const horizontal = coordinates.every((coordinate) => coordinate.y === first.y);
  const vertical = coordinates.every((coordinate) => coordinate.x === first.x);
  if (!horizontal && !vertical) {
    // A spanning capture is intentionally allowed to use both sides of the Pawn.
    return group.route.segments.length > 1;
  }

  const delta = horizontal
    ? { x: Math.sign(last.x - first.x), y: 0 }
    : { x: 0, y: Math.sign(last.y - first.y) };
  if (delta.x === 0 && delta.y === 0) return true;
  const before = coordinate(first.x - delta.x, first.y - delta.y);
  const after = coordinate(last.x + delta.x, last.y + delta.y);
  const sameColor = (position: IntersectionCoordinate): boolean =>
    oncakAt(board, position)?.color === group.oncakColor;
  return !sameColor(before) && !sameColor(after);
}

export function captureGroupFromOpportunity(
  opportunity: CaptureOpportunity,
  routeIndex = 0,
): CaptureGroup | null {
  const route = opportunity.routes[routeIndex];
  if (!route) {
    return null;
  }
  return {
    opportunityId: opportunity.id,
    oncakColor: opportunity.oncakColor,
    oncakIds: opportunity.candidateOncakIds,
    oncakCoordinates: opportunity.candidateOncakCoordinates,
    route,
    finalEndpoint: route.finalEndpoint,
  };
}

/**
 * Converts a legal opportunity into the ordered clicks that replace Scratch's mutable
 * `piece movement track` list. The order follows the selected route, never board-array order.
 */
export function getSequentialCaptureCoordinates(
  opportunity: CaptureOpportunity,
  routeIndex = 0,
): ReadonlyArray<IntersectionCoordinate> {
  const route = opportunity.routes[routeIndex];
  if (!route) return [];

  const ordered = orderedSequentialCaptureCoordinates(route, opportunity.candidateOncakCoordinates);
  return ordered.length === opportunity.candidateOncakCoordinates.length
    ? ordered
    : opportunity.candidateOncakCoordinates;
}

/**
 * Accepts exactly one next Oncak in the route order. This is presentation progress only;
 * authoritative score and board changes remain atomic when the full group is committed.
 */
export function canAppendSequentialCaptureStep(
  opportunity: CaptureOpportunity,
  draft: SequentialCaptureDraft | null,
  nextCoordinate: IntersectionCoordinate,
): boolean {
  const selected = draft?.opportunityId === opportunity.id ? draft.selectedOncakCoordinates : [];
  if (selected.length >= opportunity.candidateOncakCoordinates.length) return false;
  if (!opportunity.candidateOncakCoordinates.some((coordinate) => sameCoordinate(coordinate, nextCoordinate))) {
    return false;
  }

  return opportunity.routes.some((route) => {
    const ordered = orderedSequentialCaptureCoordinates(route, opportunity.candidateOncakCoordinates);
    if (ordered.length !== opportunity.candidateOncakCoordinates.length) return false;
    if (!matchesSequentialPrefix(ordered, selected)) return false;
    const nextExpected = ordered[selected.length];
    return nextExpected !== undefined && sameCoordinate(nextExpected, nextCoordinate);
  });
}

export function hasLegalCapture(
  board: IntersectionBoard,
  pawn: Pawn,
  diceValue: DiceValue,
): boolean {
  return findLegalCaptureOpportunities(board, pawn, diceValue).length > 0;
}

interface OncakRun {
  readonly color: OncakColor;
  readonly coordinates: ReadonlyArray<IntersectionCoordinate>;
}

/**
 * Detects a straight one-direction capture from the active Pawn. A capture line is made
 * from adjacent Oncak only; empty intersections, Pawns, the central logo, and the opposite
 * colour terminate the line. The first opposite-colour Oncak is the required boundary.
 */
function collectPawnDirectionalGroups(
  board: IntersectionBoard,
  pawn: Pawn,
  diceValue: DiceValue,
): ReadonlyArray<CaptureOpportunity> {
  if (pawn.state.status !== 'ON_BOARD') {
    return [];
  }

  const origin = pawn.state.position;
  const opportunities: CaptureOpportunity[] = [];
  for (const direction of ['UP', 'RIGHT', 'DOWN', 'LEFT'] as const) {
    const ray = scanPawnRay(board, origin, direction);
    for (const color of ['BLACK', 'WHITE'] as const) {
      const targets = targetSequenceBeforeBoundary(ray, color);
      if (
        targets.coordinates.length !== diceValue ||
        !targets.boundary ||
        targets.boundary.color === color
      ) {
        continue;
      }

      const endpoint = targets.coordinates[targets.coordinates.length - 1];
      const route = endpoint ? createCaptureRoute([origin, endpoint]) : null;
      if (
        !route ||
        hasSameColorOnOppositeSideOfPawn(board, origin, targets.coordinates[0] as IntersectionCoordinate, color) ||
        !validateMovementRoute(board, route, pawn.id, origin, targets.coordinates).isLegal
      ) {
        continue;
      }

      opportunities.push({
        id: `ray-${direction}-${color}-${targets.coordinates.map(keyOf).join('-')}`,
        oncakColor: color,
        candidateOncakIds: targets.coordinates.map(
          (coordinateAtIndex) => oncakAt(board, coordinateAtIndex)?.id ?? '',
        ),
        candidateOncakCoordinates: targets.coordinates,
        routes: [route],
      });
    }
  }

  return opportunities;
}

/**
 * Detects groups split across the two sides of an ON_BOARD Pawn. For example, with a die
 * value of 3, one WHITE above and two WHITE below form one group when BLACK bounds the
 * outside of both WHITE sequences. The Pawn may travel to either side first, then reverse
 * through its now-vacated origin to finish on the other side. This is two straight segments,
 * not one segment per intersection, so each segment can span any clear board distance.
 */
function collectPawnSpanningGroups(
  board: IntersectionBoard,
  pawn: Pawn,
  diceValue: DiceValue,
): ReadonlyArray<CaptureOpportunity> {
  if (pawn.state.status !== 'ON_BOARD') {
    return [];
  }

  const origin = pawn.state.position;
  const axes: ReadonlyArray<readonly [MovementDirection, MovementDirection]> = [
    ['LEFT', 'RIGHT'],
    ['UP', 'DOWN'],
  ];

  const opportunities: CaptureOpportunity[] = [];
  for (const [firstDirection, secondDirection] of axes) {
    const firstRay = scanPawnRay(board, origin, firstDirection);
    const secondRay = scanPawnRay(board, origin, secondDirection);
    for (const color of ['BLACK', 'WHITE'] as const) {
      const firstTargets = targetSequenceBeforeBoundary(firstRay, color);
      const secondTargets = targetSequenceBeforeBoundary(secondRay, color);
      if (
        firstTargets.coordinates.length === 0 ||
        secondTargets.coordinates.length === 0 ||
        firstTargets.coordinates.length + secondTargets.coordinates.length !== diceValue ||
        firstTargets.boundary?.color === color ||
        secondTargets.boundary?.color === color ||
        !firstTargets.boundary ||
        !secondTargets.boundary
      ) {
        continue;
      }

      const coordinates = [...firstTargets.coordinates, ...secondTargets.coordinates];
      const routes = createSpanningRoutes(
        board,
        pawn,
        origin,
        firstTargets.coordinates,
        secondTargets.coordinates,
        coordinates,
      );
      if (routes.length === 0) continue;

      const isClassicBridge =
        diceValue === 2 &&
        firstTargets.coordinates.length === 1 &&
        secondTargets.coordinates.length === 1;
      const idPrefix = isClassicBridge ? 'bridge' : 'span';
      opportunities.push({
        id: `${idPrefix}-${color}-${coordinates.map(keyOf).join('-')}`,
        oncakColor: color,
        candidateOncakIds: coordinates.map(
          (coordinateAtIndex) => oncakAt(board, coordinateAtIndex)?.id ?? '',
        ),
        candidateOncakCoordinates: coordinates,
        routes,
      });
    }
  }
  return opportunities;
}

interface PawnRayNode {
  readonly coordinate: IntersectionCoordinate;
  readonly intersection: IntersectionState;
}

interface TargetSequence {
  readonly coordinates: ReadonlyArray<IntersectionCoordinate>;
  readonly boundary: Extract<IntersectionState, { kind: 'ONCAK' }>['oncak'] | null;
}

/**
 * Reads one full orthogonal ray from a Pawn. Empty intersections, another Pawn, or the
 * central logo terminate the contiguous capture line.
 */
function scanPawnRay(
  board: IntersectionBoard,
  origin: IntersectionCoordinate,
  direction: MovementDirection,
): ReadonlyArray<PawnRayNode> {
  const nodes: PawnRayNode[] = [];
  const delta = directionDelta(direction);
  for (
    let x = origin.x + delta.x, y = origin.y + delta.y;
    isValidIntersection({ x, y });
    x += delta.x, y += delta.y
  ) {
    const nodeCoordinate = coordinate(x, y);
    if (isCentralLogo(nodeCoordinate)) break;
    const intersection = board[nodeCoordinate.y]?.[nodeCoordinate.x];
    if (!intersection) break;
    nodes.push({ coordinate: nodeCoordinate, intersection });
    if (intersection.kind === 'PAWN') break;
  }
  return nodes;
}

/**
 * Only adjacent same-colour Oncak before the opposing boundary are part of the line. Empty
 * nodes are not skippable: this prevents a dice-1 capture from behaving like a chess rook.
 */
function targetSequenceBeforeBoundary(
  ray: ReadonlyArray<PawnRayNode>,
  color: OncakColor,
): TargetSequence {
  const coordinates: IntersectionCoordinate[] = [];
  let crossedEmpty = false;
  for (const node of ray) {
    if (node.intersection.kind === 'EMPTY') {
      crossedEmpty = true;
      continue;
    }
    if (node.intersection.kind !== 'ONCAK') return { coordinates: [], boundary: null };
    if (crossedEmpty) {
      // A gap may lead to the opposing boundary, but never to another target of the
      // same colour. This keeps the count exact instead of scanning like a rook.
      return node.intersection.oncak.color === color
        ? { coordinates: [], boundary: null }
        : { coordinates, boundary: node.intersection.oncak };
    }
    if (node.intersection.oncak.color === color) {
      coordinates.push(node.coordinate);
      continue;
    }
    return { coordinates, boundary: node.intersection.oncak };
  }
  return { coordinates: [], boundary: null };
}

function createSpanningRoutes(
  board: IntersectionBoard,
  pawn: Pawn,
  origin: IntersectionCoordinate,
  firstTargets: ReadonlyArray<IntersectionCoordinate>,
  secondTargets: ReadonlyArray<IntersectionCoordinate>,
  allTargets: ReadonlyArray<IntersectionCoordinate>,
): ReadonlyArray<CaptureRoute> {
  const endpoints = [
    [firstTargets, secondTargets],
    [secondTargets, firstTargets],
  ] as const;
  const routes = new Map<string, CaptureRoute>();
  for (const [outbound, inbound] of endpoints) {
    const firstEndpoint = outbound[outbound.length - 1];
    const finalEndpoint = inbound[inbound.length - 1];
    if (!firstEndpoint || !finalEndpoint) continue;
    const route = createCaptureRoute([origin, firstEndpoint, origin, finalEndpoint]);
    if (!route) continue;
    if (validateMovementRoute(board, route, pawn.id, origin, allTargets).isLegal) {
      routes.set(routeKey(route), route);
    }
  }
  return [...routes.values()];
}

function collectExactRuns(board: IntersectionBoard, diceValue: DiceValue): ReadonlyArray<OncakRun> {
  const runs: OncakRun[] = [];
  for (let y = 0; y < INTERSECTION_GRID_SIZE; y += 1) {
    collectRunsFromLine(
      board,
      Array.from({ length: INTERSECTION_GRID_SIZE }, (_, x) => coordinate(x, y)),
      diceValue,
      runs,
    );
  }
  for (let x = 0; x < INTERSECTION_GRID_SIZE; x += 1) {
    collectRunsFromLine(
      board,
      Array.from({ length: INTERSECTION_GRID_SIZE }, (_, y) => coordinate(x, y)),
      diceValue,
      runs,
    );
  }
  return runs;
}

function collectRunsFromLine(
  board: IntersectionBoard,
  line: ReadonlyArray<IntersectionCoordinate>,
  diceValue: DiceValue,
  target: OncakRun[],
): void {
  let index = 0;
  while (index < line.length) {
    const first = oncakAt(board, line[index] as IntersectionCoordinate);
    if (!first) {
      index += 1;
      continue;
    }
    const coordinates: IntersectionCoordinate[] = [];
    while (index < line.length) {
      const coordinateAtIndex = line[index] as IntersectionCoordinate;
      const next = oncakAt(board, coordinateAtIndex);
      if (!next || next.color !== first.color) break;
      coordinates.push(coordinateAtIndex);
      index += 1;
    }
    if (coordinates.length === diceValue) {
      target.push({ color: first.color, coordinates });
    }
  }
}

function routesForRun(
  board: IntersectionBoard,
  pawn: Pawn,
  coordinates: ReadonlyArray<IntersectionCoordinate>,
): ReadonlyArray<CaptureRoute> {
  const orderedRuns = [coordinates, [...coordinates].reverse()];
  const routes = new Map<string, CaptureRoute>();
  for (const ordered of orderedRuns) {
    const entry = ordered[0] as IntersectionCoordinate;
    const endpoint = ordered[ordered.length - 1] as IntersectionCoordinate;
    const candidates =
      pawn.state.status === 'OFF_BOARD'
        ? [createCaptureRoute([entry, endpoint])]
        : hasSameColorOnOppositeSideOfPawn(board, pawn.state.position, entry, runColor(board, coordinates))
          ? []
          : createOnBoardRoutes(pawn.state.position, entry, endpoint);
    for (const route of candidates) {
      if (!route) continue;
      const validation = validateMovementRoute(
        board,
        route,
        pawn.id,
        pawn.state.status === 'ON_BOARD' ? pawn.state.position : null,
        coordinates,
      );
      if (validation.isLegal && routeCapturesOnlyAfterEntry(route, entry, coordinates)) {
        routes.set(routeKey(route), route);
      }
    }
  }
  return [...routes.values()];
}

function runColor(
  board: IntersectionBoard,
  coordinates: ReadonlyArray<IntersectionCoordinate>,
): OncakColor {
  return oncakAt(board, coordinates[0] as IntersectionCoordinate)?.color ?? 'BLACK';
}

/**
 * A Pawn does not split one straight line into independent runs. If the same colour
 * is immediately behind the Pawn, selecting only the run on the other side would
 * incorrectly allow a smaller dice value.
 */
function hasSameColorOnOppositeSideOfPawn(
  board: IntersectionBoard,
  origin: IntersectionCoordinate,
  entry: IntersectionCoordinate,
  color: OncakColor,
): boolean {
  const axisDelta = entry.x === origin.x
    ? { x: 0, y: Math.sign(entry.y - origin.y) }
    : { x: Math.sign(entry.x - origin.x), y: 0 };
  for (
    let x = origin.x - axisDelta.x, y = origin.y - axisDelta.y;
    isValidIntersection({ x, y });
    x -= axisDelta.x, y -= axisDelta.y
  ) {
    const position = coordinate(x, y);
    if (isCentralLogo(position)) break;
    const intersection = board[y]?.[x];
    if (!intersection || intersection.kind === 'PAWN') break;
    if (intersection.kind === 'ONCAK') {
      return intersection.oncak.color === color;
    }
  }
  return false;
}

function createOnBoardRoutes(
  origin: IntersectionCoordinate,
  entry: IntersectionCoordinate,
  endpoint: IntersectionCoordinate,
): ReadonlyArray<CaptureRoute | null> {
  // A capture must be approached on the same horizontal or vertical line as the Pawn.
  // Do not route around the board: that makes an unrelated row look reachable like a rook.
  if (origin.x !== entry.x && origin.y !== entry.y) return [];
  return [createCaptureRoute([origin, entry, endpoint])];
}

function routeCapturesOnlyAfterEntry(
  route: CaptureRoute,
  entry: IntersectionCoordinate,
  run: ReadonlyArray<IntersectionCoordinate>,
): boolean {
  const entryIndex = route.intersections.findIndex((coordinateAtIndex) =>
    sameCoordinate(coordinateAtIndex, entry),
  );
  const runCoordinates = new Set(run.map(keyOf));
  return (
    entryIndex >= 0 &&
    route.intersections
      .slice(0, entryIndex)
      .every((coordinateAtIndex) => !runCoordinates.has(keyOf(coordinateAtIndex)))
  );
}

function oncakAt(
  board: IntersectionBoard,
  coordinate: IntersectionCoordinate,
): Extract<IntersectionState, { kind: 'ONCAK' }>['oncak'] | null {
  const intersection = board[coordinate.y]?.[coordinate.x];
  return intersection?.kind === 'ONCAK' ? intersection.oncak : null;
}

function expandSegment(segment: MovementSegment): IntersectionCoordinate[] {
  const deltaX = Math.sign(segment.end.x - segment.start.x);
  const deltaY = Math.sign(segment.end.y - segment.start.y);
  const length =
    Math.abs(segment.end.x - segment.start.x) + Math.abs(segment.end.y - segment.start.y);
  return Array.from({ length: length + 1 }, (_, index) =>
    coordinate(segment.start.x + deltaX * index, segment.start.y + deltaY * index),
  );
}

function coordinate(x: number, y: number): IntersectionCoordinate {
  return { x: x as IntersectionAxis, y: y as IntersectionAxis };
}

function directionBetween(
  start: IntersectionCoordinate,
  end: IntersectionCoordinate,
): MovementDirection | null {
  if (start.x === end.x && start.y !== end.y) return start.y < end.y ? 'DOWN' : 'UP';
  if (start.y === end.y && start.x !== end.x) return start.x < end.x ? 'RIGHT' : 'LEFT';
  return null;
}

function directionDelta(direction: MovementDirection): { readonly x: number; readonly y: number } {
  switch (direction) {
    case 'UP':
      return { x: 0, y: -1 };
    case 'RIGHT':
      return { x: 1, y: 0 };
    case 'DOWN':
      return { x: 0, y: 1 };
    case 'LEFT':
      return { x: -1, y: 0 };
  }
}

function removeConsecutiveDuplicates(
  coordinates: ReadonlyArray<IntersectionCoordinate>,
): ReadonlyArray<IntersectionCoordinate> {
  return coordinates.filter(
    (coordinateAtIndex, index) => !sameCoordinate(coordinateAtIndex, coordinates[index - 1]),
  );
}

function sameCoordinate(
  first: IntersectionCoordinate | undefined | null,
  second: IntersectionCoordinate | undefined | null,
): boolean {
  return first?.x === second?.x && first?.y === second?.y;
}

function sameCoordinates(
  first: ReadonlyArray<IntersectionCoordinate>,
  second: ReadonlyArray<IntersectionCoordinate>,
): boolean {
  return (
    first.length === second.length &&
    first.every((coordinateAtIndex, index) => sameCoordinate(coordinateAtIndex, second[index]))
  );
}

function sameStrings(first: ReadonlyArray<string>, second: ReadonlyArray<string>): boolean {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function routesEqual(first: CaptureRoute, second: CaptureRoute): boolean {
  return (
    sameCoordinates(first.intersections, second.intersections) &&
    first.segments.length === second.segments.length &&
    first.segments.every((segment, index) => {
      const comparison = second.segments[index];
      return (
        comparison !== undefined &&
        sameCoordinate(segment.start, comparison.start) &&
        sameCoordinate(segment.end, comparison.end) &&
        segment.direction === comparison.direction
      );
    }) &&
    sameCoordinate(first.finalEndpoint, second.finalEndpoint)
  );
}

function keyOf(coordinate: IntersectionCoordinate): string {
  return `${coordinate.x},${coordinate.y}`;
}

function orderedSequentialCaptureCoordinates(
  route: CaptureRoute,
  candidateCoordinates: ReadonlyArray<IntersectionCoordinate>,
): ReadonlyArray<IntersectionCoordinate> {
  const candidateKeys = new Set(candidateCoordinates.map(keyOf));
  const seen = new Set<string>();
  const ordered = route.intersections.filter((coordinate) => {
    const key = keyOf(coordinate);
    if (!candidateKeys.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return ordered;
}

function matchesSequentialPrefix(
  ordered: ReadonlyArray<IntersectionCoordinate>,
  selected: ReadonlyArray<IntersectionCoordinate>,
): boolean {
  return selected.every((coordinate, index) => sameCoordinate(coordinate, ordered[index]));
}

function routeKey(route: CaptureRoute): string {
  return route.intersections.map(keyOf).join('|');
}

function legal(): RuleValidationResult {
  return { isLegal: true, reason: null };
}

function invalid(reason: RuleViolation): RuleValidationResult {
  return { isLegal: false, reason };
}

function invalidGroup(reason: RuleViolation): CaptureGroupValidationResult {
  return { isLegal: false, reason, group: null };
}
