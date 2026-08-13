import { describe, expect, it } from 'vitest';

import {
  completeArchive,
  emptyTreasureProgress,
  getArchiveProgressCount,
  getProfileLevel,
  treasureCollections,
} from '../../src/pages/treasureData';

describe('treasure archive progress', () => {
  it('awards XP and progress once when an archive challenge is completed', () => {
    const harmony = treasureCollections.find((treasure) => treasure.id === 'harmony');
    expect(harmony).toBeDefined();
    if (!harmony) {
      return;
    }
    expect(harmony.quizQuestion).toBe('Apa faktor utama penyebaran Islam di Nusantara?');

    const completed = completeArchive(emptyTreasureProgress, 'harmony');
    expect(completed.knowledgePoints).toBe(100);
    expect(completed.completedArchiveIds).toEqual(['harmony']);
    expect(getArchiveProgressCount(harmony, completed)).toBe(4);

    const replayed = completeArchive(completed, 'harmony');
    expect(replayed.knowledgePoints).toBe(100);
    expect(replayed.completedArchiveIds).toEqual(['harmony']);
  });

  it('unlocks the Heritage Guardian level after every collection is completed', () => {
    const completed = treasureCollections.reduce(
      (progress, treasure) => completeArchive(progress, treasure.id),
      emptyTreasureProgress,
    );

    expect(completed.completedArchiveIds).toHaveLength(6);
    expect(completed.knowledgePoints).toBe(600);
    expect(getProfileLevel(completed)).toBe('Heritage Guardian');
  });
});
