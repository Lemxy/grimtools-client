import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, useUI, useAuth, useGames } from '../context/AppContext';
import { GameCard, GameTab } from '../components/GameCard';
import { EXCLUSIVE_PRIMARY, SURFACE, accentGradient } from '../constants/colors';

const API_BASE = 'https://api.example-backend.invalid';

interface GamesPageProps {
  activeTab: GameTab;
  topOpenGameId: number | null;
  onForceOpenConsumed: () => void;
}

export const GamesPage = memo(({ activeTab, topOpenGameId, onForceOpenConsumed }: GamesPageProps) => {
  const { t, accent } = useTheme();
  const { setShowProfile } = useUI();
  const { canDownloadUnique, userCan18, userCanExclusive } = useAuth();
  const {
    games, uniqueGames, adultGames, exclusiveGames,
    activatedGamesIds, loadingAppId, onlineLoadingAppId,
    handleActivate, handleOnlineInstall,
  } = useGames();

  const [search, setSearch] = useState('');
  const [showDefenderModal, setShowDefenderModal] = useState(false);
  const [pendingOnlineGame, setPendingOnlineGame] = useState<import('../context/AppContext').Game | null>(null);
  const defenderAcceptedRef = useRef(false);
  const [disablingDefender, setDisablingDefender] = useState(false);

  const [steamDescs, setSteamDescs] = useState<Record<number, string>>({});
  const fetchedIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    const allGames = [...games, ...uniqueGames, ...adultGames, ...exclusiveGames];
    const missing = allGames.filter(g => !g.description && !fetchedIds.current.has(g.id));
    if (missing.length === 0) return;
    missing.forEach(g => fetchedIds.current.add(g.id));
    missing.forEach(async (game) => {
      let desc: string | null = null;

      try {
        desc = await invoke<string | null>('fetch_steam_desc', { appId: game.id });
      } catch {  }

      if (!desc) {
        try {
          const r = await fetch(`${API_BASE}/api/steam-desc/${game.id}`);
          if (r.ok) {
            const data = await r.json();
            desc = data.description ?? null;
          }
        } catch {  }
      }

      if (desc) setSteamDescs(prev => ({ ...prev, [game.id]: desc as string }));
    });
  }, [games, uniqueGames, adultGames, exclusiveGames]);

  const handleOnlineWithDefender = useCallback((game: import('../context/AppContext').Game) => {
    if (defenderAcceptedRef.current) {
      handleOnlineInstall(game);
      return;
    }
    setPendingOnlineGame(game);
    setShowDefenderModal(true);
  }, [handleOnlineInstall]);

  const acceptDefender = useCallback(() => {
    defenderAcceptedRef.current = true;
    setShowDefenderModal(false);
    if (pendingOnlineGame) {
      handleOnlineInstall(pendingOnlineGame);
      setPendingOnlineGame(null);
    }
  }, [handleOnlineInstall, pendingOnlineGame]);

  const disableDefender = useCallback(async () => {
    setDisablingDefender(true);
    try {
      await invoke('run_defender_disable').catch(() => {});
    } catch {}

    setTimeout(() => {
      defenderAcceptedRef.current = true;
      setShowDefenderModal(false);
      setDisablingDefender(false);
      if (pendingOnlineGame) {
        handleOnlineInstall(pendingOnlineGame);
        setPendingOnlineGame(null);
      }
    }, 1500);
  }, [handleOnlineInstall, pendingOnlineGame]);

  const filteredGames = useMemo(() => {
    const src = activeTab === 'standard' ? games
      : activeTab === 'unique'  ? uniqueGames
      : activeTab === 'adult'   ? adultGames
      : exclusiveGames;
    return src
      .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
      .map(g => steamDescs[g.id] ? { ...g, description: steamDescs[g.id] } : g);
  }, [activeTab, games, uniqueGames, adultGames, exclusiveGames, search, steamDescs]);

  return (
    <div
      key="games-page"
      style={{ padding: '24px 40px 100px', maxWidth: '1500px', margin: '0 auto' }}
    >
      {}
      <div style={{ marginBottom: '24px' }}>
        <input
          style={{
            background: SURFACE.card, border: `1px solid ${SURFACE.border}`, color: SURFACE.textPrimary,
            padding: '11px 16px', outline: 'none', fontSize: '13px', borderRadius: '10px', width: '100%', maxWidth: '420px', fontFamily: 'Inter',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          placeholder="Поиск в базе данных"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => { e.currentTarget.style.borderColor = accent.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent.glow}`; }}
          onBlur={e => { e.currentTarget.style.borderColor = SURFACE.border; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>

      <AnimatePresence>
        {activeTab === 'unique' && !canDownloadUnique && (
          <motion.div key="unique-lock" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: SURFACE.card, border: `1px solid ${SURFACE.border}`, borderRadius: '12px', padding: '16px 22px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '13px', color: SURFACE.textPrimary, margin: 0, fontWeight: 600 }}>{t.uniqueLockedTitle}</p>
              <p style={{ fontSize: '13px', color: SURFACE.textTertiary, margin: '4px 0 0' }}>
                {t.uniqueLockedDesc} <span style={{ color: accent.uniqueColor, fontWeight: 600 }}>Gold</span> {t.uniqueLockedDesc2} <span style={{ color: '#38bdf8', fontWeight: 600 }}>Diamond</span> {t.uniqueLockedDesc3}
              </p>
            </div>
            <button onClick={() => setShowProfile(true)}
              style={{ background: accentGradient(accent.uniqueColor, '#c09459'), border: 'none', color: '#fff', fontSize: '13px', padding: '9px 18px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', borderRadius: '8px', boxShadow: `0 6px 16px -4px ${accent.uniqueColor}66` }}>
              {t.upgradeTierBtn}
            </button>
          </motion.div>
        )}

        {activeTab === 'adult' && (
          <motion.div key="adult-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: SURFACE.card, border: `1px solid ${SURFACE.border}`, borderRadius: '12px', padding: '14px 20px', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: '#c98a96', margin: 0, fontWeight: 600 }}>{t.adultBanner}</p>
          </motion.div>
        )}

        {activeTab === 'exclusive' && (
          <motion.div key="exclusive-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: SURFACE.card, border: `1px solid ${SURFACE.border}`, borderRadius: '12px', padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: EXCLUSIVE_PRIMARY, margin: 0, fontWeight: 600 }}>{t.exclusiveBanner}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6fae87' }} />
              <span style={{ fontSize: '12px', color: '#6fae87', fontWeight: 500 }}>DRM bypass активен</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        <AnimatePresence>
          {filteredGames.map(game => (
            <GameCard
              key={game.id}
              game={game}
              activeTab={activeTab}
              isActivated={activatedGamesIds.includes(Number(game.id))}
              isLoading={loadingAppId === game.id}
              isOnlineLoading={onlineLoadingAppId === game.id}
              canDownload={activeTab === 'adult' ? userCan18 : activeTab === 'exclusive' ? userCanExclusive : canDownloadUnique}
              onActivate={handleActivate}
              onOnlineInstall={handleOnlineWithDefender}
              forceOpen={topOpenGameId === Number(game.id)}
              onForceOpenConsumed={onForceOpenConsumed}
            />
          ))}
        </AnimatePresence>

        {filteredGames.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', fontSize: '14px', color: SURFACE.textTertiary }}>
            {activeTab === 'exclusive' ? t.noExclusiveGames : activeTab === 'adult' ? t.noAdultGames : t.noUniqueGames}
          </div>
        )}
      </div>

      {}
      <AnimatePresence>
        {showDefenderModal && (
          <motion.div
            key="defender-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(4,6,14,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, backdropFilter: 'blur(6px)',
            }}
            onClick={e => { if (e.target === e.currentTarget) { setShowDefenderModal(false); setPendingOnlineGame(null); } }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              style={{
                background: SURFACE.panel,
                border: `1px solid ${SURFACE.borderStrong}`,
                borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '90%',
                boxShadow: '0 24px 60px rgba(4,6,16,0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                  background: '#ea580c1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px',
                }}>
                  ⚠
                </div>
                <div>
                  <p style={{ fontSize: '15px', color: SURFACE.textPrimary, margin: 0, fontWeight: 600 }}>
                    Внимание — Windows Defender
                  </p>
                  <p style={{ fontSize: '12px', color: SURFACE.textTertiary, margin: '3px 0 0' }}>
                    Онлайн-установка — уведомление о безопасности
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: SURFACE.textSecondary, lineHeight: '1.6', margin: '0 0 10px' }}>
                Для корректной работы онлайн-установки необходимо <span style={{ color: '#cf9a68', fontWeight: 600 }}>отключить Windows Defender</span> или добавить папку Steam в исключения.
              </p>
              <p style={{ fontSize: '12px', color: SURFACE.textTertiary, lineHeight: '1.6', margin: '0 0 24px' }}>
                Файлы игр могут содержать крэки и патчи, которые антивирус ошибочно блокирует. Без отключения защиты установка может завершиться ошибкой.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={acceptDefender}
                  style={{
                    background: 'transparent', border: '1px solid #6fae8755',
                    color: '#6fae87', fontSize: '13px',
                    padding: '13px', cursor: 'pointer', fontWeight: 600,
                    borderRadius: '10px',
                  }}
                >
                  Я отключил Defender — продолжить
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={disablingDefender}
                  onClick={disableDefender}
                  style={{
                    background: disablingDefender ? SURFACE.cardHover : accentGradient('#cf9a68', '#c0854e'),
                    border: 'none', color: disablingDefender ? SURFACE.textTertiary : '#fff',
                    fontSize: '13px', padding: '13px',
                    cursor: disablingDefender ? 'not-allowed' : 'pointer', fontWeight: 600,
                    borderRadius: '10px',
                    boxShadow: disablingDefender ? 'none' : '0 8px 20px -6px rgba(251,146,60,0.4)',
                  }}
                >
                  {disablingDefender ? 'Отключение...' : 'Выключить Windows Defender'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
