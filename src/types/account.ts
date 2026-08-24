export interface PlayerAccount {
  readonly id: string;
  readonly displayName: string;
  readonly nickname: string;
  readonly username: string;
  readonly avatarId: string;
  readonly email: string;
  readonly password: string;
  readonly xp: number;
  readonly wins: number;
  readonly matchesPlayed: number;
  readonly createdAt: string;
  readonly lastLoginAt: string;
}

export interface AccountSnapshot {
  readonly version: string;
  readonly lastSavedAt: string;
  readonly activeAccountId: string | null;
  readonly accounts: ReadonlyArray<PlayerAccount>;
}

export interface AuthFormInput {
  readonly displayName: string;
  readonly email: string;
  readonly password: string;
  readonly phoneNumber: string;
}

export interface AuthResult {
  readonly ok: boolean;
  readonly message: string;
  readonly requiresEmailConfirmation?: boolean;
}
