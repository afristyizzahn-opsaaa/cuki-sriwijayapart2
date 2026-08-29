import type { CSSProperties } from 'react';

const cukiLogoUrl = `${import.meta.env.BASE_URL}assets/cuki-logo.png`;

export function CukiLogo({
  className = '',
  variant,
}: {
  readonly className?: string;
  readonly variant: 'gate' | 'video' | 'navbar';
}): JSX.Element {
  const variantClassName = getVariantClassName(variant);

  return (
    <img
      alt="Game of CUKI"
      className={`${variantClassName} ${className}`.trim()}
      draggable={false}
      src={cukiLogoUrl}
    />
  );
}

function getVariantClassName(variant: 'gate' | 'video' | 'navbar'): string {
  const base =
    'block select-none object-contain pointer-events-none transition-[opacity,transform,filter] duration-700 ease-out';

  switch (variant) {
    case 'gate':
      return `${base} w-[clamp(70px,7vw,125px)] opacity-95 drop-shadow-[0_6px_16px_rgba(0,0,0,0.28)] drop-shadow-[0_0_10px_rgba(212,175,55,0.18)]`;
    case 'video':
      return `${base} w-[clamp(60px,5.6vw,100px)] opacity-80 drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)]`;
    case 'navbar':
      return `${base} w-[clamp(55px,6vw,95px)] opacity-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.28)]`;
  }
}
