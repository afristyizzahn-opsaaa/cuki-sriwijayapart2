import { Anchor, Crown, Dice5, Landmark, MoonStar, ScrollText, Theater } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { saveSupabaseTreasureProgress } from '../services/supabaseProgress';

export const TREASURE_PROGRESS_KEY = 'cuki_sriwijaya_treasures_v1';
export const TREASURE_PROGRESS_VERSION = 2;

export type TreasureId = 'royal' | 'ocean' | 'knowledge' | 'harmony' | 'culture' | 'legacy';

export interface QuizOption {
  readonly id: string;
  readonly label: string;
  readonly isCorrect: boolean;
}

export interface TreasureCollection {
  readonly id: TreasureId;
  readonly title: string;
  readonly subtitle: string;
  readonly theme: string;
  readonly content: readonly string[];
  readonly achievement: string;
  readonly achievementDescription: string;
  readonly description: string;
  readonly story: readonly string[];
  readonly facts: readonly string[];
  readonly quizQuestion: string;
  readonly quizOptions: readonly QuizOption[];
  readonly rewardXp: number;
  readonly baseProgress: number;
  readonly totalProgress: number;
  readonly icon: LucideIcon;
}

export interface TreasureProgress {
  readonly version: number;
  readonly completedArchiveIds: readonly TreasureId[];
  readonly visitedArchiveIds: readonly TreasureId[];
  readonly knowledgePoints: number;
}

export const treasureCollections: readonly TreasureCollection[] = [
  {
    id: 'royal',
    title: 'Koleksi Kesultanan',
    subtitle: 'Simbol Kadatuan',
    theme: 'WARISAN KESULTANAN PALEMBANG DARUSSALAM',
    content: ['Kadatuan Sriwijaya', 'Simbol kerajaan', 'Artefak sejarah'],
    achievement: 'Koleksi Kesultanan',
    achievementDescription: 'Jelajahi arsip warisan kesultanan.',
    description:
      'Jelajahi koleksi pusaka, simbol kesultanan, artefak istana, dan peninggalan yang merekam jejak Kesultanan Palembang Darussalam.',
    story: [
      'Kadatuan Sriwijaya dikenal sebagai pusat kekuasaan maritim yang menghubungkan sungai, pelabuhan, dan jalur niaga besar di Nusantara.',
      'Simbol kerajaan, benda upacara, dan peninggalan istana membantu kita membayangkan bagaimana wibawa Sriwijaya dibangun melalui perdagangan, diplomasi, dan ilmu pengetahuan.',
    ],
    facts: [
      'Kadatuan berpusat di wilayah Palembang',
      'Kekuasaan Sriwijaya ditopang jalur sungai dan laut',
      'Artefak menjadi penanda budaya istana',
    ],
    quizQuestion: 'Apa yang paling memperkuat posisi Kadatuan Sriwijaya sebagai kerajaan maritim?',
    quizOptions: [
      { id: 'a', label: 'Jalur sungai, pelabuhan, dan perdagangan laut', isCorrect: true },
      { id: 'b', label: 'Pengasingan dari jalur niaga', isCorrect: false },
      { id: 'c', label: 'Tidak adanya interaksi budaya', isCorrect: false },
      { id: 'd', label: 'Wilayah yang tertutup dari pedagang', isCorrect: false },
    ],
    rewardXp: 100,
    baseProgress: 3,
    totalProgress: 8,
    icon: Crown,
  },
  {
    id: 'ocean',
    title: 'Jejak Sungai Musi',
    subtitle: 'Jalur Sungai dan Pelabuhan',
    theme: 'JALUR PERDAGANGAN PALEMBANG',
    content: ['Maritime trade routes', 'Ships', 'Ports', 'Connection with international traders'],
    achievement: 'Jejak Sungai Musi',
    achievementDescription: 'Selesaikan arsip jalur perdagangan.',
    description:
      'Telusuri Sungai Musi, pelabuhan, jalur perdagangan, dan hubungan antardaerah yang membentuk kehidupan Kesultanan Palembang Darussalam.',
    story: [
      'Sriwijaya tumbuh melalui kekuatan laut. Kapal, pelabuhan, dan penguasaan jalur perdagangan menjadikan kerajaan ini tempat singgah berbagai bangsa.',
      'Dari Selat Malaka sampai pesisir Sumatra, arus dagang membawa barang, bahasa, teknologi, dan gagasan yang membentuk wajah Nusantara.',
    ],
    facts: [
      'Selat Malaka adalah jalur niaga penting',
      'Pelabuhan menjadi ruang pertemuan bangsa',
      'Kapal dagang membawa barang dan pengetahuan',
    ],
    quizQuestion: 'Mengapa jalur laut penting bagi kejayaan Sriwijaya?',
    quizOptions: [
      { id: 'a', label: 'Karena menghubungkan perdagangan dan pertukaran budaya', isCorrect: true },
      { id: 'b', label: 'Karena memutus hubungan dengan pedagang asing', isCorrect: false },
      { id: 'c', label: 'Karena membuat pelabuhan tidak diperlukan', isCorrect: false },
      { id: 'd', label: 'Karena hanya dipakai untuk perang darat', isCorrect: false },
    ],
    rewardXp: 100,
    baseProgress: 3,
    totalProgress: 8,
    icon: Anchor,
  },
  {
    id: 'knowledge',
    title: 'Pengetahuan Tersembunyi',
    subtitle: 'Naskah dan Bukti Sejarah',
    theme: 'PENELUSURAN SEJARAH',
    content: ['Fakta sejarah', 'Bukti arkeologis', 'Kisah tersembunyi'],
    achievement: 'Pengetahuan Tersembunyi',
    achievementDescription: 'Temukan bukti sejarah.',
    description:
      'Buka naskah, catatan, artefak, dan kisah sejarah untuk menelusuri pengetahuan yang tersimpan dari masa Kesultanan Palembang Darussalam.',
    story: [
      'Banyak kisah Sriwijaya ditemukan melalui prasasti, catatan perjalanan, dan penelitian arkeologis. Setiap bukti adalah potongan memori kerajaan.',
      'Pengetahuan yang tersembunyi ini membuat sejarah terasa seperti teka-teki: semakin banyak arsip dibuka, semakin jelas bentuk peradabannya.',
    ],
    facts: [
      'Prasasti membantu melacak sejarah kerajaan',
      'Arkeologi membaca jejak benda dan tempat',
      'Catatan asing memperluas sudut pandang sejarah',
    ],
    quizQuestion: 'Apa fungsi utama prasasti dalam mempelajari Sriwijaya?',
    quizOptions: [
      { id: 'a', label: 'Menjadi bukti tertulis tentang peristiwa dan kekuasaan', isCorrect: true },
      { id: 'b', label: 'Menggantikan semua tradisi lisan', isCorrect: false },
      { id: 'c', label: 'Menghapus kebutuhan penelitian', isCorrect: false },
      { id: 'd', label: 'Membuktikan Sriwijaya tidak memiliki budaya', isCorrect: false },
    ],
    rewardXp: 100,
    baseProgress: 3,
    totalProgress: 8,
    icon: ScrollText,
  },
  {
    id: 'harmony',
    title: 'Harmoni Nusantara',
    subtitle: 'Jejak Akulturasi Nusantara',
    theme: 'INTERAKSI ISLAM NUSANTARA',
    content: [
      'Muslim traders entering Nusantara',
      'Trade route cultural exchange',
      'Development of Islamic influence in Malay regions',
      'Cultural acculturation between local traditions and Islam',
    ],
    achievement: 'Harmoni Nusantara',
    achievementDescription: 'Selesaikan arsip interaksi Islam Nusantara.',
    description:
      'Pelajari hubungan perdagangan, penyebaran Islam, perjumpaan budaya, dan interaksi masyarakat Palembang dengan berbagai wilayah Nusantara.',
    story: [
      'Perdagangan di jalur pelabuhan mempertemukan masyarakat Palembang dengan berbagai pedagang dan membawa pertukaran budaya, ilmu pengetahuan, dan tradisi.',
      'Melalui pelabuhan dan jalur niaga, pengaruh Islam berkembang perlahan di wilayah Melayu tanpa menghapus seluruh tradisi lokal. Dari pertemuan itu lahir akulturasi Nusantara.',
    ],
    facts: [
      'Jalur perdagangan Selat Malaka',
      'Interaksi pedagang Muslim',
      'Perkembangan budaya Melayu-Islam',
      'Akulturasi tradisi lokal dan Islam',
    ],
    quizQuestion: 'Apa faktor utama penyebaran Islam di Nusantara?',
    quizOptions: [
      { id: 'a', label: 'Penaklukan wilayah', isCorrect: false },
      { id: 'b', label: 'Jalur perdagangan', isCorrect: true },
      { id: 'c', label: 'Perang kerajaan', isCorrect: false },
      { id: 'd', label: 'Pergantian pemerintahan', isCorrect: false },
    ],
    rewardXp: 100,
    baseProgress: 3,
    totalProgress: 8,
    icon: MoonStar,
  },
  {
    id: 'culture',
    title: 'Warisan Hidup',
    subtitle: 'Tradisi Palembang Masa Kini',
    theme: 'WARISAN BUDAYA HIDUP',
    content: ['Palembang traditions', 'Local culture', 'Community heritage'],
    achievement: 'Warisan Hidup',
    achievementDescription: 'Telusuri tradisi Palembang.',
    description:
      'Kenali tradisi, busana, seni, adat, dan warisan budaya Palembang yang terus hidup dan diwariskan hingga masa kini.',
    story: [
      'Warisan tidak hanya tersimpan di museum. Ia hidup dalam bahasa, makanan, upacara, permainan, dan kebiasaan masyarakat Palembang.',
      'Setiap tradisi yang dijaga oleh keluarga dan komunitas menjadi jembatan antara Sriwijaya masa lalu dengan generasi digital hari ini.',
    ],
    facts: [
      'Palembang memiliki tradisi komunitas yang kuat',
      'Budaya lokal hidup melalui praktik sehari-hari',
      'Pelestarian membutuhkan partisipasi generasi muda',
    ],
    quizQuestion: 'Mengapa budaya Palembang disebut warisan hidup?',
    quizOptions: [
      { id: 'a', label: 'Karena masih dipraktikkan oleh masyarakat', isCorrect: true },
      { id: 'b', label: 'Karena hanya ada di buku lama', isCorrect: false },
      { id: 'c', label: 'Karena tidak berubah menjadi kebiasaan', isCorrect: false },
      { id: 'd', label: 'Karena tidak terkait komunitas', isCorrect: false },
    ],
    rewardXp: 100,
    baseProgress: 3,
    totalProgress: 8,
    icon: Theater,
  },
  {
    id: 'legacy',
    title: 'Warisan CUKI',
    subtitle: 'Pelestarian CUKI Tradisional',
    theme: 'PELESTARIAN PERMAINAN TRADISIONAL',
    content: ['History of CUKI', 'Traditional gameplay', 'Digital transformation'],
    achievement: 'Warisan CUKI',
    achievementDescription: 'Pelajari warisan CUKI.',
    description:
      'Telusuri perjalanan permainan tradisional CUKI serta upaya pelestariannya melalui pengalaman digital yang interaktif.',
    story: [
      'CUKI adalah bagian dari tradisi bermain yang mengajarkan strategi, perhatian, dan interaksi sosial. Permainan ini membawa cerita keluarga dan ruang berkumpul.',
      'Transformasi digital membuat CUKI dapat dikenalkan kembali tanpa melepaskan akar budayanya: papan, aturan, dan rasa bermain tetap menjadi pusat pengalaman.',
    ],
    facts: [
      'CUKI adalah permainan tradisional yang perlu dilestarikan',
      'Digitalisasi membantu memperluas akses',
      'Gameplay tetap menjadi pusat pengalaman budaya',
    ],
    quizQuestion: 'Apa tujuan utama transformasi digital CUKI?',
    quizOptions: [
      {
        id: 'a',
        label: 'Melestarikan permainan tradisional agar mudah dikenalkan kembali',
        isCorrect: true,
      },
      { id: 'b', label: 'Menghapus aturan permainan lama', isCorrect: false },
      { id: 'c', label: 'Mengganti budaya dengan fitur komersial', isCorrect: false },
      { id: 'd', label: 'Membuat CUKI tidak lagi bisa dimainkan', isCorrect: false },
    ],
    rewardXp: 100,
    baseProgress: 3,
    totalProgress: 8,
    icon: Dice5,
  },
];

export const finalAchievement = {
  title: 'Heritage Guardian',
  description: 'Menjadi penjaga warisan Kesultanan Palembang Darussalam di era digital.',
  icon: Landmark,
} as const;

export const emptyTreasureProgress: TreasureProgress = {
  version: TREASURE_PROGRESS_VERSION,
  completedArchiveIds: [],
  visitedArchiveIds: [],
  knowledgePoints: 0,
};

export function getTreasureById(id: string | undefined): TreasureCollection | undefined {
  return treasureCollections.find((treasure) => treasure.id === id);
}

export function isTreasureId(value: unknown): value is TreasureId {
  return treasureCollections.some((treasure) => treasure.id === value);
}

export function loadTreasureProgress(): TreasureProgress {
  if (typeof window === 'undefined') {
    return emptyTreasureProgress;
  }

  try {
    const serialized = window.localStorage.getItem(TREASURE_PROGRESS_KEY);
    if (!serialized) {
      return emptyTreasureProgress;
    }
    const parsed: unknown = JSON.parse(serialized);
    return parseTreasureProgress(parsed);
  } catch {
    return emptyTreasureProgress;
  }
}

export function persistTreasureProgress(progress: TreasureProgress): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(TREASURE_PROGRESS_KEY, JSON.stringify(progress));
    void saveSupabaseTreasureProgress(progress).catch(() => {
      // Archive progress remains locally available if cloud sync is offline.
    });
  } catch {
    // Archive progress is a frontend reward layer and must never interrupt exploration.
  }
}

export function completeArchive(
  progress: TreasureProgress,
  treasureId: TreasureId,
): TreasureProgress {
  const completedArchiveIds = uniqueTreasureIds([...progress.completedArchiveIds, treasureId]);
  const visitedArchiveIds = uniqueTreasureIds([...progress.visitedArchiveIds, treasureId]);
  const wasAlreadyCompleted = progress.completedArchiveIds.includes(treasureId);
  const reward = wasAlreadyCompleted ? 0 : (getTreasureById(treasureId)?.rewardXp ?? 0);

  return {
    version: TREASURE_PROGRESS_VERSION,
    completedArchiveIds,
    visitedArchiveIds,
    knowledgePoints: progress.knowledgePoints + reward,
  };
}

export function visitArchive(progress: TreasureProgress, treasureId: TreasureId): TreasureProgress {
  return {
    ...progress,
    visitedArchiveIds: uniqueTreasureIds([...progress.visitedArchiveIds, treasureId]),
  };
}

export function getArchiveProgressCount(
  treasure: TreasureCollection,
  progress: TreasureProgress,
): number {
  return treasure.baseProgress + (progress.completedArchiveIds.includes(treasure.id) ? 1 : 0);
}

export function getProfileLevel(progress: TreasureProgress): string {
  const completedCount = progress.completedArchiveIds.length;
  if (completedCount === treasureCollections.length) {
    return 'Heritage Guardian';
  }
  if (progress.knowledgePoints >= 400) {
    return 'Kurator Kadatuan';
  }
  if (progress.knowledgePoints >= 200) {
    return 'Penjelajah Arsip';
  }
  return 'Pewaris Muda';
}

function parseTreasureProgress(value: unknown): TreasureProgress {
  if (Array.isArray(value)) {
    const completedArchiveIds = uniqueTreasureIds(value);
    return {
      version: TREASURE_PROGRESS_VERSION,
      completedArchiveIds,
      visitedArchiveIds: completedArchiveIds,
      knowledgePoints: completedArchiveIds.length * 100,
    };
  }

  if (!isRecord(value)) {
    return emptyTreasureProgress;
  }

  const completedArchiveIds = Array.isArray(value.completedArchiveIds)
    ? uniqueTreasureIds(value.completedArchiveIds)
    : [];
  const visitedArchiveIds = Array.isArray(value.visitedArchiveIds)
    ? uniqueTreasureIds(value.visitedArchiveIds)
    : completedArchiveIds;
  const knowledgePoints =
    typeof value.knowledgePoints === 'number' && Number.isFinite(value.knowledgePoints)
      ? Math.max(0, Math.floor(value.knowledgePoints))
      : completedArchiveIds.length * 100;

  return {
    version: TREASURE_PROGRESS_VERSION,
    completedArchiveIds,
    visitedArchiveIds,
    knowledgePoints,
  };
}

function uniqueTreasureIds(values: readonly unknown[]): readonly TreasureId[] {
  return [...new Set(values.filter(isTreasureId))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
