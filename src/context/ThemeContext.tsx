import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';
import { animate } from 'framer-motion';
import { open } from '@tauri-apps/plugin-shell';
import { Lang, T } from '../constants/translations';

type Translations = typeof T['en'];
import { AccentColor, BgPatternId, ACCENT_COLORS, FONT_SIZES, FontSizeId, mixHex, mixRgba } from '../constants/colors';

interface ThemeContextValue {
  lang: Lang; t: Translations; setLang: (l: Lang) => void;
  accent: AccentColor; accentId: string; bgPatternId: BgPatternId;
  setAccent: (id: string) => void; setBgPattern: (id: BgPatternId) => void; resetAllColors: () => void;
  fontSizeId: FontSizeId; setFontSize: (id: FontSizeId) => void;
  openUrl: (url: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>(null!);
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('grim_lang') as Lang) || 'ru');
  const setLang = useCallback((l: Lang) => { setLangState(l); localStorage.setItem('grim_lang', l); }, []);
  const t = useMemo(() => T[lang], [lang]) as Translations;

  const [accentId, setAccentId] = useState(() => localStorage.getItem('grim_accent') || 'blue');
  const [bgPatternId, setBgPatternId] = useState<BgPatternId>(() => (localStorage.getItem('grim_bg_pattern') as BgPatternId) || 'default');
  const [fontSizeId, setFontSizeId] = useState<FontSizeId>(() => (localStorage.getItem('grim_font_size') as FontSizeId) || 'medium');

  const [accent, setAccentValue] = useState<AccentColor>(() => ACCENT_COLORS.find(c => c.id === accentId) ?? ACCENT_COLORS[0]);
  const accentDidMountRef = useRef(false);
  const accentTweenRef = useRef<{ stop: () => void } | null>(null);
  useEffect(() => {
    const target = ACCENT_COLORS.find(c => c.id === accentId) ?? ACCENT_COLORS[0];
    if (!accentDidMountRef.current) {
      accentDidMountRef.current = true;
      setAccentValue(target);
      return;
    }
    const from = accent;
    accentTweenRef.current?.stop();
    accentTweenRef.current = animate(0, 1, {
      duration: 0.6,
      ease: 'easeInOut',
      onUpdate: (progress: number) => setAccentValue({
        id: target.id,
        label: target.label,
        primary: mixHex(from.primary, target.primary, progress),
        secondary: mixHex(from.secondary, target.secondary, progress),
        uniqueColor: mixHex(from.uniqueColor, target.uniqueColor, progress),
        glow: mixRgba(from.glow, target.glow, progress),
      }),
    });
    return () => accentTweenRef.current?.stop();

  }, [accentId]);

  useEffect(() => {
    const scale = FONT_SIZES.find(f => f.id === fontSizeId)?.scale ?? 1.0;

    (document.documentElement.style as any).zoom = String(scale);
  }, [fontSizeId]);

  const setAccent = useCallback((id: string) => { setAccentId(id); localStorage.setItem('grim_accent', id); }, []);
  const setBgPattern = useCallback((id: BgPatternId) => { setBgPatternId(id); localStorage.setItem('grim_bg_pattern', id); }, []);
  const resetAllColors = useCallback(() => { setAccentId('blue'); setBgPatternId('default'); localStorage.setItem('grim_accent', 'blue'); localStorage.setItem('grim_bg_pattern', 'default'); }, []);
  const setFontSize = useCallback((id: FontSizeId) => { setFontSizeId(id); localStorage.setItem('grim_font_size', id); }, []);

  const openUrl = useCallback(async (url: string) => {
    try { await open(url); } catch {  }
  }, []);

  const value: ThemeContextValue = {
    lang, t, setLang,
    accent, accentId, bgPatternId, setAccent, setBgPattern, resetAllColors,
    fontSizeId, setFontSize,
    openUrl,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
