import { memo, useCallback } from 'react';
import { useTheme, useUI, useAuth } from '../context/AppContext';
import { GameTab } from './GameCard';
import { EXCLUSIVE_PRIMARY, EXCLUSIVE_SECONDARY, SURFACE, accentGradient } from '../constants/colors';
import { SIDEBAR_WIDTH, TITLEBAR_HEIGHT, TOPBAR_HEIGHT, TABS_BAR_HEIGHT } from '../constants/layout';

interface CategoryTabsBarProps {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
}

export const CategoryTabsBar = memo(({ activeTab, onTabChange }: CategoryTabsBarProps) => {
  const { t, accent } = useTheme();
  const { ageVerified, setShowAgeGate } = useUI();
  const { canDownloadUnique, userCan18, userCanExclusive, userTier } = useAuth();

  const handleTabClick = useCallback((tab: GameTab) => {
    if (tab === 'adult' && userCan18 && !ageVerified) {
      setShowAgeGate(true); return;
    }
    onTabChange(tab);
  }, [userCan18, ageVerified, setShowAgeGate, onTabChange]);

  return (
    <div
      style={{
        position: 'fixed', top: `${TITLEBAR_HEIGHT + TOPBAR_HEIGHT}px`, left: SIDEBAR_WIDTH, right: 0, height: `${TABS_BAR_HEIGHT}px`,
        background: `${SURFACE.panel}26`,
        backdropFilter: 'blur(1px)',
        zIndex: 190,
        display: 'flex', alignItems: 'center', gap: '4px', padding: '0 20px',
      }}
    >
      <TabItem
        active={activeTab === 'standard'} label={t.tabStandard}
        onClick={() => handleTabClick('standard')} activeColor={accent.primary} activeSecondary={accent.secondary}
      />
      <TabItem
        active={activeTab === 'unique'} label={t.tabUnique}
        onClick={() => handleTabClick('unique')} activeColor={accent.uniqueColor} activeSecondary="#c09459"
        badge={canDownloadUnique
          ? { label: userTier, color: '#fff', bg: accent.uniqueColor }
          : { label: t.tabViewOnly, color: accent.uniqueColor, bg: `${accent.uniqueColor}1a` }
        }
      />
      <TabItem
        active={activeTab === 'adult'} label={t.tabAdult}
        onClick={() => handleTabClick('adult')} activeColor="#c98a96" activeSecondary="#b87280"
        badge={userCan18
          ? { label: 'Silver+', color: '#fff', bg: '#c98a96' }
          : { label: t.tabViewOnly, color: '#c98a96', bg: '#c98a961a' }
        }
      />
      <TabItem
        active={activeTab === 'exclusive'} label={t.tabExclusive}
        onClick={() => handleTabClick('exclusive')} activeColor={EXCLUSIVE_PRIMARY} activeSecondary={EXCLUSIVE_SECONDARY}
        badge={userCanExclusive
          ? { label: 'Diamond', color: '#fff', bg: EXCLUSIVE_PRIMARY }
          : { label: t.tabViewOnly, color: EXCLUSIVE_PRIMARY, bg: `${EXCLUSIVE_PRIMARY}1a` }
        }
      />
    </div>
  );
});

interface BadgeProps { label: string; bg: string; color: string; }
const TabItem = memo(({ active, label, onClick, activeColor, activeSecondary, badge }: {
  active: boolean; label: React.ReactNode; onClick: () => void;
  activeColor: string; activeSecondary?: string; badge?: BadgeProps;
}) => (
  <div
    onClick={onClick}
    style={{
      padding: '8px 14px', cursor: 'pointer',
      fontSize: '13px', fontWeight: 600,
      color: active ? '#fff' : SURFACE.textSecondary,
      background: active ? accentGradient(activeColor, activeSecondary ?? activeColor) : 'transparent',
      boxShadow: active ? `0 4px 14px -4px ${activeColor}66` : 'none',
      borderRadius: '8px',
      transition: 'background 0.15s, color 0.15s, box-shadow 0.15s', userSelect: 'none',
      display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = SURFACE.cardHover; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
  >
    {label}
    {badge && (
      <span style={{
        background: active ? 'rgba(255,255,255,0.2)' : badge.bg, color: active ? '#fff' : badge.color,
        fontSize: '10px', padding: '2px 7px', borderRadius: '999px',
        fontWeight: 600,
      }}>
        {badge.label}
      </span>
    )}
  </div>
));
