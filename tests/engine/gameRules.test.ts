import { describe, expect, it } from 'vitest';

import {
  CENTRAL_LOGO_COORDINATE,
  INITIAL_BLACK_ONCAK,
  INITIAL_ONCAK_COUNT,
  INITIAL_WHITE_ONCAK,
  INTERSECTION_COUNT,
  INTERSECTION_GRID_SIZE,
  MAX_MOVEMENT_SEGMENTS,
  VISUAL_CELL_GRID_SIZE,
} from '../../src/constants/gameRules';

describe('canonical game-rule constants', () => {
  it('separates the visual grid from the gameplay intersection layer', () => {
    expect(VISUAL_CELL_GRID_SIZE).toBe(10);
    expect(INTERSECTION_GRID_SIZE).toBe(11);
    expect(INTERSECTION_COUNT).toBe(121);
  });

  it('defines the locked initial Oncak distribution and central logo', () => {
    expect(INITIAL_ONCAK_COUNT).toBe(120);
    expect(INITIAL_BLACK_ONCAK + INITIAL_WHITE_ONCAK).toBe(INITIAL_ONCAK_COUNT);
    expect(CENTRAL_LOGO_COORDINATE).toEqual({ x: 5, y: 5 });
  });

  it('limits a capture route to three straight movement segments', () => {
    expect(MAX_MOVEMENT_SEGMENTS).toBe(3);
  });
});
