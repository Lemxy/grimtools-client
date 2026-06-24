import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTheme, useUI, useAuth } from '../context/AppContext';
import { SURFACE } from '../constants/colors';
import { SIDEBAR_WIDTH } from '../constants/layout';

export const StatusBar = memo(() => {
  const { t, accent } = useTheme();
  const { statusMsg } = useUI();
  const { userTier, tierColor, tierShimmerClass, limitReset, activationsRemaining } = useAuth();
  const activationsDisplay = activationsRemaining === Infinity ? t.activationsUnlimited : String(activationsRemaining);
  const activationsColor = activationsRemaining === Infinity || activationsRemaining > 0 ? SURFACE.textPrimary : '#d96b6b';

  return (
    <div
      style={{
        position: 'fixed', bottom: '20px', left: `calc(${SIDEBAR_WIDTH} + 20px)`, right: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: `${SURFACE.card}d9`,
        backdropFilter: 'blur(8px)',
        padding: '12px 20px',
        border: `1px solid ${SURFACE.borderStrong}`,
        zIndex: 100, borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(2,4,16,0.45)',
      }}
    >
      <div style={{ display: 'flex', gap: '24px' }}>
        <StatusItem label={t.tierLabel} value={userTier} color={tierColor} shimmerClass={tierShimmerClass} />
        {}
        {userTier !== 'DIAMOND' && <StatusItem label={t.limitReset} value={limitReset} />}
        <StatusItem label={t.activationsLeft} value={activationsDisplay} color={activationsColor} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: SURFACE.textSecondary, fontWeight: 500 }}>
          {statusMsg}
        </span>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: accent.primary,
          }}
        />
      </div>
    </div>
  );
});

const StatusItem = memo(({ label, value, color = SURFACE.textPrimary, shimmerClass }: {
  label: string; value: string; color?: string; shimmerClass?: string;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    <span style={{ fontSize: '10px', color: SURFACE.textTertiary, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
    {shimmerClass ? (
      <span className={shimmerClass} style={{ fontSize: '13px', fontWeight: 600 }}>{value}</span>
    ) : (
      <span style={{ fontSize: '13px', color, fontWeight: 600 }}>{value}</span>
    )}
  </div>
));
