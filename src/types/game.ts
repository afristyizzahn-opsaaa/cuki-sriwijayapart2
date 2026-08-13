/** Sprint 1 foundation player colours for UI/store-level ownership. */
export type PlayerColor = 'BLACK' | 'WHITE' | 'RED' | 'BLUE';

/** Sprint 1 foundation Oncak cell value for the 11 × 11 intersection board. */
export type CellOncak = 'BLACK' | 'WHITE' | null;

/** Valid coordinate values on the canonical 11 × 11 gameplay intersection layer. */
export type IntersectionAxis = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** A gameplay position on the intersection layer, never a visual cell centre. */
export interface IntersectionCoordinate {
  readonly x: IntersectionAxis;
  readonly y: IntersectionAxis;
}

/** Sprint 1 foundation position contract; callers must keep x/y inside 0..10. */
export interface Position {
  readonly x: number;
  readonly y: number;
}

export type OncakColor = 'BLACK' | 'WHITE';

export type OncakState = 'PRESENT' | 'REMOVED';

export interface PresentOncakPiece {
  readonly id: string;
  readonly color: OncakColor;
  readonly state: 'PRESENT';
  readonly position: IntersectionCoordinate;
}

export interface RemovedOncakPiece {
  readonly id: string;
  readonly color: OncakColor;
  readonly state: 'REMOVED';
  readonly position: IntersectionCoordinate;
}

export type OncakPiece = PresentOncakPiece | RemovedOncakPiece;

interface BaseIntersectionState {
  readonly coordinate: IntersectionCoordinate;
}

/** The central logo is permanently blocked and cannot contain an entity. */
export interface CentralLogoIntersectionState extends BaseIntersectionState {
  readonly kind: 'CENTRAL_LOGO';
  readonly oncak: null;
  readonly pawnOccupantId: null;
}

export interface EmptyIntersectionState extends BaseIntersectionState {
  readonly kind: 'EMPTY';
  readonly oncak: null;
  readonly pawnOccupantId: null;
}

export interface OncakIntersectionState extends BaseIntersectionState {
  readonly kind: 'ONCAK';
  readonly oncak: PresentOncakPiece;
  readonly pawnOccupantId: null;
}

export interface PawnIntersectionState extends BaseIntersectionState {
  readonly kind: 'PAWN';
  readonly oncak: null;
  readonly pawnOccupantId: string;
}

/** A stable gameplay intersection; impossible Oncak/Pawn combinations are unrepresentable. */
export type IntersectionState =
  | CentralLogoIntersectionState
  | EmptyIntersectionState
  | OncakIntersectionState
  | PawnIntersectionState;

export type IntersectionBoard = ReadonlyArray<ReadonlyArray<IntersectionState>>;

export type PawnStatus = 'OFF_BOARD' | 'ON_BOARD';

export interface OffBoardPawnState {
  readonly status: 'OFF_BOARD';
  readonly position: null;
}

export interface OnBoardPawnState {
  readonly status: 'ON_BOARD';
  readonly position: IntersectionCoordinate;
}

export type PawnLocationState = OffBoardPawnState | OnBoardPawnState;

/** Sprint 1 foundation pawn contract for lightweight store/game adapters. */
export interface PawnState {
  readonly id: string;
  readonly owner: PlayerColor;
  readonly position: Position | 'OFF_BOARD';
}

export interface Pawn {
  readonly id: string;
  readonly playerId: string;
  readonly state: PawnLocationState;
}

export type ControllerType = 'HUMAN' | 'AI';

export interface PlayerState {
  readonly id: string;
  readonly name: string;
  readonly controllerType: ControllerType;
  readonly score: number;
  readonly pawn: Pawn;
}

export type PlayerCount = 2 | 3 | 4;

export type GameMode = 'VS_AI' | 'LOCAL_MULTIPLAYER';

/** Dice values determine capture-group quantity, never movement distance. */
export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

export type MovementDirection = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

export interface MovementSegment {
  readonly start: IntersectionCoordinate;
  readonly end: IntersectionCoordinate;
  readonly direction: MovementDirection;
}

/** A complete route is expressed solely through intersection coordinates. */
export interface CaptureRoute {
  readonly intersections: ReadonlyArray<IntersectionCoordinate>;
  readonly segments: ReadonlyArray<MovementSegment>;
  readonly finalEndpoint: IntersectionCoordinate;
}

/** A candidate capture path/opportunity before a player selects a group. */
export interface CaptureOpportunity {
  readonly id: string;
  readonly oncakColor: OncakColor;
  readonly candidateOncakIds: ReadonlyArray<string>;
  readonly candidateOncakCoordinates: ReadonlyArray<IntersectionCoordinate>;
  readonly routes: ReadonlyArray<CaptureRoute>;
}

/** A complete same-colour group selected from one capture opportunity. */
export interface CaptureGroup {
  readonly opportunityId: string;
  readonly oncakColor: OncakColor;
  readonly oncakIds: ReadonlyArray<string>;
  readonly oncakCoordinates: ReadonlyArray<IntersectionCoordinate>;
  readonly route: CaptureRoute;
  readonly finalEndpoint: IntersectionCoordinate;
}

/** UI-safe, serializable progress for an in-flight Scratch-style sequential capture. */
export interface SequentialCaptureDraft {
  readonly opportunityId: string;
  readonly requiredDiceValue: DiceValue;
  readonly selectedOncakCoordinates: ReadonlyArray<IntersectionCoordinate>;
}

export type TurnPhase =
  | 'WAITING_FOR_DICE_ROLL'
  | 'DICE_RESOLVED'
  | 'WAITING_FOR_PAWN_MOVE'
  | 'EVALUATING_CAPTURE_OPPORTUNITIES'
  | 'WAITING_FOR_CAPTURE_SELECTION'
  | 'RESOLVING_CAPTURE_GROUP'
  | 'REEVALUATING_SAME_DICE'
  | 'REROLL_REQUIRED'
  | 'TURN_END';

export interface TurnState {
  readonly phase: TurnPhase;
  readonly currentDiceValue: DiceValue | null;
  readonly mandatorySameDiceCaptureRequired: boolean;
  readonly rerollRequired: boolean;
}

export type MatchStatus = 'IDLE' | 'INITIALIZING' | 'ACTIVE' | 'MATCH_FINISHED';

export type FoundationGameStatus = 'IDLE' | 'PLAYING' | 'FINISHED';

/** UI turn lifecycle used by the foundation/Zustand turn controller. */
export type GameTurnPhase = 'ROLL' | 'MOVE' | 'CAPTURE' | 'WAIT_NEXT';

/** Pawn collections are keyed by player colour so an inactive player's pawns can be locked. */
export type PawnStatesByPlayer = Record<PlayerColor, ReadonlyArray<PawnState>>;

/** Sprint 1 foundation state contract. Canonical gameplay uses RuntimeGameState below. */
export interface GameState {
  readonly board: CellOncak[][];
  readonly pawns: PawnState[];
  readonly currentTurn: PlayerColor;
  readonly diceValue: number | null;
  readonly totalPlayers: PlayerCount;
  readonly activePlayerIndex: number;
  readonly activeDiceValue: DiceValue | null;
  readonly turnPhase: GameTurnPhase;
  readonly pawnStates: PawnStatesByPlayer;
  readonly capturedCount: Record<PlayerColor, number>;
  readonly gameStatus: FoundationGameStatus;
  readonly winner: PlayerColor | 'DRAW' | null;
}

export interface WinnerResult {
  readonly kind: 'WINNER';
  readonly winnerId: string;
}

export type DrawPlayerIds =
  | readonly [string, string]
  | readonly [string, string, string]
  | readonly [string, string, string, string];

export interface DrawResult {
  readonly kind: 'DRAW';
  readonly tiedPlayerIds: DrawPlayerIds;
}

export type MatchResult = WinnerResult | DrawResult;

/** Immutable canonical state consumed by future engine, store, and test layers. */
export interface RuntimeGameState {
  readonly gameMode: GameMode;
  readonly playerCount: PlayerCount;
  readonly board: IntersectionBoard;
  readonly players: ReadonlyArray<PlayerState>;
  readonly activePlayerIndex: number;
  readonly remainingOncak: number;
  readonly turn: TurnState;
  readonly legalOpportunities: ReadonlyArray<CaptureOpportunity>;
  readonly selectedCaptureGroup: CaptureGroup | null;
  readonly matchStatus: MatchStatus;
  readonly result: MatchResult | null;
}
