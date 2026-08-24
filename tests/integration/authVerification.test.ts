import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlayerAccount } from '../../src/types/account';

const mocks = vi.hoisted(() => ({
  getSupabaseAuthProfile: vi.fn(),
  loadAccountSnapshot: vi.fn(),
  loginSupabaseAccount: vi.fn(),
  logoutSupabaseAccount: vi.fn(),
  registerSupabaseAccount: vi.fn(),
  saveAccountSnapshot: vi.fn(),
  saveSupabaseProfileProgress: vi.fn(),
}));

vi.mock('../../src/services/accountStorage', () => ({
  loadAccountSnapshot: mocks.loadAccountSnapshot,
  saveAccountSnapshot: mocks.saveAccountSnapshot,
}));

vi.mock('../../src/services/supabaseClient', () => ({
  isSupabaseConfigured: () => true,
}));

vi.mock('../../src/services/supabaseProgress', () => ({
  getSupabaseAuthProfile: mocks.getSupabaseAuthProfile,
  loginSupabaseAccount: mocks.loginSupabaseAccount,
  logoutSupabaseAccount: mocks.logoutSupabaseAccount,
  registerSupabaseAccount: mocks.registerSupabaseAccount,
  saveSupabaseProfileProgress: mocks.saveSupabaseProfileProgress,
}));

import { useAccountStore } from '../../src/stores/useAccountStore';

describe('Supabase signup verification', () => {
  beforeEach(() => {
    mocks.getSupabaseAuthProfile.mockReset();
    mocks.loadAccountSnapshot.mockReset();
    mocks.loginSupabaseAccount.mockReset();
    mocks.logoutSupabaseAccount.mockReset();
    mocks.registerSupabaseAccount.mockReset();
    mocks.saveAccountSnapshot.mockReset();
    mocks.saveSupabaseProfileProgress.mockReset();

    useAccountStore.setState({
      accounts: [makeAccount()],
      activeAccountId: 'acct-stale',
      activeAccount: makeAccount(),
      isAuthLoading: false,
    });
  });

  it('clears active auth state when signup returns session === null', async () => {
    mocks.registerSupabaseAccount.mockResolvedValue({
      profile: null,
      needsEmailConfirmation: true,
    });

    const result = await useAccountStore.getState().registerAccount({
      displayName: 'Sultan Palembang',
      email: 'baru@example.com',
      password: 'rahasia123',
      phoneNumber: '081234567890',
    });

    expect(result).toMatchObject({
      ok: true,
      requiresEmailConfirmation: true,
    });
    expect(useAccountStore.getState().activeAccount).toBeNull();
    expect(useAccountStore.getState().activeAccountId).toBeNull();
    expect(mocks.saveAccountSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        activeAccountId: null,
        accounts: expect.arrayContaining([
          expect.objectContaining({
            displayName: 'Akun Lama',
          }),
        ]),
      }),
    );
  });
});

function makeAccount(): PlayerAccount {
  return {
    id: 'acct-stale',
    displayName: 'Akun Lama',
    nickname: 'Akun Lama',
    username: 'akun_lama',
    avatarId: 'royal-1',
    email: 'lama@example.com',
    password: 'secret',
    xp: 120,
    wins: 4,
    matchesPlayed: 9,
    createdAt: '2026-08-24T00:00:00.000Z',
    lastLoginAt: '2026-08-24T00:00:00.000Z',
  };
}
