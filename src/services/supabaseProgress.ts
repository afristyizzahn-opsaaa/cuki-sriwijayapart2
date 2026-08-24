import type { User } from '@supabase/supabase-js';

import type { PlayerAccount } from '../types/account';
import type { RuntimeGameState } from '../types/game';
import { supabase } from './supabaseClient';

const GAME_SESSION_STORAGE_KEY = 'cuki_sriwijaya_state_v1';
const STORAGE_SCHEMA_VERSION = '1.3.0';
const TREASURE_PROGRESS_KEY = 'cuki_sriwijaya_treasures_v1';
const TREASURE_PROGRESS_VERSION = 2;

type TreasureId = 'royal' | 'ocean' | 'knowledge' | 'harmony' | 'culture' | 'legacy';

interface TreasureProgress {
  readonly version: number;
  readonly completedArchiveIds: readonly TreasureId[];
  readonly visitedArchiveIds: readonly TreasureId[];
  readonly knowledgePoints: number;
}

interface ProfileRow {
  readonly id: string;
  readonly display_name: string;
  readonly phone_number: string | null;
  readonly nickname: string | null;
  readonly username: string | null;
  readonly avatar_id: string | null;
  readonly xp: number;
  readonly wins: number;
  readonly matches_played: number;
  readonly created_at: string;
  readonly last_login_at: string;
}

interface SavedGameRow {
  readonly game_state: RuntimeGameState;
}

interface TreasureProgressRow {
  readonly progress: TreasureProgress;
}

export interface SupabaseAuthProfile {
  readonly account: PlayerAccount;
  readonly restoredGameState: RuntimeGameState | null;
  readonly restoredTreasureProgress: TreasureProgress | null;
}

export async function getSupabaseAuthProfile(): Promise<SupabaseAuthProfile | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) {
    return null;
  }

  return loadSupabaseProfile(data.session.user);
}

export async function registerSupabaseAccount(input: {
  readonly displayName: string;
  readonly email: string;
  readonly password: string;
  readonly phoneNumber: string;
}): Promise<{ readonly profile: SupabaseAuthProfile | null; readonly needsEmailConfirmation: boolean }> {
  if (!supabase) {
    return { profile: null, needsEmailConfirmation: false };
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.displayName,
        nickname: input.displayName,
        username: normalizeProfileUsername(input.displayName),
        phone_number: input.phoneNumber,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.user || !data.session) {
    return { profile: null, needsEmailConfirmation: true };
  }

  await saveSupabasePhoneNumber(data.user.id, input.phoneNumber);

  return {
    profile: await loadSupabaseProfile(data.user, input.displayName),
    needsEmailConfirmation: false,
  };
}

export async function loginSupabaseAccount(input: {
  readonly email: string;
  readonly password: string;
}): Promise<SupabaseAuthProfile> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error('Akun tidak ditemukan.');
  }

  return loadSupabaseProfile(data.user);
}

export async function logoutSupabaseAccount(): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function saveSupabaseProfileProgress(account: PlayerAccount): Promise<void> {
  if (!supabase || account.id.startsWith('acct-')) {
    return;
  }

  const { error } = await supabase.from('profiles').upsert({
    id: account.id,
    display_name: account.displayName,
    nickname: account.nickname,
    username: account.username,
    avatar_id: account.avatarId,
    xp: account.xp,
    wins: account.wins,
    matches_played: account.matchesPlayed,
    last_login_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveSupabaseGameSession(gameState: RuntimeGameState): Promise<void> {
  if (!supabase) {
    return;
  }

  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const { error } = await supabase.from('saved_games').upsert({
    user_id: user.id,
    game_state: gameState,
    last_saved_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearSupabaseGameSession(): Promise<void> {
  if (!supabase) {
    return;
  }

  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const { error } = await supabase.from('saved_games').delete().eq('user_id', user.id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function saveSupabaseTreasureProgress(progress: TreasureProgress): Promise<void> {
  if (!supabase) {
    return;
  }

  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const { error } = await supabase.from('treasure_progress').upsert({
    user_id: user.id,
    progress,
    last_saved_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function loadSupabaseProfile(user: User, displayName?: string): Promise<SupabaseAuthProfile> {
  const profile = await ensureProfile(user, displayName);
  if (user.user_metadata?.phone_number) {
    await saveSupabasePhoneNumber(user.id, String(user.user_metadata.phone_number));
  }
  const [restoredGameState, restoredTreasureProgress] = await Promise.all([
    loadRemoteGameState(user.id),
    loadRemoteTreasureProgress(user.id),
  ]);

  storeRemoteProgressLocally(restoredGameState, restoredTreasureProgress);

  return {
    account: accountFromProfile(user, profile),
    restoredGameState,
    restoredTreasureProgress,
  };
}

async function saveSupabasePhoneNumber(userId: string, phoneNumber: string): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      phone_number: phoneNumber,
    })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function ensureProfile(user: User, displayName?: string): Promise<ProfileRow> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, phone_number, nickname, username, avatar_id, xp, wins, matches_played, created_at, last_login_at')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(error.message);
  }
  if (data) {
    return data;
  }

  const now = new Date().toISOString();
  const fallbackDisplayName =
    displayName ?? getUserDisplayName(user) ?? user.email?.split('@')[0] ?? 'Pemain CUKI';
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      display_name: fallbackDisplayName,
      phone_number: user.user_metadata?.phone_number ?? null,
      nickname: fallbackDisplayName,
      username: normalizeProfileUsername(fallbackDisplayName),
      avatar_id: 'royal-1',
      xp: 0,
      wins: 0,
      matches_played: 0,
      created_at: now,
      last_login_at: now,
    })
    .select('id, display_name, phone_number, nickname, username, avatar_id, xp, wins, matches_played, created_at, last_login_at')
    .single<ProfileRow>();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return inserted;
}

async function loadRemoteGameState(userId: string): Promise<RuntimeGameState | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('saved_games')
    .select('game_state')
    .eq('user_id', userId)
    .maybeSingle<SavedGameRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.game_state ?? null;
}

async function loadRemoteTreasureProgress(userId: string): Promise<TreasureProgress | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('treasure_progress')
    .select('progress')
    .eq('user_id', userId)
    .maybeSingle<TreasureProgressRow>();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeTreasureProgress(data?.progress ?? null);
}

async function getCurrentUser(): Promise<User | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }

  return data.user;
}

function accountFromProfile(user: User, profile: ProfileRow): PlayerAccount {
  return {
    id: user.id,
    displayName: profile.display_name,
    nickname: profile.nickname ?? profile.display_name,
    username: profile.username ?? normalizeProfileUsername(profile.display_name),
    avatarId: profile.avatar_id ?? 'royal-1',
    email: user.email ?? '',
    password: '',
    xp: profile.xp,
    wins: profile.wins,
    matchesPlayed: profile.matches_played,
    createdAt: profile.created_at,
    lastLoginAt: profile.last_login_at,
  };
}

function normalizeProfileUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_ ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getUserDisplayName(user: User): string | null {
  const value = user.user_metadata.display_name;
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function storeRemoteProgressLocally(
  gameState: RuntimeGameState | null,
  treasureProgress: TreasureProgress | null,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (gameState) {
      window.localStorage.setItem(
        GAME_SESSION_STORAGE_KEY,
        JSON.stringify({
          version: STORAGE_SCHEMA_VERSION,
          lastSavedAt: new Date().toISOString(),
          gameState,
        }),
      );
    }
    if (treasureProgress) {
      window.localStorage.setItem(TREASURE_PROGRESS_KEY, JSON.stringify(treasureProgress));
    }
  } catch {
    // Local hydration should never block a valid Supabase login.
  }
}

function normalizeTreasureProgress(value: TreasureProgress | null): TreasureProgress | null {
  if (!value) {
    return null;
  }

  return {
    version: TREASURE_PROGRESS_VERSION,
    completedArchiveIds: value.completedArchiveIds,
    visitedArchiveIds: value.visitedArchiveIds,
    knowledgePoints: value.knowledgePoints,
  };
}
