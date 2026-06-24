import { memo, useEffect, useState } from 'react';
import { useTheme, useGames, Game } from '../context/AppContext';
import { SURFACE, EXCLUSIVE_PRIMARY, accentGradient } from '../constants/colors';
import { SIDEBAR_WIDTH } from '../constants/layout';

const API_BASE = 'https://api.example-backend.invalid';

interface TopGame { game_id: string; game_name: string; count: number; }

const RANK_COLORS = ['#c9a55e', '#d4d4d8', '#c9a283', '#71717a', '#52525b'];

type CategoryInfo = { label: string; color: string };

const CATEGORY_MAP: Record<string, CategoryInfo> = {
  standard:  { label: 'Стандарт',   color: '#a1a1aa' },
  unique:    { label: 'Уникальная', color: '#cfa873' },
  adult:     { label: '18+',        color: '#c98a96' },
  exclusive: { label: 'Эксклюзив',  color: EXCLUSIVE_PRIMARY },
};

function getCategory(gameId: string, uniqueGames: Game[], adultGames: Game[], exclusiveGames: Game[]): CategoryInfo {
  const id = Number(gameId);
  if (exclusiveGames.some(g => Number(g.id) === id)) return CATEGORY_MAP.exclusive;
  if (adultGames.some(g => Number(g.id) === id)) return CATEGORY_MAP.adult;
  if (uniqueGames.some(g => Number(g.id) === id)) return CATEGORY_MAP.unique;
  return CATEGORY_MAP.standard;
}

function getSteamImage(gameId: string) {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${gameId}/header.jpg`;
}

interface SidebarProps {
  onGameClick: (gameId: string) => void;
}

export const Sidebar = memo(({ onGameClick }: SidebarProps) => {
  const { accent } = useTheme();
  const { uniqueGames, adultGames, exclusiveGames } = useGames();
  const [top, setTop] = useState<TopGame[]>([]);

  useEffect(() => {
    const fetchTop = () => {
      fetch(`${API_BASE}/api/top-games`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setTop(data); })
        .catch(() => {});
    };
    fetchTop();
    const id = setInterval(fetchTop, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <aside
      style={{
        position: 'fixed', left: 0, top: '32px', bottom: 0, width: SIDEBAR_WIDTH,
        background: `${SURFACE.panel}26`,
        backdropFilter: 'blur(1px)',
        zIndex: 200,
        display: 'flex', flexDirection: 'column',
        padding: '20px 16px',
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 600, color: SURFACE.textPrimary, marginBottom: '14px' }}>
        Топ игр по активациям
      </div>

      {top.length === 0 ? (
        <div style={{
          border: `1px solid ${SURFACE.border}`, borderRadius: '12px',
          padding: '20px 14px', textAlign: 'center',
          fontSize: '12px', color: SURFACE.textTertiary,
        }}>
          Данные появятся после первых активаций
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {top.map((game, i) => {
            const cat = getCategory(game.game_id, uniqueGames, adultGames, exclusiveGames);
            return (
              <div
                key={game.game_id}
                onClick={() => onGameClick(game.game_id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: `${SURFACE.card}b3`, border: `1px solid ${SURFACE.border}`,
                  backdropFilter: 'blur(6px)',
                  borderRadius: '10px', padding: '8px', cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${SURFACE.cardHover}cc`; e.currentTarget.style.borderColor = SURFACE.borderStrong; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${SURFACE.card}b3`; e.currentTarget.style.borderColor = SURFACE.border; }}
              >
                <div style={{ position: 'relative', width: '52px', height: '36px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', background: SURFACE.panel }}>
                  <img
                    src={getSteamImage(game.game_id)}
                    alt={game.game_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{
                    position: 'absolute', top: '2px', left: '2px',
                    width: '15px', height: '15px', borderRadius: '4px',
                    background: 'rgba(8,10,20,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 700,
                    color: RANK_COLORS[i] || SURFACE.textTertiary,
                  }}>
                    {i + 1}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px', fontWeight: 500, color: SURFACE.textSecondary,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px',
                  }}>
                    {game.game_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1, background: SURFACE.panel, borderRadius: '2px', height: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '2px',
                        width: `${Math.round((game.count / (top[0]?.count || 1)) * 100)}%`,
                        background: accentGradient(accent.primary, accent.secondary),
                      }} />
                    </div>
                    <span style={{ fontSize: '10px', color: cat.color, flexShrink: 0, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {cat.label} · {game.count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
});
