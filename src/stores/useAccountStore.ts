import { create } from 'zustand';

import { loadAccountSnapshot, saveAccountSnapshot } from '../services/accountStorage';
import { isSupabaseConfigured } from '../services/supabaseClient';
import {
  getSupabaseAuthProfile,
  loginSupabaseAccount,
  logoutSupabaseAccount,
  registerSupabaseAccount,
  saveSupabaseProfileProgress,
} from '../services/supabaseProgress';
import type { AuthFormInput, AuthResult, PlayerAccount } from '../types/account';
import type { MatchResult, PlayerState, RuntimeGameState } from '../types/game';

type AuthProvider = 'local' | 'supabase';

interface AccountStoreState {
  readonly accounts: ReadonlyArray<PlayerAccount>;
  readonly activeAccountId: string | null;
  readonly activeAccount: PlayerAccount | null;
  readonly authProvider: AuthProvider;
  readonly isAuthLoading: boolean;
  initializeAuthSession: () => Promise<void>;
  registerAccount: (input: AuthFormInput) => Promise<AuthResult>;
  loginAccount: (input: { readonly email: string; readonly password: string }) => Promise<AuthResult>;
  logoutAccount: () => Promise<void>;
  awardMatchProgress: (gameState: RuntimeGameState, result: MatchResult | null) => void;
  updateProfile: (input: { nickname: string; username: string; avatarId: string }) => Promise<void>;
}

const authProvider: AuthProvider = isSupabaseConfigured() ? 'supabase' : 'local';

const emptyAccountState = {
  accounts: [],
  activeAccountId: null,
  activeAccount: null,
  authProvider,
  isAuthLoading: authProvider === 'supabase',
} as const;

export const useAccountStore = create<AccountStoreState>((set, get) => ({
  ...initialAccountState(),

  initializeAuthSession: async () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    set({ isAuthLoading: true });
    try {
      const profile = await getSupabaseAuthProfile();
      if (!profile) {
        set({
          accounts: [],
          activeAccountId: null,
          activeAccount: null,
          isAuthLoading: false,
        });
        return;
      }
      persistAccounts([profile.account], profile.account.id, set);
    } catch {
      set({
        accounts: [],
        activeAccountId: null,
        activeAccount: null,
      });
    } finally {
      set({ isAuthLoading: false });
    }
  },

  registerAccount: async (input) => {
    const validation = validateRegistrationInput(input);
    if (!validation.ok) {
      return validation;
    }

    if (isSupabaseConfigured()) {
      set({ isAuthLoading: true });
      try {
        const result = await registerSupabaseAccount({
          displayName: input.displayName.trim(),
          email: normalizeEmail(input.email),
          password: input.password.trim(),
          phoneNumber: input.phoneNumber.trim(),
        });

        if (result.needsEmailConfirmation) {
          return {
            ok: true,
            message: 'Akun berhasil dibuat. Cek email untuk konfirmasi sebelum login.',
            requiresEmailConfirmation: true,
          };
        }

        if (result.profile) {
          persistAccounts([result.profile.account], result.profile.account.id, set);
        }

        return { ok: true, message: 'Akun berhasil dibuat dan tersambung ke Supabase.' };
      } catch (error) {
        return { ok: false, message: toAuthMessage(error) };
      } finally {
        set({ isAuthLoading: false });
      }
    }

    return registerLocalAccount(input, get, set);
  },

  loginAccount: async (input) => {
    const email = normalizeEmail(input.email);
    const password = input.password.trim();

    if (!isLikelyEmail(email)) {
      return { ok: false, message: 'Email belum valid.' };
    }
    if (password.length < 4) {
      return { ok: false, message: 'Password minimal 4 karakter.' };
    }

    if (isSupabaseConfigured()) {
      set({ isAuthLoading: true });
      try {
        const profile = await loginSupabaseAccount({ email, password });
        persistAccounts([profile.account], profile.account.id, set);
        return { ok: true, message: `Selamat datang kembali, ${profile.account.displayName}.` };
      } catch (error) {
        return { ok: false, message: toAuthMessage(error) };
      } finally {
        set({ isAuthLoading: false });
      }
    }

    return loginLocalAccount({ email, password }, get, set);
  },

  logoutAccount: async () => {
    if (isSupabaseConfigured()) {
      set({ isAuthLoading: true });
      try {
        await logoutSupabaseAccount();
      } finally {
        set({ isAuthLoading: false });
      }
    }

    const current = loadAccountSnapshot();
    const accounts = current?.accounts ?? get().accounts;
    saveAccountSnapshot({
      version: '1.0.0',
      lastSavedAt: new Date().toISOString(),
      activeAccountId: null,
      accounts,
    });
    set({
      accounts,
      activeAccountId: null,
      activeAccount: null,
    });
  },

  awardMatchProgress: (gameState, result) => {
    const activeAccount = get().activeAccount;
    if (!activeAccount || gameState.matchStatus !== 'MATCH_FINISHED') {
      return;
    }

    const winnerName = getWinnerName(gameState, result);
    const didWin =
      winnerName !== null &&
      winnerName.trim().toLowerCase() === activeAccount.displayName.trim().toLowerCase();
    const updatedAccount: PlayerAccount = {
      ...activeAccount,
      xp: activeAccount.xp + 25 + (didWin ? 25 : 0),
      wins: activeAccount.wins + (didWin ? 1 : 0),
      matchesPlayed: activeAccount.matchesPlayed + 1,
      lastLoginAt: new Date().toISOString(),
    };
    const nextAccounts = get().accounts.map((item) =>
      item.id === activeAccount.id ? updatedAccount : item,
    );
    persistAccounts(nextAccounts, activeAccount.id, set);
    void saveSupabaseProfileProgress(updatedAccount).catch(() => {
      // Match rewards stay available locally if cloud sync is temporarily offline.
    });
  },

  updateProfile: async (input) => {
    const activeAccount = get().activeAccount;
    if (!activeAccount) {
      return;
    }

    const updatedAccount: PlayerAccount = {
      ...activeAccount,
      nickname: input.nickname.trim() || activeAccount.displayName,
      username: normalizeUsername(input.username) || normalizeUsername(activeAccount.displayName),
      avatarId: input.avatarId,
    };

    const nextAccounts = get().accounts.map((item) =>
      item.id === activeAccount.id ? updatedAccount : item,
    );
    persistAccounts(nextAccounts, activeAccount.id, set);
    void saveSupabaseProfileProgress(updatedAccount).catch(() => {
      // Keep local profile edits available when the network is unavailable.
    });
  },
}));

function initialAccountState():
  | typeof emptyAccountState
  | {
      readonly accounts: ReadonlyArray<PlayerAccount>;
      readonly activeAccountId: string | null;
      readonly activeAccount: PlayerAccount | null;
      readonly authProvider: AuthProvider;
      readonly isAuthLoading: boolean;
    } {
  if (isSupabaseConfigured()) {
    return emptyAccountState;
  }

  const snapshot = loadAccountSnapshot();
  if (!snapshot) {
    return emptyAccountState;
  }

  return {
    accounts: snapshot.accounts,
    activeAccountId: snapshot.activeAccountId,
    activeAccount: snapshot.accounts.find((account) => account.id === snapshot.activeAccountId) ?? null,
    authProvider,
    isAuthLoading: false,
  };
}

function persistAccounts(
  accounts: ReadonlyArray<PlayerAccount>,
  activeAccountId: string | null,
  set: (partial: Partial<AccountStoreState>) => void,
): void {
  saveAccountSnapshot({
    version: '1.0.0',
    lastSavedAt: new Date().toISOString(),
    activeAccountId,
    accounts,
  });

  set({
    accounts,
    activeAccountId,
    activeAccount: accounts.find((account) => account.id === activeAccountId) ?? null,
  });
}

function registerLocalAccount(
  input: AuthFormInput,
  get: () => AccountStoreState,
  set: (partial: Partial<AccountStoreState>) => void,
): AuthResult {
  const validation = validateRegistrationInput(input);
  if (!validation.ok) {
    return validation;
  }

  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();
  const password = input.password.trim();

  if (get().accounts.some((account) => account.email.toLowerCase() === email)) {
    return { ok: false, message: 'Email sudah terdaftar. Silakan login.' };
  }

  const now = new Date().toISOString();
  const account: PlayerAccount = {
    id: makeAccountId(),
    displayName,
    nickname: displayName,
    username: normalizeUsername(displayName),
    avatarId: 'royal-1',
    email,
    password,
    xp: 0,
    wins: 0,
    matchesPlayed: 0,
    createdAt: now,
    lastLoginAt: now,
  };

  persistAccounts([...get().accounts, account], account.id, set);
  return { ok: true, message: 'Akun berhasil dibuat.' };
}

function loginLocalAccount(
  input: { readonly email: string; readonly password: string },
  get: () => AccountStoreState,
  set: (partial: Partial<AccountStoreState>) => void,
): AuthResult {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const account = get().accounts.find(
    (item) => item.email.toLowerCase() === email && item.password === password,
  );

  if (!account) {
    return { ok: false, message: 'Email atau password salah.' };
  }

  const updatedAccount = { ...account, lastLoginAt: new Date().toISOString() };
  const nextAccounts = get().accounts.map((item) => (item.id === account.id ? updatedAccount : item));
  persistAccounts(nextAccounts, account.id, set);
  return { ok: true, message: `Selamat datang kembali, ${updatedAccount.displayName}.` };
}

function validateRegistrationInput(input: AuthFormInput): AuthResult {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();
  const password = input.password.trim();

  if (displayName.length < 2) {
    return { ok: false, message: 'Nama akun minimal 2 karakter.' };
  }
  if (!isLikelyEmail(email)) {
    return { ok: false, message: 'Email belum valid.' };
  }
  if (password.length < 4) {
    return { ok: false, message: 'Password minimal 4 karakter.' };
  }
  if (!input.phoneNumber.trim()) {
    return { ok: false, message: 'Nomor HP wajib diisi.' };
  }
  if (!/^08\d{8,13}$/.test(input.phoneNumber.trim())) {
    return { ok: false, message: 'Nomor HP tidak valid. Gunakan format 08xxxxxxxxxx.' };
  }

  return { ok: true, message: 'Valid.' };
}

function getWinnerName(gameState: RuntimeGameState, result: MatchResult | null): string | null {
  if (result?.kind !== 'WINNER') {
    return null;
  }
  return gameState.players.find((player: PlayerState) => player.id === result.winnerId)?.name ?? null;
}

function makeAccountId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `acct-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_ ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function isLikelyEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toAuthMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Autentikasi gagal. Coba lagi.';
}
