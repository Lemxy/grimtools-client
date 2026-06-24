import { memo, useEffect, useState } from 'react';
import { useTheme } from '../context/AppContext';
import { SURFACE } from '../constants/colors';

const IconMinimize = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const IconMaximize = ({ maximized }: { maximized: boolean }) => (
  maximized ? (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <rect x="2" y="0.5" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1" />
      <rect x="0.5" y="2" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1" fill="#0a0a0c" />
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
);

const IconClose = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" />
    <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export const TitleBar = memo(() => {
  const { accent } = useTheme();
  const [isMaximized, setIsMaximized] = useState(false);
  const [win, setWin] = useState<import('@tauri-apps/api/window').Window | null>(null);

  useEffect(() => {
    let unlistenResize: (() => void) | null = null;
    (async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const w = getCurrentWindow();
      setWin(w);
      try { setIsMaximized(await w.isMaximized()); } catch {}
      try {
        const off = await w.onResized(async () => {
          try { setIsMaximized(await w.isMaximized()); } catch {}
        });
        unlistenResize = off;
      } catch {}
    })();
    return () => { if (unlistenResize) unlistenResize(); };
  }, []);

  const minimize = () => win?.minimize();
  const toggleMaximize = () => win?.toggleMaximize();
  const close = () => win?.close();

  return (
    <div
      data-tauri-drag-region
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '32px',
        background: `${SURFACE.panel}b3`,
        backdropFilter: 'blur(3px)',
        zIndex: 999999,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        userSelect: 'none',
      }}
    >
      <div
        data-tauri-drag-region
        style={{
          flex: 1, height: '100%', display: 'flex', alignItems: 'center',
          paddingLeft: '14px', gap: '8px',
        }}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent.primary, boxShadow: `0 0 8px ${accent.glow}` }} />
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.3px', color: SURFACE.textTertiary }}>
          GrimTool
        </span>
      </div>

      <div style={{ display: 'flex', height: '100%' }}>
        <TitleBarBtn onClick={minimize} title="Свернуть">
          <IconMinimize />
        </TitleBarBtn>
        <TitleBarBtn onClick={toggleMaximize} title={isMaximized ? 'Восстановить' : 'Развернуть'}>
          <IconMaximize maximized={isMaximized} />
        </TitleBarBtn>
        <TitleBarBtn onClick={close} title="Закрыть" danger>
          <IconClose />
        </TitleBarBtn>
      </div>
    </div>
  );
});

const TitleBarBtn = memo(({ onClick, title, danger, children }: {
  onClick: () => void; title: string; danger?: boolean; children: React.ReactNode;
}) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '46px', height: '100%', border: 'none',
        background: hover ? (danger ? '#a86565' : SURFACE.cardHover) : 'transparent',
        color: hover ? '#fff' : SURFACE.textTertiary,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      {children}
    </button>
  );
});
