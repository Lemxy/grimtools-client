import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/AppContext';

interface Props {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const WARN_COLOR = '#cfa873';

export const ManualFixDisclaimerModal = memo(({ visible, onAccept, onDecline }: Props) => {
  const { t } = useTheme();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 6000,
            background: 'rgba(8,8,10,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            style={{
              background: '#111114',
              border: '1px solid #23232b',
              width: '460px', maxWidth: '95vw',
              borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
              maxHeight: '88vh',
            }}
          >
            <div style={{ padding: '22px 26px', borderBottom: '1px solid #23232b', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${WARN_COLOR}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  🛡
                </div>
                <div>
                  <h2 style={{ color: '#f4f4f5', margin: 0, fontSize: '15px', fontWeight: 700 }}>
                    {t.manualFixDisclaimerTitle}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '3px 0 0' }}>
                    {t.manualFixDisclaimerSubtitle}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ overflowY: 'auto', padding: '18px 26px', flex: 1 }}>
              <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0, lineHeight: '1.7' }}>
                {t.manualFixDisclaimerBody}
              </p>
            </div>

            <div style={{ padding: '18px 26px', borderTop: '1px solid #23232b', display: 'flex', gap: '10px', flexShrink: 0 }}>
              <motion.button whileTap={{ scale: 0.98 }} onClick={onAccept}
                style={{ flex: 1, background: WARN_COLOR, border: 'none', color: '#1a0f00', fontSize: '13px', padding: '13px', cursor: 'pointer', fontWeight: 600, borderRadius: '10px' }}>
                {t.manualFixDisclaimerAccept}
              </motion.button>
              <motion.button whileTap={{ scale: 0.98 }} onClick={onDecline}
                style={{ background: '#1a1a20', border: '1px solid #27272f', color: '#a1a1aa', fontSize: '12px', padding: '13px 18px', cursor: 'pointer', fontWeight: 600, borderRadius: '10px' }}>
                {t.manualFixDisclaimerDecline}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
