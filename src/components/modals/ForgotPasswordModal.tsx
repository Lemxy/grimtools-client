import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, useAuth } from '../../context/AppContext';

const Backdrop = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div
    onClick={onClose}
    style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,10,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99000, backdropFilter: 'blur(8px)' }}
  >
    {children}
  </div>
);

export const ForgotPasswordModal = memo(() => {
  const { t, accent } = useTheme();
  const { showForgotPassword, setShowForgotPassword, forgotStep, setForgotStep, handleForgotSendCode, handleForgotSetNewPass } = useAuth();
  const [localEmail, setLocalEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleClose = () => {
    setShowForgotPassword(false);
    setForgotStep('email');
    setLocalEmail(''); setCode(''); setNewPass(''); setConfirmPass('');
    setErrMsg(''); setSuccessMsg('');
  };

  const handleSend = async () => {
    if (!localEmail.trim()) { setErrMsg('Введите ваш email'); return; }
    setLoading(true); setErrMsg('');
    try { await handleForgotSendCode(localEmail.trim()); }
    catch {}
    setLoading(false);
  };

  const handleSetPass = async () => {
    if (!code.trim()) { setErrMsg('Введите код'); return; }
    if (!newPass || newPass.length < 6) { setErrMsg(t.forgotPassShort); return; }
    if (newPass !== confirmPass) { setErrMsg(t.forgotPassMismatch); return; }
    setLoading(true); setErrMsg('');
    try {
      await handleForgotSetNewPass(localEmail.trim(), code.trim(), newPass);
      setSuccessMsg(t.forgotSuccess);
      setTimeout(() => handleClose(), 2500);
    } catch (e: any) {
      setErrMsg(String(e?.message || 'Неверный код или истёк срок действия'));
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0a0a0c',
    border: '1px solid #27272f', borderRadius: '10px',
    color: '#f4f4f5', padding: '12px 16px', outline: 'none',
    fontSize: '14px', fontFamily: 'Inter', boxSizing: 'border-box', transition: 'border-color 0.15s',
  };

  return (
    <AnimatePresence>
      {showForgotPassword && (
        <Backdrop onClose={handleClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '380px', background: '#111114', border: '1px solid #23232b', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}
          >
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #23232b', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f4f4f5', marginBottom: '4px' }}>
                {t.forgotTitle}
              </div>
              <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>
                {forgotStep === 'email' ? t.forgotSubtitle : t.forgotCodeHint}
              </p>
            </div>

            <div style={{ padding: '24px 32px 28px' }}>
              <AnimatePresence mode="wait">
                {successMsg ? (
                  <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: '36px', marginBottom: '14px' }}>✅</div>
                    <p style={{ color: '#6fae87', fontSize: '14px', fontWeight: 600 }}>{successMsg}</p>
                  </motion.div>
                ) : forgotStep === 'email' ? (
                  <motion.div key="email-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px', fontWeight: 500 }}>{t.forgotEmailLabel}</label>
                    <input style={inputStyle} placeholder="user@example.com" value={localEmail} onChange={e => setLocalEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      onFocus={e => (e.currentTarget.style.borderColor = accent.primary)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#27272f')} />
                    {errMsg && <p style={{ fontSize: '12px', color: '#bd7d7d', margin: '8px 0 0' }}>{errMsg}</p>}
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleSend} disabled={loading}
                      style={{ width: '100%', background: accent.primary, border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '14px', padding: '13px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '18px', opacity: loading ? 0.7 : 1 }}>
                      {loading ? t.forgotSending : t.forgotSendCode}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div key="code-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px', fontWeight: 500 }}>{t.forgotCodeLabel}</label>
                    <input style={{ ...inputStyle, letterSpacing: '4px', textAlign: 'center', fontSize: '17px' }} placeholder="000000" maxLength={6}
                      value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onFocus={e => (e.currentTarget.style.borderColor = accent.primary)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#27272f')} />
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px', marginTop: '14px', fontWeight: 500 }}>{t.forgotNewPassLabel}</label>
                    <input type="password" style={inputStyle} placeholder="••••••••"
                      value={newPass} onChange={e => setNewPass(e.target.value)}
                      onFocus={e => (e.currentTarget.style.borderColor = accent.primary)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#27272f')} />
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px', marginTop: '12px', fontWeight: 500 }}>{t.forgotConfirmPassLabel}</label>
                    <input type="password" style={inputStyle} placeholder="••••••••"
                      value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSetPass()}
                      onFocus={e => (e.currentTarget.style.borderColor = accent.primary)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#27272f')} />
                    {errMsg && <p style={{ fontSize: '12px', color: '#bd7d7d', margin: '8px 0 0' }}>{errMsg}</p>}
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleSetPass} disabled={loading}
                      style={{ width: '100%', background: accent.primary, border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '14px', padding: '13px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '18px', opacity: loading ? 0.7 : 1 }}>
                      {loading ? t.forgotSetting : t.forgotSetPass}
                    </motion.button>
                    <button onClick={() => { setForgotStep('email'); setErrMsg(''); }}
                      style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '12px', cursor: 'pointer', width: '100%', marginTop: '10px', padding: '6px' }}>
                      {t.forgotBack}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>
  );
});
