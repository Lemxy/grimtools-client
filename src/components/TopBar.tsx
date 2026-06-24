import { memo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { useTheme, useUI, useGames } from '../context/AppContext';
import { SURFACE } from '../constants/colors';
import { SIDEBAR_WIDTH } from '../constants/layout';

const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const IconFolder = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const IconPower = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

const IconWrench = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

export const TopBar = memo(() => {
  const { t, accent } = useTheme();
  const { updateStatus, setShowProfile } = useUI();
  const {
    refreshAllGames, steamPath,
    isRefreshing,
    setShowRestartModal,
    handleRunFixer, isRunningFixer,
    handleRunManualFix, isRunningManualFix,
  } = useGames();

  const [fixesMenuOpen, setFixesMenuOpen] = useState(false);
  const [autoFixBlocked, setAutoFixBlocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runOwnMethod = async () => {
    if (autoFixBlocked) return;
    setFixesMenuOpen(false);
    setAutoFixBlocked(true);
    try { await invoke('run_autofix'); } catch {  }
    timerRef.current = setTimeout(() => { setAutoFixBlocked(false); }, 3000);
  };

  const runFixerOption = () => {
    setFixesMenuOpen(false);
    handleRunFixer();
  };

  const runManualFixOption = () => {
    setFixesMenuOpen(false);
    handleRunManualFix();
  };

  const openSteamFolder = async () => {
    if (!steamPath) { updateStatus('Steam path not found'); return; }
    try { await invoke('open_steam_folder', { steamPath }); }
    catch { updateStatus('Cannot open Steam folder'); }
  };

  return (
    <div
      style={{
        position: 'fixed', top: '32px', left: SIDEBAR_WIDTH, right: 0, height: '56px',
        background: `${SURFACE.panel}26`,
        backdropFilter: 'blur(1px)',
        zIndex: 195,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '0 20px', gap: '4px',
      }}
    >
      <TopBarBtn icon={<IconRefresh />} label={t.refresh} onClick={refreshAllGames} loading={isRefreshing} spin={isRefreshing} iconHover={{ rotate: 110 }} />
      <FixesMenu
        open={fixesMenuOpen}
        setOpen={setFixesMenuOpen}
        blocked={autoFixBlocked || isRunningFixer || isRunningManualFix}
        onOwnMethod={runOwnMethod}
        onFixer={runFixerOption}
        onManual={runManualFixOption}
        t={t}
      />
      <TopBarBtn icon={<IconFolder />} label={t.steamPath} onClick={openSteamFolder} iconHover={{ y: -2, scale: 1.1 }} />
      <div style={{ width: '1px', height: '22px', background: SURFACE.border, margin: '0 6px' }} />
      <TopBarBtn icon={<IconPower />} label={t.restartPurge} onClick={() => setShowRestartModal(true)} iconHover={{ rotate: 180 }} iconTransition={{ duration: 0.4 }} />
      <div style={{ width: '1px', height: '22px', background: SURFACE.border, margin: '0 6px' }} />
      <TopBarBtn icon={<IconUser />} label={t.profile} onClick={() => setShowProfile(true)} accent={accent} withBorder iconHover={{ scale: 1.15 }} />
    </div>
  );
});

interface FixesMenuProps {
  open: boolean; setOpen: (v: boolean) => void; blocked: boolean;
  onOwnMethod: () => void; onFixer: () => void; onManual: () => void;
  t: any;
}

const FixesMenu = memo(({ open, setOpen, blocked, onOwnMethod, onFixer, onManual, t }: FixesMenuProps) => {
  const activeColor = '#6fae87';

  return (
    <div style={{ position: 'relative' }}>
      <motion.div
        onClick={!blocked ? () => setOpen(!open) : undefined}
        title={t.fixesBtn}
        initial="rest"
        animate="rest"
        whileHover={blocked ? undefined : 'hover'}
        whileTap={blocked ? undefined : { scale: 0.95 }}
        variants={{
          rest: { background: open ? `${activeColor}18` : 'rgba(0,0,0,0)' },
          hover: { background: `${activeColor}22` },
        }}
        transition={{ duration: 0.15 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '8px 14px',
          cursor: blocked ? 'not-allowed' : 'pointer',
          opacity: blocked ? 0.5 : 1,
          userSelect: 'none',
          borderRadius: '8px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColor }}>
          {blocked ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
              style={{ width: 12, height: 12, border: '1.5px solid #ffffff55', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
          ) : (
            <motion.span style={{ display: 'flex' }} variants={{ rest: { rotate: 0 }, hover: { rotate: -20 } }} transition={{ duration: 0.2 }}>
              <IconWrench />
            </motion.span>
          )}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 500, color: activeColor, whiteSpace: 'nowrap' }}>
          {t.fixesBtn}
        </span>
      </motion.div>

      <AnimatePresence>
        {open && !blocked && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: '300px', zIndex: 999,
                background: SURFACE.card, border: `1px solid ${SURFACE.borderStrong}`,
                borderRadius: '12px', overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(2,4,16,0.55)',
              }}
            >
              <FixesMenuItem label={t.fixesMenuOwn} desc={t.fixesMenuOwnDesc} onClick={onOwnMethod} />
              <div style={{ height: 1, background: SURFACE.border }} />
              <FixesMenuItem label={t.fixesMenuFixer} desc={t.fixesMenuFixerDesc} onClick={onFixer} />
              <div style={{ height: 1, background: SURFACE.border }} />
              <FixesMenuItem label={t.fixesMenuManual} desc={t.fixesMenuManualDesc} onClick={onManual} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

const FixesMenuItem = memo(({ label, desc, onClick }: { label: string; desc: string; onClick: () => void }) => (
  <motion.div
    onClick={onClick}
    initial="rest"
    whileHover="hover"
    variants={{ rest: { background: 'rgba(0,0,0,0)' }, hover: { background: SURFACE.cardHover } }}
    transition={{ duration: 0.12 }}
    style={{ padding: '12px 16px', cursor: 'pointer' }}
  >
    <p style={{ fontSize: '13px', color: SURFACE.textPrimary, fontWeight: 500, margin: '0 0 3px' }}>
      {label}
    </p>
    <p style={{ fontSize: '12px', color: SURFACE.textTertiary, margin: 0, lineHeight: 1.5 }}>
      {desc}
    </p>
  </motion.div>
));

interface TopBarBtnProps {
  icon: React.ReactNode; label: string; onClick?: () => void;
  loading?: boolean; spin?: boolean;
  accent?: { primary: string };
  withBorder?: boolean;

  iconHover?: Record<string, number>;
  iconTransition?: { duration?: number };
}

const TopBarBtn = memo(({ icon, label, onClick, loading, spin, accent, withBorder, iconHover = { scale: 1.15 }, iconTransition }: TopBarBtnProps) => {
  const restBg = withBorder && accent ? `${accent.primary}14` : 'rgba(0,0,0,0)';
  const hoverBg = withBorder && accent ? `${accent.primary}22` : SURFACE.cardHover;
  const restBorder = withBorder && accent ? `${accent.primary}33` : 'rgba(0,0,0,0)';
  const color = withBorder && accent ? accent.primary : SURFACE.textSecondary;

  return (
    <motion.button
      onClick={onClick}
      title={label}
      disabled={loading}
      initial="rest"
      animate="rest"
      whileHover={loading ? undefined : 'hover'}
      whileTap={loading ? undefined : { scale: 0.95 }}
      variants={{
        rest: { background: restBg, borderColor: restBorder },
        hover: { background: hoverBg, borderColor: restBorder },
      }}
      transition={{ duration: 0.15 }}
      style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        padding: '8px 14px',
        border: '1px solid',
        borderRadius: '8px',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
        color,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {spin ? (
          <motion.span style={{ display: 'flex' }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
            {icon}
          </motion.span>
        ) : (
          <motion.span style={{ display: 'flex' }} variants={{ rest: { rotate: 0, scale: 1, y: 0 }, hover: iconHover }} transition={iconTransition ?? { duration: 0.25, ease: 'easeOut' }}>
            {icon}
          </motion.span>
        )}
      </span>
      <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </motion.button>
  );
});
