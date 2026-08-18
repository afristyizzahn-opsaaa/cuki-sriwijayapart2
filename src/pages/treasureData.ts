import { Anchor, Crown, Dice5, Landmark, MoonStar, ScrollText, Theater } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { saveSupabaseTreasureProgress } from '../services/supabaseProgress';

export const TREASURE_PROGRESS_KEY = 'cuki_sriwijaya_treasures_v1';
export const TREASURE_PROGRESS_VERSION = 2;
const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

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
  readonly image?: string;
  readonly imageTitle?: string;
  readonly imageDescription?: string;
  readonly imageCredit?: string;
  readonly heroDescription?: string;
  readonly storyLabel?: string;
  readonly factsLabel?: string;
  readonly challengeLabel?: string;
  readonly rewardLabel?: string;
  readonly progressLabel?: string;
  readonly backLinkLabel?: string;
  readonly treasureProgressLabel?: string;
  readonly achievementProgressLabel?: string;
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
    content: ['Story', 'Historical Facts', 'Tantangan Pengetahuan'],
    achievement: 'Koleksi Kesultanan',
    achievementDescription: 'Jelajahi arsip warisan kesultanan.',
    description:
      'Jelajahi koleksi pusaka, simbol kesultanan, artefak istana, dan peninggalan yang merekam jejak Kesultanan Palembang Darussalam.',
    story: [
      'Kesultanan Palembang Darussalam merupakan kerajaan Islam yang berkembang di wilayah Palembang dan sekitarnya. Kesultanan ini berdiri pada abad ke-17 dan menjadi salah satu pusat pemerintahan serta perdagangan penting di Sumatra bagian selatan.',
      'Sultan Abdurrahman menjadi tokoh penting dalam berdirinya Kesultanan Palembang Darussalam. Pemerintahan kesultanan kemudian berkembang dengan memadukan kekuasaan politik, perdagangan, dan kehidupan Islam di Palembang.',
    ],
    facts: [
      'Kesultanan berpusat di Palembang',
      'Sultan Abdurrahman merupakan pendiri Kesultanan Palembang Darussalam',
      'Islam menjadi bagian penting dalam kehidupan kesultanan',
    ],
    quizQuestion: 'Siapakah tokoh yang dikenal sebagai pendiri Kesultanan Palembang Darussalam?',
    quizOptions: [
      { id: 'a', label: 'Sultan Abdurrahman', isCorrect: true },
      { id: 'b', label: 'Sultan Agung', isCorrect: false },
      { id: 'c', label: 'Sultan Hasanuddin', isCorrect: false },
      { id: 'd', label: 'Sultan Iskandar Muda', isCorrect: false },
    ],
    rewardXp: 100,
    baseProgress: 3,
    totalProgress: 8,
    icon: Crown,
    image: asset('assets/khazanah/lambang-kesultanan-palembang.jpg'),
    imageTitle: 'Lambang Kesultanan Palembang Darussalam',
    imageDescription: 'Simbol kekuasaan dan identitas Kesultanan Palembang Darussalam.',
    imageCredit: 'Sumber: Wikimedia Commons',
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
      'Kehidupan Kesultanan Palembang Darussalam sangat berkaitan dengan Sungai Musi. Letaknya yang strategis menjadikan Palembang sebagai tempat penting bagi aktivitas perdagangan dan pelayaran.',
      'Berbagai barang dagangan dari wilayah sekitar dan daerah lain melalui jalur sungai dan laut. Perdagangan tersebut membantu perkembangan ekonomi sekaligus menjadikan Palembang sebagai wilayah yang ramai didatangi pedagang.',
    ],
    facts: [
      'Sungai Musi menjadi jalur penting bagi aktivitas perdagangan',
      'Palembang memiliki posisi strategis di jalur perdagangan',
      'Perdagangan mendukung perkembangan ekonomi kesultanan',
    ],
    quizQuestion: 'Mengapa Sungai Musi penting bagi perkembangan Kesultanan Palembang Darussalam?',
    quizOptions: [
      { id: 'a', label: 'Menjadi jalur transportasi dan perdagangan', isCorrect: true },
      { id: 'b', label: 'Memisahkan Palembang dari wilayah lain', isCorrect: false },
      { id: 'c', label: 'Menghentikan kegiatan perdagangan', isCorrect: false },
      { id: 'd', label: 'Hanya digunakan untuk kegiatan militer', isCorrect: false },
    ],
    rewardXp: 100,
    baseProgress: 3,
    totalProgress: 8,
    icon: Anchor,
    image: asset('assets/khazanah/jejak-sungai-musi.jpg'),
    imageTitle: 'JEJAK SUNGAI MUSI',
    imageDescription: 'Pelabuhan dan aktivitas perahu di Sungai Musi, Palembang, sekitar 1900.',
    imageCredit: 'Arsip: KITLV / Wikimedia Commons',
  },
  {
    id: 'knowledge',
    title: 'Catatan Sejarah',
    subtitle: 'Jejak Kesultanan Palembang Darussalam',
    theme: 'WARISAN BUDAYA DAN SEJARAH',
    content: ['Jejak penting', 'Warisan budaya', 'Tantangan pengetahuan'],
    achievement: 'Catatan Sejarah',
    achievementDescription: 'Telusuri jejak sejarah Palembang Darussalam.',
    description:
      'Kesultanan Palembang Darussalam meninggalkan jejak yang tidak hanya terlihat pada pusat pemerintahannya, tetapi juga pada tumbuhnya kehidupan Islam di Palembang.',
    heroDescription:
      'Kesultanan Palembang Darussalam hidup dalam pusat pemerintahan, kehidupan Islam, dan warisan masyarakat yang terus bertahan lintas generasi.',
    story: [
      'Kesultanan Palembang Darussalam meninggalkan jejak yang tidak hanya terlihat pada pusat pemerintahannya, tetapi juga pada tumbuhnya kehidupan Islam di Palembang.',
      'Pada abad ke-18, Keraton Kuto Besak menjadi pusat pemerintahan dan pertahanan kesultanan. Dari tepian Sungai Musi, kehidupan politik, perdagangan, masyarakat, dan keagamaan saling bertemu dan membentuk Palembang Darussalam.',
      'Di tengah kehidupan itu, Islam berkembang bersama peran sultan, ulama, dan tradisi keilmuan, menjadikan Palembang bukan hanya pusat kekuasaan, tetapi juga bagian dari perjalanan Islam di Nusantara.',
      'Namun, jejak sebuah kesultanan tidak hanya tersimpan pada keraton dan catatan sejarah. Sebagiannya tetap hidup dalam kebiasaan dan warisan masyarakatnya hingga hari ini.',
    ],
    facts: [
      'Keraton Kuto Besak menjadi pusat Kesultanan Palembang Darussalam pada abad ke-18.',
      'Kuto Besak berdiri di tepian Sungai Musi dan menjadi bagian penting dari pusat pemerintahan kesultanan.',
      'Warisan Kesultanan Palembang Darussalam juga tercermin melalui kehidupan Islam, bangunan bersejarah, dan tradisi masyarakat Palembang.',
    ],
    quizQuestion:
      'Manakah yang menjadi salah satu jejak sejarah penting Palembang yang berkaitan dengan masa Kesultanan Palembang Darussalam?',
    quizOptions: [
      { id: 'a', label: 'Benteng Kuto Besak', isCorrect: true },
      { id: 'b', label: 'Candi Borobudur', isCorrect: false },
      { id: 'c', label: 'Candi Prambanan', isCorrect: false },
      { id: 'd', label: 'Benteng Rotterdam', isCorrect: false },
    ],
    rewardXp: 100,
    baseProgress: 3,
    totalProgress: 8,
    icon: ScrollText,
    image: asset('assets/khazanah/catatan-sejarah-kuto-besak.jpg'),
    imageTitle: 'KERATON KUTO BESAK',
    imageDescription: 'Pusat pemerintahan Kesultanan Palembang Darussalam yang berdiri di tepian Sungai Musi.',
    imageCredit: 'Sumber: Wikimedia Commons',
    storyLabel: 'KISAH',
    factsLabel: 'FAKTA SEJARAH',
    challengeLabel: 'TANTANGAN PENGETAHUAN',
    rewardLabel: 'HADIAH',
    progressLabel: '3 / 8 SELESAI',
    backLinkLabel: 'Kembali ke Khazanah',
    treasureProgressLabel: '+1 Progres Khazanah',
    achievementProgressLabel: 'Progres Pencapaian Diperbarui',
  },
  {
    id: 'harmony',
    title: 'Harmoni Nusantara',
    subtitle: 'Jejak Islam dalam Budaya Palembang',
    theme: 'INTERAKSI ISLAM NUSANTARA',
    content: [
      'Masuk dan berkembangnya Islam',
      'Kehidupan kesultanan',
      'Akulturasi Islam dan budaya Melayu',
      'Palembang Darussalam',
    ],
    achievement: 'Harmoni Nusantara',
    achievementDescription: 'Selesaikan arsip interaksi Islam Nusantara.',
    description:
      'Islam berkembang menjadi bagian penting dalam kehidupan Kesultanan Palembang Darussalam. Nilai-nilai Islam kemudian berpadu dengan budaya Melayu Palembang dan membentuk jejak yang terlihat dalam kehidupan keagamaan, tradisi, pendidikan, bahasa, serta tata kehidupan masyarakat.',
    story: [
      'Islam memiliki kedudukan penting dalam kehidupan Kesultanan Palembang Darussalam. Perkembangannya tidak hanya terlihat dalam pemerintahan kesultanan, tetapi juga dalam kehidupan keagamaan dan kebudayaan masyarakat Palembang.',
      'Masjid, ulama, dan pendidikan keagamaan menjadi bagian dari kehidupan masyarakat. Dalam perkembangannya, nilai-nilai Islam bertemu dengan budaya Melayu Palembang dan membentuk corak kehidupan yang khas.',
      'Perpaduan tersebut tercermin dalam tradisi, bahasa, seni, arsitektur, serta adat masyarakat. Islam tidak berdiri terpisah dari budaya Palembang, melainkan ikut memberi warna pada identitas masyarakat Palembang Darussalam.',
    ],
    facts: [
      'Islam menjadi bagian penting dalam kehidupan Kesultanan Palembang Darussalam.',
      'Masjid dan ulama memiliki peran dalam perkembangan kehidupan keagamaan masyarakat Palembang.',
      'Budaya Melayu Palembang berkembang berdampingan dengan nilai-nilai Islam.',
      'Perpaduan Islam dan budaya lokal membentuk corak khas masyarakat Palembang Darussalam.',
    ],
    quizQuestion: 'Apa yang paling menggambarkan hubungan Islam dan budaya Palembang dalam kesultanan?',
    quizOptions: [
      { id: 'a', label: 'Islam berpadu dengan budaya Melayu dan membentuk corak khas masyarakat', isCorrect: true },
      { id: 'b', label: 'Islam berdiri terpisah dari kehidupan budaya masyarakat', isCorrect: false },
      { id: 'c', label: 'Budaya Palembang tidak terpengaruh oleh Islam', isCorrect: false },
      { id: 'd', label: 'Kesultanan hanya berfokus pada perdagangan', isCorrect: false },
    ],
    rewardXp: 100,
    baseProgress: 3,
    totalProgress: 8,
    icon: MoonStar,
    image: asset('assets/khazanah/harmoni-nusantara-masjid-agung.jpg'),
    imageTitle: 'MASJID AGUNG PALEMBANG',
    imageDescription: 'Salah satu pusat kehidupan Islam yang tumbuh bersama perjalanan Kesultanan Palembang Darussalam.',
    imageCredit: 'Arsip: Tropenmuseum / Wikimedia Commons',
    storyLabel: 'KISAH',
    factsLabel: 'FAKTA SEJARAH',
    challengeLabel: 'TANTANGAN PENGETAHUAN',
    rewardLabel: 'HADIAH',
    progressLabel: '3 / 8 SELESAI',
    backLinkLabel: 'Kembali ke Khazanah',
    treasureProgressLabel: '+1 Progres Khazanah',
    achievementProgressLabel: 'Progres Pencapaian Diperbarui',
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
    image: asset('assets/khazanah/warisan-hidup.png'),
    imageTitle: 'WARISAN HIDUP',
    imageDescription: 'Ragam warisan Palembang yang hidup dalam kain, busana, tarian, seni, dan makanan.',
  },
  {
    id: 'legacy',
    title: 'CUKI',
    subtitle: 'Warisan Permainan Sriwijaya',
    theme: 'PERMAINAN TRADISIONAL PALEMBANG',
    content: ['Beranda', 'Khazanah Kesultanan', 'Cara Bermain', 'Main Cuki', 'Produk'],
    achievement: 'CUKI',
    achievementDescription: 'Kenali identitas CUKI sebagai permainan warisan.',
    description:
      'Jelajahi CUKI sebagai pengalaman permainan digital yang membawa nuansa tradisi, strategi, dan identitas budaya Palembang Darussalam.',
    story: [
      'Dan di antara warisan yang terus hidup itu, ada satu yang nyaris terlupakan: CUKI, permainan tradisional masyarakat Sumatera Selatan yang diwariskan lintas generasi.',
      'CUKI bukan sekadar permainan. Di dalamnya hidup strategi, kebersamaan, dan jejak kehidupan masyarakat yang menjadi bagian dari perjalanan budaya Palembang.',
      'Dari Palembang Darussalam, kehidupan Islam, hingga warisan masyarakatnya, perjalanan ini membawa kita pada satu kesadaran: budaya tidak cukup hanya dikenang- ia perlu dijaga agar tetap hidup.',
      'Kini, warisan itu tidak hanya untuk ditemukan.',
      'Saatnya CUKI dimainkan kembali.',
    ],
    facts: [
      'CUKI merepresentasikan permainan tradisional yang hidup',
      'Digitalisasi membantu generasi baru mengenal CUKI',
      'Strategi dan interaksi tetap menjadi inti permainan',
    ],
    quizQuestion: 'Apa yang paling penting dalam pengalaman bermain CUKI?',
    quizOptions: [
      {
        id: 'a',
        label: 'Strategi, interaksi, dan semangat bermain bersama',
        isCorrect: true,
      },
      { id: 'b', label: 'Menghapus unsur tradisionalnya', isCorrect: false },
      { id: 'c', label: 'Mengutamakan tampilan tanpa permainan', isCorrect: false },
      { id: 'd', label: 'Membatasi CUKI hanya untuk satu pemain', isCorrect: false },
    ],
    rewardXp: 100,
    baseProgress: 3,
    totalProgress: 8,
    icon: Dice5,
    image: asset('assets/khazanah/cuki-warisan-hidup.png'),
    imageTitle: 'CUKI',
    imageDescription: 'Perjalanan CUKI dari warisan permainan tradisional hingga dimainkan kembali.',
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
