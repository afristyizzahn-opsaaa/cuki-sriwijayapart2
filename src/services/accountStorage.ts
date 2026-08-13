import type { AccountSnapshot, PlayerAccount } from '../types/account';

export const ACCOUNT_STORAGE_KEY = 'cuki_sriwijaya_accounts_v1';
export const ACCOUNT_SCHEMA_VERSION = '1.0.0';

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadAccountSnapshot(
  storage: StorageAdapter | null = browserStorage(),
): AccountSnapshot | null {
  if (!storage) {
    return null;
  }

  try {
    const serialized = storage.getItem(ACCOUNT_STORAGE_KEY);
    if (serialized === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(serialized);
    return isAccountSnapshot(parsed) ? normalizeAccountSnapshot(parsed) : null;
  } catch {
    return null;
  }
}

export function saveAccountSnapshot(
  snapshot: AccountSnapshot,
  storage: StorageAdapter | null = browserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

function browserStorage(): StorageAdapter | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isAccountSnapshot(value: unknown): value is AccountSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === ACCOUNT_SCHEMA_VERSION &&
    typeof value.lastSavedAt === 'string' &&
    (typeof value.activeAccountId === 'string' || value.activeAccountId === null) &&
    Array.isArray(value.accounts) &&
    value.accounts.every(isPlayerAccount)
  );
}

function isPlayerAccount(value: unknown): value is PlayerAccount {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.displayName === 'string' &&
    typeof value.email === 'string' &&
    typeof value.password === 'string' &&
    typeof value.xp === 'number' &&
    typeof value.wins === 'number' &&
    typeof value.matchesPlayed === 'number' &&
    typeof value.createdAt === 'string' &&
    typeof value.lastLoginAt === 'string'
  );
}

function normalizeAccountSnapshot(snapshot: AccountSnapshot): AccountSnapshot {
  return {
    ...snapshot,
    accounts: snapshot.accounts.map((account) => ({
      ...account,
      nickname: account.nickname ?? account.displayName,
      username: account.username ?? account.displayName.toLowerCase().replace(/\s+/g, '_'),
      avatarId: account.avatarId ?? 'royal-1',
    })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
