
export interface AccentColor {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  glow: string;
  uniqueColor: string;
}

const hexToRgbTriplet = (hex: string): string => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return '0,0,0';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
};

export const mixHex = (from: string, to: string, t: number): string => {
  const [r1, g1, b1] = hexToRgbTriplet(from).split(',').map(Number);
  const [r2, g2, b2] = hexToRgbTriplet(to).split(',').map(Number);
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(lerp(r1, r2))}${hex(lerp(g1, g2))}${hex(lerp(b1, b2))}`;
};

export const mixRgba = (from: string, to: string, t: number): string => {
  const parse = (s: string): [number, number, number, number] => {
    const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(s);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] !== undefined ? Number(m[4]) : 1] : [0, 0, 0, 1];
  };
  const [r1, g1, b1, a1] = parse(from);
  const [r2, g2, b2, a2] = parse(to);
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return `rgba(${Math.round(lerp(r1, r2))},${Math.round(lerp(g1, g2))},${Math.round(lerp(b1, b2))},${lerp(a1, a2).toFixed(3)})`;
};

export const ACCENT_COLORS: AccentColor[] = [
  { id: 'blue',    label: 'Aqua', primary: '#31c4b5', secondary: '#2d9f94', glow: 'rgba(49,196,181,0.30)',  uniqueColor: '#cfa873' },
  { id: 'indigo',  label: 'Indigo',  primary: '#8588c4', secondary: '#6e71b2', glow: 'rgba(133,136,196,0.18)',  uniqueColor: '#cfa873' },
  { id: 'violet',  label: 'Violet',  primary: '#9a85c4', secondary: '#856eb2', glow: 'rgba(154,133,196,0.18)', uniqueColor: '#cfa873' },
  { id: 'teal',    label: 'Teal',    primary: '#6bab9f', secondary: '#5b9388', glow: 'rgba(107,171,159,0.18)', uniqueColor: '#cfa873' },
  { id: 'rose',    label: 'Rose',    primary: '#c98a96', secondary: '#b87280', glow: 'rgba(201,138,150,0.18)',  uniqueColor: '#cfa873' },
  { id: 'amber',   label: 'Amber',   primary: '#cfa873', secondary: '#c09459', glow: 'rgba(207,168,115,0.18)', uniqueColor: '#8588c4' },
];

export const BG_PATTERNS = [
  {
    id: 'default', label: 'Default', preview: 'linear-gradient(160deg,#070d0e 0%,#0d1a1c 100%)',

    css: (a: AccentColor) => `background:
      radial-gradient(ellipse 1200px 900px at 20% 10%, rgba(${hexToRgbTriplet(a.primary)},0.12), transparent 72%),
      radial-gradient(ellipse 1000px 820px at 86% 20%, rgba(${hexToRgbTriplet(a.secondary)},0.10), transparent 72%),
      radial-gradient(ellipse 1150px 900px at 50% 100%, rgba(${hexToRgbTriplet(a.secondary)},0.15), transparent 72%),
      #070d0e;`,
  },
] as const;

export type BgPatternId = typeof BG_PATTERNS[number]['id'];

export const EXCLUSIVE_PRIMARY   = '#6ba8c4';
export const EXCLUSIVE_SECONDARY = '#5395b3';
export const EXCLUSIVE_GLOW      = 'rgba(107,168,196,0.16)';
export const STAFF_COLOR         = '#cba14d';

export const RADIUS = { sm: '6px', md: '8px', lg: '12px', xl: '16px', pill: '999px' } as const;

export const SURFACE = {
  base: '#070d0e',
  panel: '#070d0e',
  card: '#0d1a1c',
  cardHover: '#152729',
  border: '#193538',
  borderStrong: '#21464a',
  textPrimary: '#eef6f5',
  textSecondary: '#abc4c2',
  textTertiary: '#698684',
  textMuted: '#42595c',
} as const;

export const ELEVATION = {
  sm: '0 1px 2px rgba(2,8,9,0.5)',
  md: '0 4px 16px rgba(4,14,16,0.45), 0 1px 2px rgba(0,0,0,0.3)',
  lg: '0 20px 50px rgba(5,17,19,0.55), 0 2px 8px rgba(0,0,0,0.3)',
} as const;

export const focusRing = (accent: AccentColor) => `0 0 0 3px ${accent.glow}`;

export const accentGradient = (primary: string, secondary: string) => `linear-gradient(135deg, ${primary}, ${secondary})`;

export const cardGlow = (primary: string, glow: string) => `0 0 0 1px ${primary}55, 0 16px 36px -12px ${glow}`;

export const getGlobalStyles = (accent: AccentColor, bgPatternId: BgPatternId) => {
  const pattern = BG_PATTERNS.find(p => p.id === bgPatternId) ?? BG_PATTERNS[0];
  return `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;}

  *,*::before,*::after{transition:background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, fill 0.15s ease, stroke 0.15s ease;}
  html,body{margin:0;padding:0;overflow-x:hidden;font-family:'Inter',-apple-system,system-ui,sans-serif;color:${SURFACE.textPrimary};font-weight:400;-webkit-font-smoothing:antialiased;}
  body{background:${SURFACE.base};min-height:100vh;position:relative;}
  body::before{
    content:'';
    position:fixed; inset:-12%;
    z-index:0;
    pointer-events:none;
    ${pattern.css(accent)}
    will-change:transform;
    animation: bgDrift 28s ease-in-out infinite alternate;
  }
  #root,body>div{position:relative;z-index:1;}
  @keyframes bgDrift{
    0%   { transform: translate(0%, 0%) scale(1); }
    50%  { transform: translate(-2.2%, 1.6%) scale(1.05); }
    100% { transform: translate(2%, -1.4%) scale(1.03); }
  }
  ::-webkit-scrollbar{width:8px;height:8px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:${SURFACE.borderStrong};border-radius:8px;border:2px solid transparent;}
  ::-webkit-scrollbar-thumb:hover{background:${accent.primary}88;}
  input::placeholder{color:${SURFACE.textMuted};transition:color 0.2s;font-weight:400;}
  button{transition:background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;}
  .tier-staff,.tier-diamond,.tier-gold{font-weight:700;}
  .tier-staff{color:${STAFF_COLOR};}
  .tier-diamond{color:#8fb8cc;}
  .tier-gold{color:#c9a55e;}
  .exclusive-skull{opacity:1;}
  `;
};

export const FONT_SIZES = [
  { id: 'small',  label: 'Small',  scale: 0.92 },
  { id: 'medium', label: 'Medium', scale: 1.0 },
  { id: 'large',  label: 'Large',  scale: 1.1 },
  { id: 'xlarge', label: 'X-Large', scale: 1.22 },
] as const;

export type FontSizeId = typeof FONT_SIZES[number]['id'];

export const canAccess18Plus        = (tier: string) => ['SILVER','GOLD','DIAMOND','STAFF'].includes(tier);
export const canDownloadUniqueByTier = (tier: string) => ['GOLD','DIAMOND','STAFF'].includes(tier);
export const canAccessExclusive      = (tier: string) => ['DIAMOND'].includes(tier);
