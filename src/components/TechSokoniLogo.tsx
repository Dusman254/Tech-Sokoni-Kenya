import React from 'react';

interface TechSokoniLogoProps {
  variant?: 'mark' | 'lockup';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const TechSokoniLogo: React.FC<TechSokoniLogoProps> = ({
  variant = 'lockup',
  theme = 'light',
  size = 'md',
  showSubtitle = false,
  className = '',
}) => {
  const isDark = theme === 'dark';

  const markSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-12 h-12',
  }[size];

  const titleSizes = {
    sm: 'text-sm tracking-[0.16em]',
    md: 'text-base sm:text-[17px] tracking-[0.18em]',
    lg: 'text-xl sm:text-2xl tracking-[0.2em]',
  }[size];

  const markBg = isDark ? '#F4F3EF' : '#141413';
  const markFg = isDark ? '#141413' : '#F4F3EF';
  const borderStroke = isDark ? '#141413' : '#F4F3EF';

  const markSvg = (
    <svg
      viewBox="0 0 64 64"
      className={`${markSizes} shrink-0`}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="10" fill={markBg} />
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="8"
        fill="none"
        stroke={borderStroke}
        strokeOpacity="0.16"
        strokeWidth="1.2"
      />
      <path d="M14 16H50V22.5H35.5V48H28.5V22.5H14V16Z" fill={markFg} />
      <rect x="42" y="35" width="8" height="13" rx="1.5" fill="#1F6F43" />
      <rect
        x="14"
        y="35"
        width="8"
        height="6"
        rx="1"
        fill={markFg}
        fillOpacity="0.28"
      />
    </svg>
  );

  if (variant === 'mark') {
    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        {markSvg}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {markSvg}
      <span className="flex flex-col text-left leading-none">
        <span
          className={`font-semibold uppercase whitespace-nowrap ${titleSizes} ${
            isDark ? 'text-[#F4F3EF]' : 'text-[#141413]'
          }`}
        >
          TECH SOKONI
        </span>
        {showSubtitle && (
          <span
            className={`text-[9px] font-mono-num uppercase tracking-[0.2em] mt-1 whitespace-nowrap ${
              isDark ? 'text-[#A09F99]' : 'text-[#5E5D59]'
            }`}
          >
            Nairobi Showroom · Kenya
          </span>
        )}
      </span>
    </span>
  );
};

export function getTechSokoniLogoSvgString(
  variant: 'lockup' | 'mark' = 'lockup',
  theme: 'light' | 'dark' = 'light'
): string {
  const isDark = theme === 'dark';
  const canvasBg = isDark ? '#141413' : '#F4F3EF';
  const markBg = isDark ? '#F4F3EF' : '#141413';
  const markFg = isDark ? '#141413' : '#F4F3EF';
  const textMain = isDark ? '#F4F3EF' : '#141413';
  const textSub = isDark ? '#A09F99' : '#5E5D59';

  if (variant === 'mark') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="512" height="512">
  <rect width="256" height="256" rx="40" fill="${markBg}" />
  <rect x="12" y="12" width="232" height="232" rx="32" fill="none" stroke="${markFg}" stroke-opacity="0.16" stroke-width="4" />
  <path d="M56 64H200V90H142V192H114V90H56V64Z" fill="${markFg}" />
  <rect x="168" y="140" width="32" height="52" rx="6" fill="#1F6F43" />
  <rect x="56" y="140" width="32" height="24" rx="4" fill="${markFg}" fill-opacity="0.28" />
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 144" width="1440" height="288">
  <rect width="720" height="144" fill="${canvasBg}" />
  <rect x="16" y="16" width="112" height="112" rx="18" fill="${markBg}" />
  <rect x="22" y="22" width="100" height="100" rx="14" fill="none" stroke="${markFg}" stroke-opacity="0.16" stroke-width="2" />
  <path d="M38 42H106V53H78V99H66V53H38V42Z" fill="${markFg}" />
  <rect x="90" y="76" width="15" height="23" rx="3" fill="#1F6F43" />
  <rect x="39" y="76" width="15" height="11" rx="2" fill="${markFg}" fill-opacity="0.28" />
  <text x="160" y="78" fill="${textMain}" font-family="'Plus Jakarta Sans', 'Inter', Arial, sans-serif" font-size="48" font-weight="700" letter-spacing="9">TECH SOKONI</text>
  <text x="162" y="110" fill="${textSub}" font-family="'JetBrains Mono', monospace" font-size="19" font-weight="500" letter-spacing="4.8">NAIROBI SHOWROOM · KENYA</text>
</svg>`;
}

export function downloadTechSokoniLogoSvg(
  variant: 'lockup' | 'mark' = 'lockup',
  theme: 'light' | 'dark' = 'light'
): void {
  const svgStr = getTechSokoniLogoSvgString(variant, theme);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tech-sokoni-${variant}-${theme}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadTechSokoniLogoPng(
  variant: 'lockup' | 'mark' = 'lockup',
  theme: 'light' | 'dark' = 'light'
): void {
  const svgStr = getTechSokoniLogoSvgString(variant, theme);
  const width = variant === 'mark' ? 1024 : 1440;
  const height = variant === 'mark' ? 1024 : 288;
  const img = new Image();
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `tech-sokoni-${variant}-${theme}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
      }, 'image/png');
    }
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
