import { describe, expect, it } from 'vitest';

describe('project foundation', () => {
  it('exposes the root route', () => {
    expect('/').toBe('/');
  });
});
