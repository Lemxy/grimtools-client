import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../context/AppContext';
import { SURFACE } from '../constants/colors';

export const StatusToast = memo(() => {
  const { statusMsg, statusType, statusToken } = useUI();

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (statusType === 'info') { setVisible(false); return; }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 4500);
    return () => clearTimeout(timer);
  }, [statusToken, statusType]);

  const color = statusType === 'error' ? '#d96b6b' : '#6fae87';
  const dotColor = statusType === 'error' ? '#ef4444' : '#22c55e';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={statusToken}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', bottom: '88px', right: '24px', zIndex: 99999,
            background: SURFACE.panel, border: `1px solid ${SURFACE.borderStrong}`,
            borderRadius: '12px', padding: '14px 18px', minWidth: '260px', maxWidth: '380px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColor, marginTop: '5px', flexShrink: 0 }} />
            <span style={{ color, fontSize: '13px', fontWeight: 500, lineHeight: 1.5 }}>{statusMsg}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
