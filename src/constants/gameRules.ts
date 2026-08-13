import type { DiceValue, IntersectionCoordinate } from '../types/game';

/** Visual-only cell grid dimension; gameplay uses the intersection layer below. */
export const VISUAL_CELL_GRID_SIZE = 10;
export const INTERSECTION_GRID_SIZE = 11;
export const INTERSECTION_COUNT = 121;
export const INITIAL_ONCAK_COUNT = 120;
export const INITIAL_BLACK_ONCAK = 60;
export const INITIAL_WHITE_ONCAK = 60;
export const CENTRAL_LOGO_COORDINATE: Readonly<IntersectionCoordinate> = { x: 5, y: 5 };
export const MIN_DICE_VALUE: DiceValue = 1;
export const MAX_DICE_VALUE: DiceValue = 6;
export const MAX_MOVEMENT_SEGMENTS = 3;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const MAX_CONSECUTIVE_SAME_COLOR_ONCAK = 6;
