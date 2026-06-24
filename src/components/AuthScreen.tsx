import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, useAuth } from '../context/AppContext';
import { ForgotPasswordModal } from './modals/ForgotPasswordModal';

export const AuthScreen = memo(() => {
  const { t, accent } = useTheme();
  const {
    hwid,
    authMode, setAuthMode, authStep, setAuthStep,
    email, setEmail, pass, setPass,
    authStatusMsg, authStatusType,
    handleAuth,
    setShowForgotPassword,
  } = useAuth();

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#0a0a0c' }}>
      <motion.div animate={{ x: [0, 24, 0], y: [0, -16, 0] }} transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
        style={{ position: 'absolute', width: '420px', height: '420px', borderRadius: '50%', background: `radial-gradient(circle,${accent.primary}10 0%,transparent 70%)`, top: '-120px', left: '-120px', pointerEvents: 'none' }} />
      <motion.div animate={{ x: [0, -16, 0], y: [0, 24, 0] }} transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut', delay: 1.5 }}
        style={{ position: 'absolute', width: '360px', height: '360px', borderRadius: '50%', background: `radial-gradient(circle,${accent.secondary}0c 0%,transparent 70%)`, bottom: '-100px', right: '-100px', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: '400px', background: '#111114', border: '1px solid #23232b', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', overflow: 'hidden', position: 'relative' }}
      >
        <div style={{ padding: '36px 36px 22px', textAlign: 'center' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px', background: accent.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px', color: '#fff', fontWeight: 700, fontSize: '18px',
          }}>
            G
          </div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#f4f4f5', marginBottom: '4px' }}>
            {t.appTitle}<span style={{ color: accent.primary }}>{t.appTitleAccent}</span>
          </div>
          <p style={{ fontSize: '13px', color: '#71717a', margin: 0 }}>{t.grimAuth}</p>
        </div>

        <AnimatePresence>
          {authStep === 'credentials' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', borderBottom: '1px solid #23232b', borderTop: '1px solid #23232b' }}>
              {(['login', 'register'] as const).map(mode => (
                <button key={mode} onClick={() => { setAuthMode(mode); setAuthStep('credentials'); }}
                  style={{
                    flex: 1, background: 'none', border: 'none',
                    borderBottom: authMode === mode ? `2px solid ${accent.primary}` : '2px solid transparent',
                    color: authMode === mode ? accent.primary : '#71717a',
                    fontSize: '13px', fontWeight: 600, padding: '13px', cursor: 'pointer',
                    transition: 'color 0.15s', marginBottom: '-1px',
                  }}>
                  {mode === 'login' ? t.loginTab : t.registerTab}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ padding: '28px 36px 32px' }}>
          <AnimatePresence mode="wait">
            {authStep === 'credentials' ? (
              <motion.div key="creds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <FieldGroup label={authMode === 'login' ? (t.emailOrUsernamePlaceholder ?? 'Email или логин') : t.emailPlaceholder}>
                  <input
                    type={authMode === 'register' ? 'email' : 'text'}
                    autoComplete={authMode === 'register' ? 'email' : 'username'}
                    style={inputStyle()}
                    placeholder={authMode === 'login' ? 'user@example.com' : 'user@example.com'}
                    value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()}
                    onFocus={e => { e.currentTarget.style.borderColor = accent.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent.glow}`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#27272f'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </FieldGroup>
                <FieldGroup label={t.passwordPlaceholder}>
                  <input type="password"
                    style={inputStyle()} placeholder="••••••••"
                    value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()}
                    onFocus={e => { e.currentTarget.style.borderColor = accent.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent.glow}`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#27272f'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </FieldGroup>
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleAuth}
                  style={{ width: '100%', background: accent.primary, border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '14px', padding: '13px', cursor: 'pointer', marginBottom: '12px' }}>
                  {t.enterSystem}
                </motion.button>
                {authMode === 'login' && (
                  <button onClick={() => setShowForgotPassword(true)}
                    style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '12px', cursor: 'pointer', width: '100%', marginBottom: '12px', padding: '4px' }}>
                    {t.forgotPassword}
                  </button>
                )}
                <p style={{ fontSize: '11px', color: '#3f3f46', textAlign: 'center', margin: 0 }}>
                  {t.hwid}: {hwid ? hwid.substring(0, 18) + '...' : 'Загрузка...'}
                </p>
              </motion.div>
            ) : (
              <ReferralStep />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {authStatusMsg && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }}
            style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#15151a', border: `1px solid ${authStatusType === 'error' ? '#a86565' : '#4a9268'}55`, padding: '14px 18px', minWidth: '260px', zIndex: 99999, borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: authStatusType === 'error' ? '#a86565' : '#4a9268' }} />
              <span style={{ color: '#f4f4f5', fontSize: '13px', fontWeight: 500 }}>{authStatusMsg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ForgotPasswordModal />
    </div>
  );
});

const ReferralStep = memo(() => {
  const { t, accent } = useTheme();
  const { handleReferralApply, handleReferralSkip } = useAuth();
  const [code, setCode] = useState('');
  return (
    <motion.div key="ref" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <h2 style={{ color: '#f4f4f5', fontSize: '17px', fontWeight: 600, margin: '0 0 8px', textAlign: 'center' }}>{t.referralStepTitle}</h2>
      <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 24px', textAlign: 'center', lineHeight: 1.6 }}>{t.referralStepDesc}</p>
      <input
        style={{ ...inputStyle(), textAlign: 'center', fontSize: '15px', letterSpacing: '2px', textTransform: 'uppercase' }}
        placeholder={t.referralPlaceholder} value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && code.trim() && handleReferralApply(code.trim())}
        autoFocus
      />
      <p style={{ fontSize: '11px', color: '#52525b', textAlign: 'center', margin: '8px 0 20px' }}>{t.referralOptional}</p>
      <motion.button whileTap={code.trim() ? { scale: 0.98 } : {}} onClick={() => code.trim() && handleReferralApply(code.trim())}
        style={{ color: '#fff', border: 'none', padding: '13px', cursor: code.trim() ? 'pointer' : 'default', fontWeight: 600, fontSize: '13px', background: code.trim() ? accent.primary : '#1a1a20', width: '100%', borderRadius: '10px', marginBottom: '10px' }}>
        {t.referralApply}
      </motion.button>
      <button onClick={handleReferralSkip}
        style={{ background: 'none', border: '1px solid #23232b', color: '#71717a', fontSize: '13px', padding: '12px', cursor: 'pointer', borderRadius: '10px', width: '100%' }}>
        {t.referralSkip}
      </button>
    </motion.div>
  );
});

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', fontWeight: 500, marginBottom: '6px' }}>{label}</label>
    {children}
  </div>
);

const inputStyle = () => ({
  width: '100%', background: '#0a0a0c',
  border: '1px solid #27272f', borderRadius: '10px',
  color: '#f4f4f5', padding: '11px 14px', outline: 'none',
  fontSize: '14px', fontFamily: 'Inter', fontWeight: 400, boxSizing: 'border-box' as const,
  transition: 'border-color 0.15s, box-shadow 0.15s',
});
