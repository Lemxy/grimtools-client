import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useTheme, useAuth, useGames } from './context/AppContext';
import { getGlobalStyles } from './constants/colors';
import { CONTENT_TOP_OFFSET, SIDEBAR_WIDTH } from './constants/layout';
import { AuthScreen } from './components/AuthScreen';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CategoryTabsBar } from './components/CategoryTabsBar';
import { GameTab } from './components/GameCard';
import { UpdateBanner } from './components/UpdateBanner';
import { StatusBar } from './components/StatusBar';
import { StatusToast } from './components/StatusToast';
import { GamesPage } from './pages/GamesPage';
import { GamesSectionDisclaimerModal } from './components/modals/GamesSectionDisclaimerModal';
import { FixerDisclaimerModal } from './components/modals/FixerDisclaimerModal';
import { ManualFixDisclaimerModal } from './components/modals/ManualFixDisclaimerModal';
import { OnlineDownloadModal } from './components/modals/OnlineDownloadModal';
import {
  AgeGateModal, WarningModal, RestartModal, LimitOverlay,
  HwidConflictModal,
  WelcomeDisclaimerModal, ProfileModal,
} from './components/modals/AllModals';
import { EmailVerifyModal } from './components/modals/EmailVerifyModal';
import ParticlesBackground from './components/ui/particles-bg';

function AppInner() {
  const { accent, bgPatternId } = useTheme();
  const { userToken } = useAuth();
  const {
    games, uniqueGames, adultGames, exclusiveGames,
    gamesSectionUnlocked, setGamesSectionUnlocked,
    showGamesSectionDisclaimer, setShowGamesSectionDisclaimer,
    showFixerDisclaimer, handleAcceptFixerDisclaimer, handleDeclineFixerDisclaimer,
    showManualFixDisclaimer, handleAcceptManualFixDisclaimer, handleDeclineManualFixDisclaimer,
  } = useGames();

  const [activeTab, setActiveTab] = useState<GameTab>('standard');
  const [topOpenGameId, setTopOpenGameId] = useState<number | null>(null);

  const globalCss = useMemo(() => getGlobalStyles(accent, bgPatternId), [accent, bgPatternId]);
  useEffect(() => {
    let tag = document.getElementById('grim-global-styles') as HTMLStyleElement | null;
    if (!tag) {
      tag = document.createElement('style');
      tag.id = 'grim-global-styles';
      document.head.appendChild(tag);
    }
    tag.textContent = globalCss;
  }, [globalCss]);

  useEffect(() => {
    if (!gamesSectionUnlocked) setShowGamesSectionDisclaimer(true);
  }, []);

  const handleDisclaimerAccept = useCallback(() => {
    setGamesSectionUnlocked(true);
    localStorage.setItem('grim_games_unlocked', 'true');
    setShowGamesSectionDisclaimer(false);
  }, [setGamesSectionUnlocked, setShowGamesSectionDisclaimer]);

  const handleDisclaimerDecline = useCallback(() => {
    setShowGamesSectionDisclaimer(false);
  }, [setShowGamesSectionDisclaimer]);

  const handleTopGameClick = useCallback((gameId: string) => {
    const id = Number(gameId);
    const allGames = [...games, ...uniqueGames, ...adultGames, ...exclusiveGames];
    const found = allGames.find(g => Number(g.id) === id);
    if (!found) return;
    const tab: GameTab = exclusiveGames.some(g => Number(g.id) === id) ? 'exclusive'
      : adultGames.some(g => Number(g.id) === id) ? 'adult'
      : uniqueGames.some(g => Number(g.id) === id) ? 'unique'
      : 'standard';
    setActiveTab(tab);
    setTopOpenGameId(id);
  }, [games, uniqueGames, adultGames, exclusiveGames]);

  const particles = <ParticlesBackground particleColor={accent.primary} lineColor={accent.secondary} />;

  if (!userToken) {
    return (
      <>
        {particles}
        <TitleBar />
        <AuthScreen />
        <WelcomeDisclaimerModal />
        <HwidConflictModal />
      </>
    );
  }

  return (
    <>
      {particles}
      <TitleBar />
      <Sidebar onGameClick={handleTopGameClick} />
      <TopBar />
      <CategoryTabsBar activeTab={activeTab} onTabChange={setActiveTab} />
      <UpdateBanner />

      <div style={{ marginLeft: SIDEBAR_WIDTH, paddingTop: CONTENT_TOP_OFFSET, minHeight: '100vh' }}>
        <AnimatePresence mode="wait">
          {gamesSectionUnlocked && (
            <motion.div
              key="games"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              <GamesPage
                activeTab={activeTab}
                topOpenGameId={topOpenGameId}
                onForceOpenConsumed={() => setTopOpenGameId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <StatusBar />
      <StatusToast />

      <GamesSectionDisclaimerModal
        visible={showGamesSectionDisclaimer}
        onAccept={handleDisclaimerAccept}
        onDecline={handleDisclaimerDecline}
      />

      <FixerDisclaimerModal
        visible={showFixerDisclaimer}
        onAccept={handleAcceptFixerDisclaimer}
        onDecline={handleDeclineFixerDisclaimer}
      />

      <ManualFixDisclaimerModal
        visible={showManualFixDisclaimer}
        onAccept={handleAcceptManualFixDisclaimer}
        onDecline={handleDeclineManualFixDisclaimer}
      />

      <AgeGateModal />
      <WarningModal />
      <RestartModal />
      <LimitOverlay />
      <HwidConflictModal />
      <WelcomeDisclaimerModal />
      <ProfileModal />
      <EmailVerifyModal />
      <OnlineDownloadModal />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
