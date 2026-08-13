import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Sparkles, ShieldCheck, UserCircle2, BadgeCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { KingdomShell } from '../components/layout/KingdomShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAccountStore } from '../stores/useAccountStore';
import {
  finalAchievement,
  loadTreasureProgress,
  treasureCollections,
} from './treasureData';

interface AvatarOption {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly className: string;
}

const AVATAR_OPTIONS: readonly AvatarOption[] = [
  { id: 'royal-1', label: 'Royal Crown', icon: Crown, className: 'from-amber-500 to-yellow-200' },
  {
    id: 'royal-2',
    label: 'Sriwijaya Spark',
    icon: Sparkles,
    className: 'from-amber-400 to-orange-200',
  },
  {
    id: 'royal-3',
    label: 'Guardian Shield',
    icon: ShieldCheck,
    className: 'from-stone-400 to-amber-200',
  },
  {
    id: 'royal-4',
    label: 'Profile Seal',
    icon: UserCircle2,
    className: 'from-yellow-400 to-amber-100',
  },
] as const;

export function ProfilePage(): JSX.Element {
  const activeAccount = useAccountStore((state) => state.activeAccount);
  const updateProfile = useAccountStore((state) => state.updateProfile);
  const treasureProgress = useMemo(() => loadTreasureProgress(), []);
  const [nickname, setNickname] = useState(activeAccount?.nickname ?? activeAccount?.displayName ?? '');
  const [username, setUsername] = useState(activeAccount?.username ?? '');
  const [avatarId, setAvatarId] = useState(activeAccount?.avatarId ?? 'royal-1');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const unlockedCount = treasureProgress.completedArchiveIds.length;
  const totalBadges = treasureCollections.length + 1;
  const hasFinalBadge = unlockedCount === treasureCollections.length;

  if (!activeAccount) {
    return (
      <KingdomShell eyebrow="Royal Profile" title="Profile">
        <Card className="max-w-2xl border border-primary-gold/25" variant="mahogany">
          <p className="text-sm text-surface-parchment/80">
            Kamu belum login. Silakan login dulu supaya profil dan Badge Vault bisa disimpan.
          </p>
          <div className="mt-5">
            <Button asChild>
              <a href="/auth?mode=login">Login</a>
            </Button>
          </div>
        </Card>
      </KingdomShell>
    );
  }

  const selectedAvatar =
    AVATAR_OPTIONS.find((option) => option.id === avatarId) ?? AVATAR_OPTIONS[0];
  const AvatarIcon = selectedAvatar.icon;

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      await updateProfile({ nickname, username, avatarId });
      setFeedback('Profil tersimpan. Badge Vault tetap mengikuti progress login akun ini.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KingdomShell eyebrow="Royal Profile" title="Profile">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border border-primary-gold/25" variant="mahogany">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">Profile</p>
          <div className="mt-5 flex items-center gap-4">
            <div
              className={`grid h-24 w-24 place-items-center rounded-full border border-primary-gold/35 bg-gradient-to-br ${selectedAvatar.className} text-text-dark shadow-[0_0_32px_rgba(212,175,55,0.22)]`}
            >
              <AvatarIcon className="h-11 w-11" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Kingdom Identity</p>
              <h2 className="mt-1 font-display text-3xl text-primary-gold">{nickname || activeAccount.displayName}</h2>
              <p className="mt-2 text-sm text-surface-parchment/75">@{username || activeAccount.username}</p>
              <p className="mt-1 text-sm text-surface-parchment/75">
                {activeAccount.email || 'Akun login tersambung'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm">
              Nickname
              <input
                className="min-h-11 rounded-button border border-primary-gold/30 bg-bg-dark-slate px-4 text-text-light outline-none ring-0 placeholder:text-text-muted focus:border-primary-amber"
                placeholder="Tulis nickname kamu"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Username
              <input
                className="min-h-11 rounded-button border border-primary-gold/30 bg-bg-dark-slate px-4 text-text-light outline-none ring-0 placeholder:text-text-muted focus:border-primary-amber"
                placeholder="username_kerajaan"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">
              Pilihan PP
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {AVATAR_OPTIONS.map((option) => {
                const isSelected = option.id === avatarId;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    className={`rounded-card border p-4 text-left transition ${
                      isSelected
                        ? 'border-primary-gold bg-primary-gold/10 shadow-[0_0_24px_rgba(212,175,55,0.16)]'
                        : 'border-primary-gold/20 bg-bg-dark-slate/50 hover:border-primary-gold/40'
                    }`}
                    type="button"
                    onClick={() => setAvatarId(option.id)}
                  >
                    <div
                      className={`grid h-14 w-14 place-items-center rounded-full border border-primary-gold/25 bg-gradient-to-br ${option.className} text-text-dark`}
                    >
                      <Icon className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <p className="mt-3 font-semibold text-surface-parchment">{option.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-text-muted">
                      {isSelected ? 'Selected' : 'Choose this avatar'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={isSaving} onClick={() => void handleSave()}>
              {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
            </Button>
            <Button asChild variant="secondary">
              <Link to="/treasures">Lihat Treasures</Link>
            </Button>
          </div>
          {feedback ? <p className="mt-4 text-sm text-primary-amber">{feedback}</p> : null}
        </Card>

        <div className="grid gap-6">
          <Card className="border border-primary-gold/25" variant="mahogany">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary-amber">
              Badge Vault
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl text-primary-gold">Achievement Collection</h3>
                <p className="mt-2 text-sm text-surface-parchment/75">
                  {unlockedCount} / {totalBadges} badge tersimpan di profil akun ini.
                </p>
              </div>
              <BadgeCheck className="h-10 w-10 text-primary-gold" aria-hidden="true" />
            </div>
            <div className="mt-5 grid gap-3">
              {treasureCollections.map((treasure) => {
                const isUnlocked = treasureProgress.completedArchiveIds.includes(treasure.id);
                const Icon = treasure.icon;
                return (
                  <div
                    key={treasure.id}
                    className={`rounded-2xl border p-4 ${
                      isUnlocked
                        ? 'border-primary-gold/45 bg-primary-gold/10'
                        : 'border-primary-gold/15 bg-bg-dark-slate/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border ${
                          isUnlocked
                            ? 'border-primary-gold bg-primary-gold text-text-dark'
                            : 'border-primary-gold/20 bg-black/20 text-text-muted'
                        }`}
                      >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-surface-parchment">{treasure.achievement}</p>
                        <p className="mt-1 text-xs leading-5 text-text-muted">
                          {isUnlocked
                            ? treasure.achievementDescription
                            : 'Terkunci sampai archive selesai dibuka.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="rounded-2xl border border-primary-gold/15 bg-bg-dark-slate/50 p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border ${
                      hasFinalBadge
                        ? 'border-primary-gold bg-primary-gold text-text-dark'
                        : 'border-primary-gold/20 bg-black/20 text-text-muted'
                    }`}
                  >
                    <BadgeCheck className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-parchment">{finalAchievement.title}</p>
                    <p className="mt-1 text-xs leading-5 text-text-muted">
                      {hasFinalBadge
                        ? finalAchievement.description
                        : 'Selesaikan seluruh archive untuk membuka badge terakhir.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </KingdomShell>
  );
}
