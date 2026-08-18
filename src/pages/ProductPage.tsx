import {
  Clock3,
  Dice5,
  Heart,
  Instagram,
  PackageCheck,
  ShieldCheck,
  Ship,
  Store,
  Truck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { KingdomShell } from '../components/layout/KingdomShell';
import { Button } from '../components/ui/Button';

import pempekImage from '../../assets/pempek.jpeg';
import songketImage from '../../assets/kain songket.jpeg.webp';
import maksubaImage from '../../assets/kue maksuba.jpeg';

const cukiShowcaseImage = `${import.meta.env.BASE_URL}assets/khazanah/cuki-warisan-hidup.png`;
const cukiBoardGameImage = `${import.meta.env.BASE_URL}assets/produk/cuki-board-game.jpeg`;

const instagramUrl =
  'https://www.instagram.com/goc.sriwijaya?igsh=andmOWswZ2l1NzE3&igsi=andmOWswZ2l1NzE3';
const tiktokUrl = 'https://www.tiktok.com/@gameofcuki?_r=1&_t=ZS-98uAHWve1Uy';

interface ProductCardData {
  readonly category: string;
  readonly description: string;
  readonly highlight?: string;
  readonly icon: LucideIcon;
  readonly image?: string;
  readonly isFeatured?: boolean;
  readonly name: string;
  readonly price: string;
}

const productCards: readonly ProductCardData[] = [
  {
    category: 'Warisan yang Kembali Dimainkan',
    description:
      'Dari permainan tradisional masyarakat Sumatera Selatan, CUKI hadir kembali dalam bentuk permainan fisik yang dapat dimainkan bersama keluarga dan komunitas.',
    highlight: 'Bukan sekadar permainan.\nIni warisan yang kembali hidup.',
    icon: Dice5,
    image: cukiBoardGameImage,
    isFeatured: true,
    name: 'CUKI BOARD GAME',
    price: 'Harga segera diumumkan',
  },
  {
    category: 'Kuliner Ikonik',
    description: 'Makanan khas Palembang yang menjadi ikon kuliner Sumatera Selatan.',
    icon: Ship,
    image: pempekImage,
    name: 'Pempek Palembang',
    price: 'Produk mitra budaya',
  },
  {
    category: 'Kain Tradisional',
    description: 'Kain tradisional penuh makna dan filosofi budaya.',
    icon: ShieldCheck,
    image: songketImage,
    name: 'Songket Palembang',
    price: 'Produk mitra budaya',
  },
  {
    category: 'Warisan Kuliner',
    description: 'Warisan kuliner lokal yang terus dijaga.',
    icon: Heart,
    image: maksubaImage,
    name: 'Kue Tradisional Sumatera Selatan',
    price: 'Produk mitra budaya',
  },
];

/** Premium cultural commerce presentation for the physical CUKI board game. */
export function ProductPage(): JSX.Element {
  return (
    <KingdomShell eyebrow="Heritage Gallery" title="Produk Budaya">
      <section className="relative overflow-hidden rounded-card border border-primary-gold/25 bg-[radial-gradient(circle_at_70%_18%,rgba(212,175,55,0.22),transparent_30%),linear-gradient(135deg,rgba(8,7,6,0.96),rgba(74,39,24,0.76))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)] md:p-8">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#D4AF37_1px,transparent_1px),linear-gradient(#D4AF37_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-primary-amber">
              Main Heritage Product
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-surface-parchment md:text-6xl">
              CUKI BOARD GAME
            </h2>
            <p className="mt-3 font-display text-2xl text-primary-gold">
              Mainkan Warisan. Hidupkan Budaya.
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-surface-parchment/78 md:text-base">
              Permainan strategi tradisional dari Sumatera Selatan yang kini hadir dalam versi
              fisik. Rasakan pengalaman bermain CUKI bersama keluarga sekaligus menjaga warisan
              budaya yang hampir punah.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Highlight icon={Dice5} label="Permainan Strategi Tradisional" />
              <Highlight icon={Users} label="2-4 Pemain" />
              <Highlight icon={Clock3} label="30-45 Menit Bermain" />
              <Highlight icon={Store} label="Warisan Budaya Sriwijaya" />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="min-h-14 rounded-full px-7 text-base shadow-[0_0_34px_rgba(212,175,55,0.28)]"
              >
                <a href={instagramUrl} rel="noreferrer" target="_blank">
                  <Instagram aria-hidden="true" className="h-5 w-5" />
                  Beli Sekarang
                </a>
              </Button>
              <Button
                asChild
                className="min-h-14 rounded-full border-primary-gold/55 bg-bg-dark/35 px-6 text-base backdrop-blur-md"
                variant="secondary"
              >
                <a href={instagramUrl} rel="noreferrer" target="_blank">
                  <Instagram aria-hidden="true" className="h-5 w-5" />
                  Instagram Kami
                </a>
              </Button>
              <Button
                asChild
                className="min-h-14 rounded-full border-primary-gold/55 bg-bg-dark/35 px-6 text-base backdrop-blur-md"
                variant="secondary"
              >
                <a href={tiktokUrl} rel="noreferrer" target="_blank">
                  <span aria-hidden="true" className="text-lg font-black">
                    ♪
                  </span>
                  TikTok Kami
                </a>
              </Button>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <ProductShowcase />
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-primary-amber">
            Katalog Produk Sumatera Selatan
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-primary-gold">
            Kenali dan dukung berbagai produk budaya khas Sumatera Selatan.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {productCards.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-card border border-primary-gold/25 bg-[linear-gradient(135deg,rgba(74,39,24,0.72),rgba(8,7,6,0.92))] p-6 shadow-[0_22px_72px_rgba(0,0,0,0.3)] md:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-primary-amber">
              Dukung Warisan Lokal
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-surface-parchment">
              Setiap pembelian ikut menjaga keberlangsungan budaya Sumatera Selatan.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <TrustItem icon={Truck} title="Pengiriman" />
            <TrustItem icon={PackageCheck} title="Produk Original" />
            <TrustItem icon={Heart} title="Pelestarian Budaya" />
          </div>
        </div>
      </section>
    </KingdomShell>
  );
}

function ProductShowcase(): JSX.Element {
  return (
    <div className="relative mx-auto max-w-[620px] rounded-[2rem] border border-primary-gold/30 bg-bg-dark/45 p-5 shadow-[0_0_70px_rgba(212,175,55,0.18)] backdrop-blur-sm">
      <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-primary-gold/20 blur-3xl" />
      <div className="relative rounded-[1.5rem] border border-primary-gold/25 bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.14),transparent_38%),rgba(8,7,6,0.48)] p-5">
        <div className="relative mx-auto aspect-[4/3] max-w-[520px] overflow-hidden rounded-2xl border border-primary-gold/35 bg-bg-mahogany/70 shadow-[0_20px_60px_rgba(0,0,0,0.38)]">
          <img
            alt="CUKI warisan hidup"
            className="absolute inset-0 h-full w-full object-cover object-center"
            src={cukiShowcaseImage}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,6,0.02),rgba(8,7,6,0.12))]" />
          <div className="relative opacity-0">
          <div className="absolute -bottom-7 left-1/2 h-10 w-4/5 -translate-x-1/2 rounded-full bg-black/50 blur-xl" />
          <div className="grid h-full grid-cols-[1.35fr_0.65fr] gap-4">
            <div className="rounded-xl border-4 border-[#d7ad57] bg-[#17212c] p-[7%] shadow-[inset_0_0_0_3px_#09111a]">
              <div className="grid h-full grid-cols-10 grid-rows-10 gap-[2px] bg-[#111922] p-[2px]">
                {Array.from({ length: 100 }, (_, index) => (
                  <span key={index} className={`rounded-[3px] ${getMiniBoardCellClass(index)}`} />
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-xl border border-primary-gold/30 bg-bg-dark/70 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-gold">
                  CUKI
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-surface-parchment">
                  Board Game
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 16 }, (_, index) => (
                  <span
                    key={index}
                    className={`aspect-square rounded-full border ${
                      index % 2 === 0
                        ? 'border-surface-parchment bg-surface-parchment'
                        : 'border-primary-gold bg-bg-dark'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
        <p className="mt-7 text-center text-xs font-bold uppercase tracking-[0.24em] text-primary-gold">
          Premium Packaging Showcase
        </p>
      </div>
    </div>
  );
}

function ProductCard({ product }: { readonly product: ProductCardData }): JSX.Element {
  const Icon = product.icon;

  return (
    <article
      className={`group rounded-card border bg-bg-dark/62 p-5 shadow-[0_20px_58px_rgba(0,0,0,0.28)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-primary-gold/60 hover:shadow-[0_0_42px_rgba(212,175,55,0.16)] ${
        product.isFeatured ? 'border-primary-gold/55 xl:col-span-1' : 'border-primary-gold/20'
      }`}
    >
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border border-primary-gold/20 bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.16),rgba(74,39,24,0.34)_48%,rgba(8,7,6,0.62)_100%)]">
        {product.image ? (
          <>
            <img
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              src={product.image}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,6,0.04),rgba(8,7,6,0.28))]" />
          </>
        ) : (
          <>
            <div className="absolute inset-4 rounded-2xl border border-primary-gold/10" />
            <Icon aria-hidden="true" className="relative h-16 w-16 text-primary-gold" />
          </>
        )}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="rounded-full border border-primary-gold/25 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary-gold">
          {product.category}
        </span>
      </div>
      <h3 className="mt-4 font-display text-2xl font-semibold text-primary-gold">{product.name}</h3>
      <p className="mt-3 text-sm leading-6 text-surface-parchment/70">{product.description}</p>
      {product.highlight ? (
        <p className="mt-4 whitespace-pre-line text-sm font-semibold leading-6 text-surface-parchment">
          {product.highlight}
        </p>
      ) : null}
      <p className="mt-4 text-sm font-semibold text-surface-parchment">{product.price}</p>
      <Button
        className="mt-5 w-full rounded-full border-primary-gold/45 bg-bg-mahogany/70"
        variant={product.isFeatured ? 'primary' : 'secondary'}
      >
        {product.isFeatured ? 'Jelajahi CUKI' : 'Lihat Detail'}
      </Button>
    </article>
  );
}

function Highlight({
  icon: Icon,
  label,
}: {
  readonly icon: LucideIcon;
  readonly label: string;
}): JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary-gold/20 bg-primary-gold/6 px-4 py-3 text-sm font-semibold text-surface-parchment/84">
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary-gold" />
      <span>{label}</span>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
}: {
  readonly icon: LucideIcon;
  readonly title: string;
}): JSX.Element {
  return (
    <div className="rounded-2xl border border-primary-gold/20 bg-bg-dark/48 p-4 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-primary-gold/35 bg-primary-gold/10 text-primary-gold">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-semibold text-surface-parchment">{title}</p>
    </div>
  );
}

function getMiniBoardCellClass(cell: number): string {
  const row = Math.floor(cell / 10);
  const column = cell % 10;

  if (column === 0) {
    return 'bg-[#9dcce1]';
  }
  if (column === 9) {
    return 'bg-[#a7ce96]';
  }
  if (row <= 2) {
    return 'bg-[#f5e69f]';
  }
  if (row >= 7) {
    return 'bg-[#dfa073]';
  }
  return column <= 4 ? 'bg-[#9dcce1]' : 'bg-[#a7ce96]';
}
