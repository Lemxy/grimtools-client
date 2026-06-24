import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXCLUSIVE_PRIMARY, EXCLUSIVE_SECONDARY, SURFACE, ELEVATION, accentGradient, cardGlow } from '../constants/colors';
import { useTheme } from '../context/AppContext';
import { Game } from '../context/AppContext';
import { cn } from '@/lib/utils';

const REST_TILT_STYLE: React.CSSProperties = {
  transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
  transition: 'transform 0.4s ease-in-out, box-shadow 0.3s, border-color 0.3s',
  borderColor: SURFACE.borderStrong,
  boxShadow: '0 24px 60px rgba(4,6,16,0.6)',
};

export type GameTab = 'standard' | 'unique' | 'adult' | 'exclusive';

interface GameCardProps {
  game: Game;
  activeTab: GameTab;
  isActivated: boolean;
  isLoading: boolean;
  isOnlineLoading: boolean;
  canDownload: boolean;
  onActivate: (game: Game) => void;
  onOnlineInstall: (game: Game) => void;
  forceOpen?: boolean;
  onForceOpenConsumed?: () => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  unique: 'Уникальная',
  adult: '18+',
  exclusive: 'Эксклюзив',
};

export const GameCard = memo(({
  game, activeTab, isActivated, isLoading, isOnlineLoading, canDownload, onActivate, onOnlineInstall,
  forceOpen, onForceOpenConsumed,
}: GameCardProps) => {
  const { t, accent } = useTheme();
  const [open, setOpen] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedModal, setCopiedModal] = useState(false);
  const [cardHover, setCardHover] = useState(false);

  const activatingRef = useRef(false);
  useEffect(() => { if (!isLoading) activatingRef.current = false; }, [isLoading]);

  const prevActivatedRef = useRef(isActivated);
  useEffect(() => {
    if (!prevActivatedRef.current && isActivated && open) setOpen(false);
    prevActivatedRef.current = isActivated;
  }, [isActivated, open]);

  const modalRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>(REST_TILT_STYLE);

  const copyAppId = (e: React.MouseEvent, which: 'card' | 'modal') => {
    e.stopPropagation();
    navigator.clipboard?.writeText(String(game.id)).catch(() => {});
    if (which === 'card') {
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 1200);
    } else {
      setCopiedModal(true);
      setTimeout(() => setCopiedModal(false), 1200);
    }
  };

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      onForceOpenConsumed?.();
    }
  }, [forceOpen]);

  const isUnique = activeTab === 'unique';
  const isAdult  = activeTab === 'adult';
  const isExclusive = activeTab === 'exclusive';

  const accentColor = isUnique ? '#cfa873' : isAdult ? '#c98a96' : isExclusive ? EXCLUSIVE_PRIMARY : accent.primary;
  const accentColorSecondary = isUnique ? '#c09459' : isAdult ? '#b87280' : isExclusive ? EXCLUSIVE_SECONDARY : accent.secondary;
  const categoryLabel = isUnique ? CATEGORY_LABEL.unique : isAdult ? CATEGORY_LABEL.adult : isExclusive ? CATEGORY_LABEL.exclusive : null;

  const addBtnStyle = useMemo(() => ({
    width: '100%', padding: '13px', border: 'none', borderRadius: '10px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    fontSize: '14px', fontWeight: 600,
    background: isLoading   ? SURFACE.cardHover
              : isActivated ? accentGradient('#6fae87', '#5d9773')
              : accentGradient(accentColor, accentColorSecondary),
    boxShadow: isLoading ? 'none' : `0 8px 20px -6px ${isActivated ? 'rgba(34,197,94,0.4)' : `${accentColor}66`}`,
    color: isLoading ? SURFACE.textTertiary : '#fff',
  }), [isLoading, isActivated, accentColor, accentColorSecondary]);

  const handleModalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = modalRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const rotateX = (y - height / 2) / (height / 2) * -5; 
    const rotateY = (x - width / 2) / (width / 2) * 5;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`,
      transition: 'transform 0.1s ease-out, box-shadow 0.2s, border-color 0.2s',
      borderColor: `${accentColor}66`,
      boxShadow: cardGlow(accentColor, `${accentColor}40`),
    });
  };

  const handleModalMouseLeave = () => setTiltStyle(REST_TILT_STYLE);

  return (
    <>
      {}
      {}
      <motion.div
        initial={{ opacity: 0, y: 56, rotateX: 22, filter: 'blur(5px)' }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-60px' }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -3 }}
        onHoverStart={() => setCardHover(true)}
        onHoverEnd={() => setCardHover(false)}
        style={{
          background: SURFACE.card,
          border: `1px solid ${cardHover ? `${accentColor}66` : SURFACE.border}`,
          borderRadius: '14px', overflow: 'hidden',
          boxShadow: cardHover ? cardGlow(accentColor, `${accentColor}40`) : ELEVATION.sm,
          cursor: 'pointer',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          perspective: 800,
        }}
        onClick={() => setOpen(true)}
      >
        {}
        <div style={{ position: 'relative', height: '160px', overflow: 'hidden', background: SURFACE.panel }}>
          <img
            src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.id}/header.jpg`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.dataset.fallback) {
                img.dataset.fallback = '1';
                img.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/capsule_616x353.jpg`;
              } else if (img.dataset.fallback === '1') {
                img.dataset.fallback = '2';
                img.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/header.jpg`;
              } else {
                img.style.display = 'none';
              }
            }}
          />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(180deg, transparent 55%, rgba(5,7,15,0.55) 100%)',
          }} />

          {}
          {categoryLabel && (
            <div style={{
              position: 'absolute', top: '10px', left: '10px',
              background: 'rgba(8,10,20,0.82)', border: `1px solid ${accentColor}55`,
              color: accentColor, padding: '4px 9px', fontSize: '11px', fontWeight: 600,
              borderRadius: '999px', backdropFilter: 'blur(4px)',
            }}>
              {categoryLabel}
            </div>
          )}

          {}
          <div
            onClick={(e) => copyAppId(e, 'card')}
            title={t.appIdCopied}
            style={{
              position: 'absolute', top: '10px', right: '10px',
              background: copiedCard ? 'rgba(22,101,52,0.85)' : 'rgba(8,10,20,0.78)',
              padding: '4px 9px', fontSize: '11px', fontWeight: 500,
              color: copiedCard ? '#8cbd9c' : SURFACE.textSecondary,
              borderRadius: '999px', cursor: 'pointer', userSelect: 'none',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {copiedCard ? t.appIdCopied : `ID ${game.id}`}
          </div>

          {}
          {game.online && (
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(8,10,20,0.78)', borderRadius: '999px', padding: '3px 8px', backdropFilter: 'blur(4px)' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#cf9a68' }} />
              <span style={{ fontSize: '10px', color: '#cf9a68', fontWeight: 600 }}>Online</span>
            </div>
          )}
        </div>

        {}
        <div style={{ padding: '16px' }}>
          {isExclusive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: EXCLUSIVE_PRIMARY }} />
              <span style={{ fontSize: '11px', color: EXCLUSIVE_PRIMARY, fontWeight: 500 }}>DRM снят</span>
            </div>
          )}
          <div style={{ fontSize: '14px', color: SURFACE.textPrimary, fontWeight: 600, marginBottom: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {game.name}
          </div>
          <button
            onClick={e => { e.stopPropagation(); setOpen(true); }}
            style={{
              width: '100%', padding: '10px', border: `1px solid ${SURFACE.border}`,
              background: 'transparent', color: SURFACE.textSecondary,
              fontSize: '13px', fontWeight: 500,
              borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = SURFACE.cardHover; e.currentTarget.style.borderColor = accentColor; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = SURFACE.border; }}
          >
            Подробнее
          </button>
        </div>
      </motion.div>

      {}
      <AnimatePresence>
        {open && (
          <motion.div
            key="game-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              backdropFilter: 'blur(8px)',
              background: 'rgba(4,6,14,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              key="game-modal-card"
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '500px', maxWidth: '92vw' }}
            >
              <div
                ref={modalRef}
                onMouseMove={handleModalMouseMove}
                onMouseLeave={handleModalMouseLeave}
                style={{
                  borderColor: tiltStyle.borderColor, boxShadow: tiltStyle.boxShadow,
                  transform: tiltStyle.transform, transition: tiltStyle.transition,
                }}
                className={cn('relative w-full rounded-2xl border bg-card overflow-hidden transform-style-3d')}
              >
                {}
                <div className="relative h-[220px] overflow-hidden" style={{ transform: 'translateZ(-15px)' }}>
                  <img
                    src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.id}/header.jpg`}
                    alt={game.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ transform: 'scale(1.04)' }}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.fallback) {
                        img.dataset.fallback = '1';
                        img.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/capsule_616x353.jpg`;
                      } else if (img.dataset.fallback === '1') {
                        img.dataset.fallback = '2';
                        img.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/header.jpg`;
                      } else {
                        img.style.display = 'none';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/35" />

                  {}
                  <div className="absolute inset-x-3 top-3 flex items-start justify-between" style={{ transform: 'translateZ(35px)' }}>
                    {categoryLabel ? (
                      <div
                        className="rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm"
                        style={{ background: 'rgba(8,10,20,0.78)', border: `1px solid ${accentColor}55`, color: accentColor }}
                      >
                        {categoryLabel}
                      </div>
                    ) : <span />}
                    <button
                      onClick={() => setOpen(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {}
                <div className="p-4" style={{ transform: 'translateZ(20px)' }}>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur-md">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold leading-tight text-white">{game.name}</h3>
                      <div
                        onClick={(e) => copyAppId(e, 'modal')}
                        title={t.appIdCopied}
                        className={cn(
                          'shrink-0 cursor-pointer select-none rounded-full px-3 py-1 text-xs font-medium transition-colors',
                          copiedModal ? 'bg-green-700/70 text-green-300' : 'bg-white/10 text-white/80'
                        )}
                      >
                        {copiedModal ? t.appIdCopied : `ID ${game.id}`}
                      </div>
                    </div>

                    {isExclusive && (
                      <div className="mb-2 flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: EXCLUSIVE_PRIMARY }} />
                        <span className="text-xs font-medium" style={{ color: EXCLUSIVE_PRIMARY }}>DRM снят — защита отсутствует</span>
                      </div>
                    )}

                    <p className="mb-3 max-h-[110px] overflow-y-auto text-sm leading-relaxed text-white/70">
                      {game.description || t.noDesc}
                    </p>

                    <div className="flex flex-col gap-2">
                      {game.online && (
                        <motion.button
                          disabled={isOnlineLoading || isLoading}
                          onClick={() => { setOpen(false); onOnlineInstall(game); }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            width: '100%', padding: '13px',
                            border: 'none',
                            background: isOnlineLoading ? SURFACE.cardHover : accentGradient('#cf9a68', '#c0854e'),
                            color: isOnlineLoading ? SURFACE.textTertiary : '#fff',
                            fontWeight: 600, borderRadius: '10px',
                            cursor: isOnlineLoading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            boxShadow: isOnlineLoading ? 'none' : '0 8px 20px -6px rgba(251,146,60,0.4)',
                          }}
                        >
                          {isOnlineLoading ? t.downloadingOnline : t.online}
                        </motion.button>
                      )}

                      {(isUnique || isAdult || isExclusive) && !canDownload ? (
                        <button disabled style={{
                          width: '100%', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontWeight: 600,
                          border: '1px solid rgba(255,255,255,0.1)',
                          cursor: 'not-allowed', padding: '13px', borderRadius: '10px',
                          fontSize: '13px',
                        }}>
                          {isExclusive ? t.exclusiveRequired : isAdult ? t.silverRequired : t.goldRequired}
                        </button>
                      ) : (
                        <motion.button
                          disabled={isLoading}
                          onClick={() => {
                            if (isLoading || activatingRef.current) return;
                            activatingRef.current = true;
                            onActivate(game);
                          }}
                          whileTap={{ scale: 0.98 }}
                          style={addBtnStyle}
                        >
                          {isLoading ? t.injecting : isActivated ? t.successAdded : t.addToLibrary}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
