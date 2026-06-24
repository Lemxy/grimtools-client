import { memo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/AppContext';

interface UpdateInfo {
  version: string;
  notes: string;
  url: string;
  mandatory: boolean;
}

export const UpdateBanner = memo(() => {
  const { accent } = useTheme();
  const [update, setUpdate]       = useState<UpdateInfo | null>(null);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [phase, setPhase]         = useState<'downloading' | 'installing'>('downloading');

  useEffect(() => {
    if (!installing) { setProgress(0); return; }
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return p;
        return p + Math.random() * 5;
      });
    }, 250);
    return () => clearInterval(id);
  }, [installing]);

  const startUpdate = useCallback(async (info: UpdateInfo) => {
    setInstalling(true);
    setPhase('downloading');
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      setPhase('installing');
      setProgress(95);
      await invoke('apply_update', { url: info.url });
      setProgress(100);
    } catch (e) {
      console.error(e);
      setInstalling(false);
    }
  }, []);

  const checkUpdate = useCallback(async () => {
    if (installing) return;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const info = await invoke<UpdateInfo | null>('check_for_update');
      if (info) {
        setUpdate(info);
        startUpdate(info);
      }
    } catch {}
  }, [installing, startUpdate]);

  useEffect(() => {
    checkUpdate();
    const id = setInterval(checkUpdate, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [checkUpdate]);

  return (
    <AnimatePresence>
      {installing && update && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(8,8,10,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 12, opacity: 0 }}
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
              {phase === 'downloading' ? 'Загрузка обновления' : 'Установка'}
            </div>

            <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '4px' }}>
              Версия {update.version}
            </div>

            {update.notes && (
              <div style={{ fontSize: '13px', color: '#52525b', marginBottom: '24px', lineHeight: 1.5 }}>
                {update.notes}
              </div>
            )}

            <div style={{
              background: '#1a1a20', borderRadius: '6px',
              height: '6px', overflow: 'hidden', marginBottom: '10px',
            }}>
              <motion.div
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ height: '100%', background: accent.primary, borderRadius: '6px' }}
              />
            </div>

            <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 500 }}>
              {Math.round(Math.min(progress, 100))}% — пожалуйста, подождите
            </div>

            <div style={{ fontSize: '11px', color: '#52525b', marginTop: '16px' }}>
              Приложение перезапустится автоматически
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
