import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, useGames } from '../../context/AppContext';

export const OnlineDownloadModal = memo(() => {
  const { accent } = useTheme();
  const { onlineDownload } = useGames();

  return (
    <AnimatePresence>
      {onlineDownload && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(8,8,10,0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 9700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            style={{
              background: '#111114',
              border: '1px solid #23232b',
              borderRadius: '16px', padding: '44px 48px',
              textAlign: 'center', width: '420px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{
                width: '40px', height: '40px', margin: '0 auto 24px',
                border: '3px solid #23232b',
                borderTopColor: accent.primary,
                borderRadius: '50%',
              }}
            />

            <div style={{ fontSize: '17px', fontWeight: 600, color: '#f4f4f5', marginBottom: '6px' }}>
              Загрузка online
            </div>

            <div style={{
              fontSize: '13px', color: '#71717a', marginBottom: '20px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {onlineDownload.gameName}
            </div>

            <div style={{
              background: '#1a1a20', borderRadius: '6px',
              height: '7px', overflow: 'hidden', marginBottom: '10px',
            }}>
              <motion.div
                animate={{ width: `${Math.min(onlineDownload.percent, 100)}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ height: '100%', background: accent.primary, borderRadius: '6px' }}
              />
            </div>

            <div style={{ fontSize: '14px', color: accent.primary, fontWeight: 600, marginBottom: '12px' }}>
              {Math.round(Math.min(onlineDownload.percent, 100))}%
            </div>

            <div style={{ fontSize: '12px', color: '#52525b', marginBottom: '4px' }}>
              Файл {Math.min(onlineDownload.fileIndex + 1, onlineDownload.totalFiles)} из {onlineDownload.totalFiles}
            </div>

            {onlineDownload.fileName && (
              <div style={{
                fontSize: '12px', color: '#3f3f46',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {onlineDownload.fileName}
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#3f3f46', marginTop: '20px' }}>
              Не закрывайте приложение во время загрузки
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
