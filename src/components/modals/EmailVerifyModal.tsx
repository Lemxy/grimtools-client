import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, useAuth } from '../../context/AppContext';

export const EmailVerifyModal = memo(() => {
  const { t, accent } = useTheme();
  const { showEmailVerify, email, contactEmail, pendingLinkEmail, handleSendVerifyEmail, handleVerifyEmailCode } = useAuth();
  const targetEmail = pendingLinkEmail || contactEmail || email;
  const [step, setStep] = useState<'send' | 'code' | 'change'>('send');
  const [code, setCode] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (showEmailVerify) { setStep('code'); setCode(''); setNewEmailInput(''); setErrMsg(''); setSuccessMsg(''); setLoading(false); setResendCooldown(60); }
  }, [showEmailVerify]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const iv = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(iv);
  }, [resendCooldown]);

  const handleSend = async () => {
    setLoading(true); setErrMsg('');
    try {
      await handleSendVerifyEmail(pendingLinkEmail || undefined);
      setStep('code');
      setResendCooldown(60);
    } catch {}
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!code.trim() || code.length < 6) { setErrMsg('Введите 6-значный код'); return; }
    setLoading(true); setErrMsg('');
    try {
      await handleVerifyEmailCode(code.trim());
      setSuccessMsg(t.emailVerifySuccess);
    } catch (e: any) {
      setErrMsg(String(e?.message || 'Неверный код'));
    }
    setLoading(false);
  };

  const openChangeEmail = () => {
    setNewEmailInput(targetEmail || '');
    setErrMsg('');
    setStep('change');
  };

  const cancelChangeEmail = () => {
    setErrMsg('');
    setStep('code');
  };

  const handleChangeEmail = async () => {
    const trimmed = newEmailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) { setErrMsg('Введите корректный email'); return; }
    if (trimmed === targetEmail.toLowerCase()) { setErrMsg('Это тот же самый email'); return; }
    setLoading(true); setErrMsg('');
    try {
      await handleSendVerifyEmail(trimmed);
      setCode('');
      setStep('code');
      setResendCooldown(60);
    } catch (e: any) {
      setErrMsg(String(e?.message || 'Ошибка отправки'));
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0a0a0c',
    border: '1px solid #27272f', borderRadius: '10px',
    color: '#f4f4f5', padding: '14px 16px', outline: 'none',
    fontSize: '22px', letterSpacing: '6px', fontFamily: 'Inter',
    fontWeight: 600, boxSizing: 'border-box', textAlign: 'center',
    transition: 'border-color 0.15s',
  };

  return (
    <AnimatePresence>
      {showEmailVerify && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,10,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 98000, backdropFilter: 'blur(10px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '420px', background: '#111114', border: '1px solid #23232b', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}
          >
            <div style={{ padding: '28px 32px', borderBottom: '1px solid #23232b', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>✉️</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f4f4f5', marginBottom: '4px' }}>
                {t.emailVerifyTitle}
              </div>
              <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>
                {t.emailVerifySubtitle}
              </p>
            </div>

            <div style={{ padding: '24px 32px 28px' }}>
              <AnimatePresence mode="wait">
                {successMsg ? (
                  <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '10px 0 16px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
                    <p style={{ color: '#6fae87', fontSize: '14px', fontWeight: 600 }}>{successMsg}</p>
                  </motion.div>
                ) : step === 'send' ? (
                  <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: '1.6', marginBottom: '20px' }}>
                      {t.emailVerifyDesc}
                    </p>
                    {targetEmail && (
                      <div style={{ background: '#15151a', borderRadius: '10px', padding: '10px 16px', marginBottom: '18px', textAlign: 'center' }}>
                        <span style={{ fontSize: '13px', color: accent.primary, fontWeight: 600 }}>{targetEmail}</span>
                      </div>
                    )}
                    {errMsg && <p style={{ fontSize: '12px', color: '#bd7d7d', margin: '0 0 12px' }}>{errMsg}</p>}
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleSend} disabled={loading}
                      style={{ width: '100%', background: accent.primary, border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '14px', padding: '13px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                      {loading ? t.emailVerifySending : t.emailVerifySend}
                    </motion.button>
                  </motion.div>
                ) : step === 'code' ? (
                  <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p style={{ fontSize: '13px', color: '#71717a', marginBottom: '14px', textAlign: 'center' }}>
                      {t.emailVerifyCodeHint} <span style={{ color: accent.primary, fontWeight: 600 }}>{targetEmail}</span>
                    </p>
                    <input style={inputStyle} placeholder="000000" maxLength={6}
                      value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={e => e.key === 'Enter' && handleVerify()}
                      onFocus={e => (e.currentTarget.style.borderColor = accent.primary)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#27272f')}
                      autoFocus />
                    {errMsg && <p style={{ fontSize: '12px', color: '#bd7d7d', margin: '10px 0 0', textAlign: 'center' }}>{errMsg}</p>}
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleVerify} disabled={loading || code.length < 6}
                      style={{ width: '100%', background: code.length === 6 ? accent.primary : '#1a1a20', border: 'none', borderRadius: '10px', color: code.length === 6 ? '#fff' : '#52525b', fontWeight: 600, fontSize: '14px', padding: '13px', cursor: (loading || code.length < 6) ? 'not-allowed' : 'pointer', marginTop: '18px', marginBottom: '10px', opacity: loading ? 0.7 : 1 }}>
                      {loading ? t.emailVerifyVerifying : t.emailVerifyConfirm}
                    </motion.button>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => resendCooldown === 0 && handleSend()}
                        style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? '#3f3f46' : '#71717a', fontSize: '12px', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', padding: '4px 8px' }}>
                        {resendCooldown > 0 ? `${t.emailVerifyResend} (${resendCooldown}s)` : t.emailVerifyResend}
                      </button>
                      <span style={{ color: '#3f3f46', fontSize: '12px' }}>•</span>
                      <button onClick={openChangeEmail}
                        style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '12px', cursor: 'pointer', padding: '4px 8px' }}>
                        Ошибся в email?
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="change" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: '1.6', marginBottom: '16px' }}>
                      Введите правильный адрес — мы отправим код подтверждения на него.
                    </p>
                    <input
                      type="email" placeholder="you@example.com"
                      value={newEmailInput} onChange={e => setNewEmailInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleChangeEmail()}
                      onFocus={e => (e.currentTarget.style.borderColor = accent.primary)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#27272f')}
                      autoFocus
                      style={{
                        width: '100%', background: '#0a0a0c',
                        border: '1px solid #27272f', borderRadius: '10px',
                        color: '#f4f4f5', padding: '13px 16px', outline: 'none',
                        fontSize: '14px', fontFamily: 'Inter',
                        boxSizing: 'border-box', textAlign: 'center',
                      }}
                    />
                    {errMsg && <p style={{ fontSize: '12px', color: '#bd7d7d', margin: '10px 0 0', textAlign: 'center' }}>{errMsg}</p>}
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleChangeEmail} disabled={loading || !newEmailInput.trim()}
                      style={{ width: '100%', background: accent.primary, border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '14px', padding: '13px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '18px', marginBottom: '10px', opacity: loading ? 0.7 : 1 }}>
                      {loading ? t.emailVerifySending : 'Отправить код на новый email'}
                    </motion.button>
                    <div style={{ textAlign: 'center' }}>
                      <button onClick={cancelChangeEmail} disabled={loading}
                        style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer', padding: '4px 8px' }}>
                        Отмена
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
