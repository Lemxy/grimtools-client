import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Gift, KeyRound, LogOut, ShieldCheck, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useTheme, useUI, useAuth, useGames } from '../../context/AppContext';
import { STAFF_COLOR, accentGradient } from '../../constants/colors';
import { ACCENT_COLORS, FONT_SIZES, FontSizeId } from '../../constants/colors';
import { Lang } from '../../constants/translations';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button, buttonVariants } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { AlertCard } from '../ui/card-8';

const Backdrop = ({ children, zIndex = 1000, onClick }: { children: React.ReactNode; zIndex?: number; onClick?: () => void }) => (
  <div onClick={onClick} style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,10,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex, backdropFilter: 'blur(10px)' }}>
    {children}
  </div>
);

const PrimaryBtn = ({ children, onClick, color, disabled }: { children: React.ReactNode; onClick?: () => void; color: string; disabled?: boolean }) => (
  <motion.button whileTap={disabled ? {} : { scale: 0.98 }} disabled={disabled} onClick={onClick}
    style={{ flex: 1, background: disabled ? '#1a1a20' : color, border: 'none', color: disabled ? '#52525b' : '#fff', padding: '13px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '13px', borderRadius: '10px' }}>
    {children}
  </motion.button>
);

const SecondaryBtn = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
    style={{ flex: 1, background: '#1a1a20', border: '1px solid #27272f', color: '#a1a1aa', padding: '13px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', borderRadius: '10px' }}>
    {children}
  </motion.button>
);

export const AgeGateModal = memo(() => {
  const { t } = useTheme();
  const { showAgeGate, setShowAgeGate, setAgeVerified } = useUI();
  const onConfirm = () => {
    setAgeVerified(true);
    localStorage.setItem('grim_age_ok', 'true');
    setShowAgeGate(false);
  };
  const onDecline = () => setShowAgeGate(false);

  return (
    <AnimatePresence>
      {showAgeGate && (
        <Backdrop zIndex={9000}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#111114', border: '1px solid #23232b', width: '420px', padding: '40px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', borderRadius: '16px' }}
          >
            <h1 style={{ color: '#f4f4f5', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>{t.ageGateTitle}</h1>
            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 20px' }}>{t.ageGateSubtitle}</p>
            <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: '1.6', marginBottom: '28px' }}>
              {t.ageGateDesc}<br />{t.ageGateQuestion} <span style={{ color: '#f4f4f5', fontWeight: 600 }}>{t.ageGateAge}</span>?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <PrimaryBtn onClick={onConfirm} color="#c98a96">{t.ageGateYes}</PrimaryBtn>
              <SecondaryBtn onClick={onDecline}>{t.ageGateNo}</SecondaryBtn>
            </div>
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>
  );
});

export const WarningModal = memo(() => {
  const { t, accent } = useTheme();
  const { showWarning, handleInstallCore, isInstallingCore } = useGames();
  return (
    <AnimatePresence>
      {showWarning && (
        <Backdrop>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#111114', padding: '36px', border: '1px solid #23232b', borderRadius: '16px', textAlign: 'center', width: '380px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: '#f4f4f5', fontWeight: 700, fontSize: '18px', marginBottom: '10px' }}>{t.criticalInit}</h2>
            <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: '1.6', marginBottom: '24px' }}>{t.criticalInitDesc}</p>
            <motion.button disabled={isInstallingCore} whileTap={!isInstallingCore ? { scale: 0.98 } : {}} onClick={handleInstallCore}
              style={{ background: isInstallingCore ? '#1a1a20' : accent.primary, border: 'none', color: isInstallingCore ? '#52525b' : '#fff', fontSize: '14px', padding: '13px', borderRadius: '10px', cursor: isInstallingCore ? 'not-allowed' : 'pointer', width: '100%', fontWeight: 600 }}>
              {isInstallingCore ? t.deploying : t.deployCore}
            </motion.button>
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>
  );
});

export const RestartModal = memo(() => {
  const { t } = useTheme();
  const { showRestartModal, setShowRestartModal, handleFullRestart } = useGames();
  return (
    <AnimatePresence>
      {showRestartModal && (
        <Backdrop>
          <div onClick={e => e.stopPropagation()}>
            <AlertCard
              isVisible={true}
              tone="success"
              icon={<CheckCircle2 className="h-6 w-6 text-white" />}
              title={t.injectionSuccess}
              description={t.injectionSuccessDesc}
              buttonText={t.restartNow}
              onButtonClick={handleFullRestart}
              secondaryButtonText={t.later}
              onSecondaryClick={() => setShowRestartModal(false)}
            />
          </div>
        </Backdrop>
      )}
    </AnimatePresence>
  );
});

export const LimitOverlay = memo(() => {
  const { t, accent } = useTheme();
  const { setShowProfile } = useUI();
  const { showLimitOverlay, setShowLimitOverlay, limitCountdown } = useGames();
  return (
    <AnimatePresence>
      {showLimitOverlay && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,8,10,0.92)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} transition={{ duration: 0.2 }}
            style={{ textAlign: 'center', maxWidth: '440px', padding: '20px' }}>
            <h1 style={{ fontSize: '24px', color: '#f4f4f5', fontWeight: 700, margin: '0 0 6px' }}>{t.accessLimit}</h1>
            <h2 style={{ fontSize: '14px', color: '#71717a', fontWeight: 500, margin: '0 0 32px' }}>{t.quotaExhausted}</h2>
            <div style={{ background: '#111114', border: '1px solid #23232b', borderRadius: '16px', padding: '24px 32px', marginBottom: '28px' }}>
              <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 8px' }}>{t.limitResetsIn}</p>
              <motion.p key={limitCountdown} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}
                style={{ fontSize: '30px', color: '#f4f4f5', fontWeight: 700, margin: 0 }}>{limitCountdown || '—'}</motion.p>
              <p style={{ fontSize: '12px', color: '#52525b', marginTop: '8px' }}>{t.limitResetAuto}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#111114', border: '1px solid #23232b', borderRadius: '12px', padding: '14px 18px', textAlign: 'left' }}>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px', fontWeight: 600 }}>{t.option1}</p>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>{t.option1Desc}</p>
              </div>
              <motion.button whileTap={{ scale: 0.98 }}
                onClick={() => { setShowLimitOverlay(false); setShowProfile(true); }}
                style={{ background: accent.primary, border: 'none', color: '#fff', fontSize: '14px', padding: '14px', cursor: 'pointer', fontWeight: 600, borderRadius: '12px', textAlign: 'left' }}>
                <p style={{ margin: '0 0 2px', fontSize: '11px', opacity: 0.75 }}>{t.option2}</p>
                {t.option2Btn}
              </motion.button>
              <button onClick={() => setShowLimitOverlay(false)}
                style={{ background: 'none', border: 'none', color: '#52525b', fontSize: '12px', cursor: 'pointer', padding: '8px' }}>{t.dismiss}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export const SyncModal = memo(() => {
  const { t, accent } = useTheme();
  const { showSyncModal, setShowSyncModal, isCheckingUp, syncProgress, syncStatus, syncFiles, syncDone, syncTotal } = useGames();
  return (
    <AnimatePresence>
      {showSyncModal && (
        <Backdrop>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.18 }} onClick={e => e.stopPropagation()}
            style={{ background: '#111114', border: '1px solid #23232b', width: '520px', maxWidth: '95vw', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '22px 26px', borderBottom: '1px solid #23232b', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ color: '#f4f4f5', margin: 0, fontSize: '16px', fontWeight: 700 }}>{t.integritySyncTitle}</h2>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '3px 0 0' }}>{t.integritySyncSubtitle}</p>
              </div>
              {!isCheckingUp && (
                <button onClick={() => setShowSyncModal(false)} style={{ background: '#1a1a20', border: 'none', borderRadius: '8px', color: '#a1a1aa', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>Закрыть</button>
              )}
            </div>
            <div style={{ padding: '22px 26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                <span style={{ fontSize: '30px', fontWeight: 700, color: accent.primary, lineHeight: 1 }}>{syncProgress}%</span>
                <span style={{ fontSize: '12px', color: '#71717a' }}>{syncDone} / {syncTotal} игр</span>
              </div>
              <div style={{ background: '#1a1a20', borderRadius: '6px', height: '6px', overflow: 'hidden', marginBottom: '14px' }}>
                <motion.div animate={{ width: `${syncProgress}%` }} transition={{ duration: 0.4 }}
                  style={{ height: '100%', background: accent.primary, borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                {isCheckingUp && <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent.primary }} />}
                <span style={{ fontSize: '13px', color: isCheckingUp ? accent.primary : '#71717a' }}>{syncStatus}</span>
              </div>
              <div style={{ background: '#0a0a0c', border: '1px solid #1f1f27', borderRadius: '10px', maxHeight: '220px', overflowY: 'auto' }}>
                {syncFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderBottom: i < syncFiles.length - 1 ? '1px solid #18181f' : 'none' }}>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                      background: f.status === 'done' ? '#6fae87' : f.status === 'error' ? '#b47272' : f.status === 'syncing' ? accent.primary : '#3f3f46',
                    }} />
                    <span style={{ fontSize: '13px', flex: 1, color: f.status === 'done' ? '#71717a' : f.status === 'error' ? '#bd7d7d' : f.status === 'syncing' ? '#f4f4f5' : '#52525b' }}>{f.name}</span>
                    <span style={{ fontSize: '11px', color: f.status === 'done' ? '#6fae87' : f.status === 'error' ? '#bd7d7d' : f.status === 'syncing' ? accent.primary : '#3f3f46' }}>
                      {f.status === 'pending' ? t.queued : f.status === 'syncing' ? t.downloading : f.status === 'done' ? t.depotOk : t.failed}
                    </span>
                  </div>
                ))}
              </div>
              {!isCheckingUp && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} whileTap={{ scale: 0.98 }} onClick={() => setShowSyncModal(false)}
                  style={{ width: '100%', marginTop: '16px', background: accent.primary, border: 'none', color: '#fff', fontSize: '13px', padding: '13px', cursor: 'pointer', fontWeight: 600, borderRadius: '10px' }}>
                  {t.closeSyncPanel}
                </motion.button>
              )}
            </div>
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>
  );
});

export const SyncModeSelectModal = memo(() => {
  const { t, accent } = useTheme();
  const { showSyncModeSelect, setShowSyncModeSelect, syncModeSelectedGame, setSyncModeSelectedGame, runIntegritySyncClassic, runIntegritySyncManifestTool, games, uniqueGames, adultGames, exclusiveGames, activatedGamesIds } = useGames();
  const allGames = [...games, ...uniqueGames, ...adultGames, ...exclusiveGames];
  return (
    <AnimatePresence>
      {showSyncModeSelect && (
        <Backdrop zIndex={9500}>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }} onClick={e => e.stopPropagation()}
            style={{ background: '#111114', border: '1px solid #23232b', width: '520px', maxWidth: '95vw', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '22px 26px', borderBottom: '1px solid #23232b', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div>
                <h2 style={{ color: '#f4f4f5', margin: 0, fontSize: '16px', fontWeight: 700 }}>{t.integritySyncSelectTitle}</h2>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '3px 0 0' }}>{t.integritySyncSelectSubtitle}</p>
              </div>
              <button onClick={() => setShowSyncModeSelect(false)} style={{ marginLeft: 'auto', background: '#1a1a20', border: 'none', borderRadius: '8px', color: '#a1a1aa', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>Закрыть</button>
            </div>
            <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#15151a', border: '1px solid #23232b', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: accent.primary, fontWeight: 600, margin: '0 0 6px' }}>1. {t.integritySyncMode1Label}</p>
                  <p style={{ fontSize: '13px', color: '#71717a', margin: 0, lineHeight: '1.6' }}>{t.integritySyncMode1Desc}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#52525b', margin: '0 0 8px' }}>{t.integritySyncSelectGame}</p>
                  <select value={syncModeSelectedGame} onChange={e => setSyncModeSelectedGame(e.target.value)}
                    style={{ width: '100%', background: '#1a1a20', border: '1px solid #27272f', color: '#d4d4d8', fontSize: '13px', padding: '10px 12px', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontFamily: 'Inter' }}>
                    <option value="__all__">{t.integritySyncSelectAll}</option>
                    {allGames.filter(g => activatedGamesIds.includes(Number(g.id))).map(g => (
                      <option key={g.id} value={String(g.id)}>{g.name} (ID {g.id})</option>
                    ))}
                  </select>
                </div>
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => runIntegritySyncClassic(syncModeSelectedGame)}
                  style={{ background: accent.primary, border: 'none', color: '#fff', fontSize: '13px', padding: '11px', cursor: 'pointer', fontWeight: 600, borderRadius: '8px' }}>
                  {t.integritySyncRunSelected}
                </motion.button>
              </div>
              <div style={{ background: '#15151a', border: '1px solid #23232b', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#6fae87', fontWeight: 600, margin: '0 0 6px' }}>2. {t.integritySyncMode2Label}</p>
                  <p style={{ fontSize: '13px', color: '#71717a', margin: 0, lineHeight: '1.6' }}>{t.integritySyncMode2Desc}</p>
                  <p style={{ fontSize: '12px', color: '#52525b', margin: '8px 0 0', fontFamily: 'monospace' }}>irm "https://manifest-tool.example.invalid/install.ps1" → 1 → Enter</p>
                </div>
                <motion.button whileTap={{ scale: 0.98 }} onClick={runIntegritySyncManifestTool}
                  style={{ background: '#4a9268', border: 'none', color: '#fff', fontSize: '13px', padding: '11px', cursor: 'pointer', fontWeight: 600, borderRadius: '8px' }}>
                  {t.integritySyncMode2Label}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>
  );
});

export const HwidConflictModal = memo(() => {
  const { t, accent } = useTheme();
  const { hwidConflictEmail, setHwidConflictEmail } = useAuth();
  return (
    <AnimatePresence>
      {hwidConflictEmail && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(8,8,10,0.85)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }} transition={{ duration: 0.18 }}
            style={{ background: '#111114', border: '1px solid #23232b', width: '420px', padding: '40px', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <h1 style={{ color: '#f4f4f5', fontSize: '18px', fontWeight: 700, margin: '0 0 10px' }}>{t.hwidConflictTitle}</h1>
            <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: '1.6', margin: '0 0 20px' }}>{t.hwidConflictDesc}</p>
            <div style={{ background: '#15151a', border: '1px solid #23232b', borderRadius: '12px', padding: '14px 18px', marginBottom: '18px' }}>
              <p style={{ fontSize: '11px', color: '#71717a', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Зарегистрированный аккаунт</p>
              <p style={{ fontSize: '14px', color: accent.primary, margin: 0, fontWeight: 600, wordBreak: 'break-all' }}>{hwidConflictEmail}</p>
            </div>
            <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 24px' }}>{t.hwidConflictHint}</p>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setHwidConflictEmail('')}
              style={{ background: accent.primary, border: 'none', color: '#fff', fontSize: '13px', padding: '13px 28px', cursor: 'pointer', fontWeight: 600, borderRadius: '10px' }}>
              {t.hwidConflictClose}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export const WelcomeDisclaimerModal = memo(() => {
  const { accent } = useTheme();
  const { showDisclaimer, setShowDisclaimer, handleLogout } = useAuth();
  return (
    <AnimatePresence>
      {showDisclaimer && (
        <Backdrop zIndex={4000}>
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }} onClick={e => e.stopPropagation()}
            style={{ background: '#111114', border: '1px solid #23232b', width: '480px', maxWidth: '95vw', maxHeight: '80vh', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '22px 26px', borderBottom: '1px solid #23232b' }}>
              <h2 style={{ color: '#f4f4f5', margin: 0, fontSize: '16px', fontWeight: 700 }}>Пользовательское соглашение</h2>
              <p style={{ fontSize: '12px', color: '#71717a', margin: '5px 0 0' }}>Прочитайте перед использованием</p>
            </div>
            <div style={{ overflowY: 'auto', padding: '18px 26px', flex: 1, maxHeight: '380px' }}>
              {[
                ['1. Общие положения', 'Используя GrimUnlocked, пользователь подтверждает, что ознакомился с настоящим соглашением и принимает все его условия.'],
                ['2. Использование на собственный риск', 'Использование GrimUnlocked осуществляется исключительно на риск пользователя. Администрация не несёт ответственности за любые последствия.'],
                ['3. Аккаунты', 'Пользователь принимает ответственность за сохранность своих аккаунтов. Администрация не несёт ответственности за ограничения, блокировки или удаление аккаунтов.'],
                ['4. Работа ПО', 'GrimUnlocked не гарантирует стабильную работу всех функций. Разработчики вправе изменять функциональность без уведомления.'],
                ['5. Отсутствие гарантий', 'ПО предоставляется «КАК ЕСТЬ» без гарантий работоспособности, доступности или совместимости.'],
                ['6. Ограничение ответственности', 'Администрация не несёт ответственности за потерю данных, файлов, финансовые убытки или любой ущерб.'],
              ].map(([title, body]) => (
                <div key={title} style={{ marginBottom: '14px' }}>
                  <p style={{ fontSize: '13px', color: '#f4f4f5', margin: '0 0 4px', fontWeight: 600 }}>{title}</p>
                  <p style={{ fontSize: '13px', color: '#71717a', margin: 0, lineHeight: '1.65' }}>{body}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '18px 26px', borderTop: '1px solid #23232b', display: 'flex', gap: '10px' }}>
              <PrimaryBtn color={accent.primary} onClick={() => { localStorage.setItem('grim_welcome_seen', 'true'); setShowDisclaimer(false); }}>
                Принять и продолжить
              </PrimaryBtn>
              <SecondaryBtn onClick={() => { setShowDisclaimer(false); handleLogout(); }}>
                Отказаться
              </SecondaryBtn>
            </div>
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>
  );
});

export const ProfileModal = memo(() => {
  const {
    t, accent, lang, setLang, openUrl,
    accentId, setAccent, resetAllColors,
    fontSizeId, setFontSize,
  } = useTheme();
  const { showProfile, setShowProfile } = useUI();
  const {
    handleLogout,
    email, userTier, tierColor, tierShimmerClass, tierExpiry, limitReset,
    hwid,
    myReferralCode, referralUsedCount,
    newReferralCode, setNewReferralCode, referralCopied, referralCreating,
    handleCreateReferralCode, handleCopyReferral,
    keyCode, setKeyCode, handleActivateKey,
    emailVerified, contactEmail, setShowEmailVerify, handleSendVerifyEmail,
  } = useAuth();
  const { handleReinstallCore, isReinstalingCore } = useGames();

  const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const displayEmail = contactEmail || email;
  const hasRealEmail = isValidEmail(displayEmail);
  const [linkEmailInput, setLinkEmailInput] = useState('');
  const [linkEmailLoading, setLinkEmailLoading] = useState(false);
  const [linkEmailErr, setLinkEmailErr] = useState('');

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  useEffect(() => {
    if (!showProfile) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [showProfile]);

  const glassCard = 'rounded-2xl border border-border bg-card/60 backdrop-blur-xl';

  return (
    <AnimatePresence>
      {showProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,10,0.55)', zIndex: 1100, backdropFilter: 'blur(4px)' }} onClick={() => setShowProfile(false)}>
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 240 }} onClick={e => e.stopPropagation()}
            className="bg-background border-l border-border"
            style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '400px', zIndex: 1100, display: 'flex', flexDirection: 'column', boxShadow: '-24px 0 60px rgba(2,4,16,0.55)' }}>

            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'profile' | 'settings')} className="flex flex-1 flex-col gap-0 overflow-hidden">
            <div className="flex-shrink-0 border-b border-border">
              <div style={{ padding: '24px 28px 0' }}>
                <div className="mb-[18px] flex items-center gap-3.5">
                  <Avatar className="h-[42px] w-[42px]" style={{ border: `2px solid ${accent.primary}` }}>
                    <AvatarFallback style={{ background: accentGradient(accent.primary, accent.secondary), color: '#fff', fontWeight: 700 }}>
                      {(email || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="text-muted-foreground" style={{ fontSize: '11px', margin: '0 0 3px' }}>{t.loggedAs}</p>
                    <p className="text-foreground" style={{ fontSize: '13px', margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email || t.authorizedUser}</p>
                  </div>
                  <button onClick={() => setShowProfile(false)} className="text-muted-foreground hover:text-foreground"
                    style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>×</button>
                </div>

                <TabsList className="w-full">
                  <TabsTrigger value="profile" className="flex-1">{t.profile || 'Профиль'}</TabsTrigger>
                  <TabsTrigger value="settings" className="flex-1">Настройки</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="profile" style={{ padding: '22px 28px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>

                  <div className={glassCard} style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: '11px', margin: '0 0 6px' }}>{t.currentRank}</p>
                      {tierShimmerClass ? (
                        <span className={tierShimmerClass} style={{ fontSize: '18px', fontWeight: 700 }}>{userTier}</span>
                      ) : (
                        <span style={{ fontSize: '18px', color: tierColor, fontWeight: 700 }}>{userTier}</span>
                      )}
                      {userTier === 'STAFF' && <p style={{ fontSize: '11px', color: STAFF_COLOR, margin: '4px 0 0' }}>{t.staffLabel}</p>}
                    </div>
                    {tierExpiry && (
                      <div style={{ textAlign: 'right' }}>
                        <p className="text-muted-foreground" style={{ fontSize: '11px', margin: '0 0 4px' }}>{t.subExpires}</p>
                        <p className="text-foreground" style={{ fontSize: '13px', margin: 0, fontWeight: 600 }}>{tierExpiry}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '20px' }}>
                    {}
                    <AccessCard
                      label={t.limitStatus}
                      value={userTier === 'DIAMOND' ? t.activationsUnlimited : (limitReset === 'READY' ? t.limitAvailable : `${t.limitResetIn} ${limitReset}`)}
                      color={userTier === 'DIAMOND' || limitReset === 'READY' ? '#6fae87' : undefined}
                    />
                    <div className={glassCard} style={{ padding: '12px 14px' }}>
                      <p className="text-muted-foreground" style={{ fontSize: '11px', margin: '0 0 4px' }}>{t.hwid}</p>
                      <p className="text-muted-foreground" style={{ fontSize: '12px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hwid ? hwid.substring(0, 20) + '...' : '—'}</p>
                    </div>
                  </div>

                  <div className={glassCard} style={{ marginBottom: '16px', overflow: 'hidden', borderColor: emailVerified ? undefined : 'rgba(220,38,38,0.3)' }}>
                    <div className="border-b border-border flex items-center justify-between" style={{ padding: '10px 14px' }}>
                      <p style={{ fontSize: '12px', margin: 0, fontWeight: 600, color: emailVerified ? '#6fae87' : '#bd7d7d' }} className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {emailVerified ? 'Email подтверждён' : hasRealEmail ? 'Email не подтверждён' : 'Email не привязан'}
                      </p>
                    </div>
                    <div style={{ padding: '14px' }}>
                      {emailVerified || hasRealEmail ? (
                        <>
                          <p className="text-foreground/80" style={{ fontSize: '13px', margin: '0 0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayEmail}
                          </p>
                          {!emailVerified && (
                            <motion.button whileTap={{ scale: 0.98 }}
                              onClick={async () => {
                                try { await handleSendVerifyEmail(); } catch {}
                                setShowEmailVerify(true);
                              }}
                              className={buttonVariants({ variant: 'destructive' })} style={{ width: '100%', padding: '12px' }}>
                              Подтвердить email
                            </motion.button>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-muted-foreground" style={{ fontSize: '13px', margin: '0 0 12px', lineHeight: '1.5' }}>
                            Привяжите реальную почту — нужна для сброса пароля и верификации.
                          </p>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={linkEmailInput}
                            onChange={e => { setLinkEmailInput(e.target.value); setLinkEmailErr(''); }}
                            style={{ marginBottom: '8px' }}
                          />
                          {linkEmailErr && <p style={{ fontSize: '12px', color: '#bd7d7d', margin: '0 0 8px' }}>{linkEmailErr}</p>}
                          <motion.button whileTap={{ scale: 0.98 }}
                            disabled={linkEmailLoading || !linkEmailInput.trim()}
                            onClick={async () => {
                              const emailRegexLocal = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                              if (!emailRegexLocal.test(linkEmailInput.trim())) { setLinkEmailErr('Введите корректный email'); return; }
                              setLinkEmailLoading(true); setLinkEmailErr('');
                              try {
                                await handleSendVerifyEmail(linkEmailInput.trim());
                                setShowEmailVerify(true);
                                setLinkEmailInput('');
                              } catch { setLinkEmailErr('Ошибка отправки — попробуйте ещё раз'); }
                              setLinkEmailLoading(false);
                            }}
                            className={buttonVariants({ variant: linkEmailInput.trim() ? 'destructive' : 'secondary' })}
                            style={{ width: '100%', padding: '12px', opacity: linkEmailLoading ? 0.7 : 1 }}>
                            {linkEmailLoading ? 'Отправка...' : 'Привязать email'}
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={glassCard} style={{ marginBottom: '20px', overflow: 'hidden' }}>
                    <div className="border-b border-border" style={{ padding: '10px 14px' }}>
                      <p style={{ fontSize: '12px', color: accent.primary, margin: 0, fontWeight: 600 }} className="flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5" />
                        {t.myReferralCode}
                      </p>
                    </div>
                    <div style={{ padding: '14px' }}>
                      {myReferralCode ? (
                        <>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <Input readOnly value={myReferralCode} style={{ fontWeight: 700, letterSpacing: '1px', textAlign: 'center', color: accent.primary }} />
                            <motion.button whileTap={{ scale: 0.95 }} onClick={handleCopyReferral}
                              className={buttonVariants({ variant: referralCopied ? 'default' : 'secondary' })}
                              style={{ background: referralCopied ? '#4a9268' : undefined, whiteSpace: 'nowrap' }}>
                              {referralCopied ? t.referralCopied : t.referralCopy}
                            </motion.button>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="text-muted-foreground" style={{ fontSize: '12px' }}>{t.referralUsedBy}: <span style={{ color: accent.primary, fontWeight: 600 }}>{referralUsedCount}</span></span>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-muted-foreground" style={{ fontSize: '13px', margin: '0 0 12px' }}>{t.referralCodeNone}</p>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <Input style={{ textTransform: 'uppercase' }}
                              placeholder={t.referralCodePlaceholder} value={newReferralCode} onChange={e => setNewReferralCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateReferralCode()} />
                            <motion.button whileTap={{ scale: 0.95 }} onClick={handleCreateReferralCode} disabled={!newReferralCode.trim() || referralCreating}
                              className={buttonVariants({ variant: newReferralCode.trim() ? 'default' : 'secondary' })}
                              style={{ background: newReferralCode.trim() ? accentGradient(accent.primary, accent.secondary) : undefined, whiteSpace: 'nowrap' }}>
                              {referralCreating ? '...' : t.referralCodeCreate}
                            </motion.button>
                          </div>
                          <p className="text-muted-foreground/60" style={{ fontSize: '11px', margin: 0 }}>{t.referralCodeOnce}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <p className="text-muted-foreground" style={{ fontSize: '11px', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Приобрести тариф</p>
                    <div
                      onClick={() => openUrl('https://funpay.com/users/8580085/')}
                      className={glassCard} style={{ cursor: 'pointer', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ea580c1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#cf9a68', fontWeight: 700, flexShrink: 0 }}>$</div>
                      <div>
                        <p className="text-foreground" style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>FLEMXY — FunPay</p>
                        <p className="text-muted-foreground" style={{ margin: '2px 0 0', fontSize: '12px' }}>funpay.com/users/8580085</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <p className="text-muted-foreground" style={{ fontSize: '11px', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{t.redeemKey}</p>
                    <Input
                      placeholder={t.keyPlaceholder} value={keyCode} onChange={e => setKeyCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleActivateKey()} />
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleActivateKey}
                      className={buttonVariants({ variant: 'default' })}
                      style={{ background: accentGradient(accent.primary, accent.secondary), width: '100%', marginTop: '10px', padding: '13px' }}>
                      <KeyRound className="h-4 w-4" />
                      {t.upgradeSystem}
                    </motion.button>
                  </div>

                  <div className="border-t border-border" style={{ paddingTop: '18px' }}>
                    <motion.button whileTap={{ scale: 0.98 }}
                      onClick={() => { setShowProfile(false); handleLogout(); }}
                      className={buttonVariants({ variant: 'outline' })} style={{ width: '100%', padding: '12px' }}>
                      <LogOut className="h-4 w-4" />
                      {t.logout}
                    </motion.button>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="settings" style={{ padding: '22px 28px' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>

                  <div style={{ marginBottom: '24px' }}>
                    <p className="text-muted-foreground" style={{ fontSize: '11px', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{t.language}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['en', 'ru'] as Lang[]).map(l => (
                        <Button key={l} variant={lang === l ? 'default' : 'secondary'} onClick={() => setLang(l)}
                          style={{ flex: 1, background: lang === l ? accentGradient(accent.primary, accent.secondary) : undefined }}>
                          {l === 'en' ? 'EN' : 'RU'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <p className="text-muted-foreground" style={{ fontSize: '11px', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{t.interfaceColor}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '8px' }}>
                      {ACCENT_COLORS.map(c => (
                        <div key={c.id} onClick={() => setAccent(c.id)} title={c.label}
                          style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', background: c.primary, cursor: 'pointer', border: accentId === c.id ? '2px solid #fff' : '2px solid transparent' }} />
                      ))}
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: '12px', marginTop: '8px' }}>{t.selectedColor} {ACCENT_COLORS.find(c => c.id === accentId)?.label}</p>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <p className="text-muted-foreground" style={{ fontSize: '11px', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{t.fontSize}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                      {FONT_SIZES.map(f => (
                        <Button key={f.id} size="sm" variant={fontSizeId === f.id ? 'default' : 'secondary'} onClick={() => setFontSize(f.id as FontSizeId)}
                          style={{ background: fontSizeId === f.id ? accentGradient(accent.primary, accent.secondary) : undefined }}>
                          {f.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" onClick={resetAllColors} style={{ width: '100%' }}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t.resetColors}
                  </Button>

                  <div className="border-t border-border" style={{ marginTop: '24px', paddingTop: '20px' }}>
                    <p className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: '11px', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Переинициализация ядра
                    </p>
                    <p className="text-muted-foreground" style={{ fontSize: '12px', margin: '0 0 12px', lineHeight: 1.5 }}>
                      Удаляет папку SteamTools и заново скачивает все компоненты ядра.
                    </p>
                    <Button
                      variant="outline"
                      disabled={isReinstalingCore}
                      onClick={handleReinstallCore}
                      style={{ width: '100%' }}
                    >
                      {isReinstalingCore ? 'Переинициализация...' : 'Переинициализировать ядро'}
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>
            </div>
            </Tabs>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

const AccessCard = memo(({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl" style={{ padding: '12px 14px' }}>
    <p className="text-muted-foreground" style={{ fontSize: '11px', margin: '0 0 5px' }}>{label}</p>
    {color ? (
      <Badge style={{ background: `${color}1f`, color, borderColor: `${color}40` }}>{value}</Badge>
    ) : (
      <p className="text-muted-foreground" style={{ fontSize: '13px', margin: 0, fontWeight: 600 }}>{value}</p>
    )}
  </div>
));
