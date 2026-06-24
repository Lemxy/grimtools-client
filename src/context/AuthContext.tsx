import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { canAccess18Plus, canDownloadUniqueByTier, canAccessExclusive, STAFF_COLOR } from '../constants/colors';
import { useTheme } from './ThemeContext';
import { useUI } from './UIContext';
import { pinnedGet, pinnedPost } from './apiClient';

const TIER_LIMITS: Record<string, number> = { IRON: 1, SILVER: 2, GOLD: 3, DIAMOND: 999, STAFF: 2 };

interface AuthContextValue {
  userToken: string; setUserToken: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  pass: string; setPass: (v: string) => void;
  hwid: string;
  authMode: 'login' | 'register'; setAuthMode: (v: 'login' | 'register') => void;
  authStep: 'credentials' | 'referral'; setAuthStep: (v: 'credentials' | 'referral') => void;
  authStatusMsg: string; authStatusType: 'error' | 'success' | 'info';
  handleAuth: () => void;
  handleReferralApply: (code: string) => void;
  handleReferralSkip: () => void;
  handleLogout: () => void;

  emailVerified: boolean;
  contactEmail: string; setContactEmail: (v: string) => void;
  showEmailVerify: boolean; setShowEmailVerify: (v: boolean) => void;
  pendingLinkEmail: string; setPendingLinkEmail: (v: string) => void;
  handleSendVerifyEmail: (newEmail?: string) => Promise<void>;
  handleVerifyEmailCode: (code: string) => Promise<void>;

  showForgotPassword: boolean; setShowForgotPassword: (v: boolean) => void;
  forgotStep: 'email' | 'code' | 'newpass'; setForgotStep: (v: 'email' | 'code' | 'newpass') => void;
  forgotEmail: string; setForgotEmail: (v: string) => void;
  handleForgotSendCode: (email: string) => Promise<void>;
  handleForgotSetNewPass: (email: string, code: string, newPass: string) => Promise<void>;

  userTier: string; tierColor: string; tierShimmerClass: string | undefined;
  limitReset: string; tierExpiry: string;
  activationsRemaining: number; activationsLimit: number;
  myReferralCode: string; setMyReferralCode: (v: string) => void;
  referralUsedCount: number; setReferralUsedCount: (v: number) => void;
  canDownloadUnique: boolean; userCan18: boolean; userCanExclusive: boolean;
  fetchUserStatus: (token: string) => Promise<boolean>;

  showDisclaimer: boolean; setShowDisclaimer: (v: boolean) => void;
  hwidConflictEmail: string; setHwidConflictEmail: (v: string) => void;

  keyCode: string; setKeyCode: (v: string) => void;
  handleActivateKey: () => void;

  newReferralCode: string; setNewReferralCode: (v: string) => void;
  referralCopied: boolean; referralCreating: boolean;
  handleCreateReferralCode: () => void;
  handleCopyReferral: () => void;
}

const LIMIT_RESET_KEY = 'grim_limit_reset_ms';

const AuthContext = createContext<AuthContextValue>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { accent } = useTheme();
  const { updateStatus } = useUI();

  const [userToken, setUserToken] = useState(localStorage.getItem('token') || '');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authStep, setAuthStep] = useState<'credentials' | 'referral'>('credentials');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [hwid, setHwid] = useState('');
  const [authStatusMsg, setAuthStatusMsg] = useState('');
  const [authStatusType, setAuthStatusType] = useState<'error' | 'success' | 'info'>('info');
  const [emailVerified, setEmailVerified] = useState(true);
  const [contactEmail, setContactEmail] = useState('');
  const [pendingLinkEmail, setPendingLinkEmail] = useState('');
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'newpass'>('email');
  const [forgotEmail, setForgotEmail] = useState('');

  const [userTier, setUserTier] = useState('IRON');
  const [limitReset, setLimitReset] = useState('');
  const [tierExpiry, setTierExpiry] = useState('');
  const [activationsUsed, setActivationsUsed] = useState(0);
  const [extraActivations, setExtraActivations] = useState(0);
  const [myReferralCode, setMyReferralCode] = useState('');
  const [referralUsedCount, setReferralUsedCount] = useState(0);

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [hwidConflictEmail, setHwidConflictEmail] = useState('');
  const [keyCode, setKeyCode] = useState('');
  const [newReferralCode, setNewReferralCode] = useState('');
  const [referralCopied, setReferralCopied] = useState(false);
  const [referralCreating, setReferralCreating] = useState(false);

  const canDownloadUnique = canDownloadUniqueByTier(userTier);
  const userCan18 = canAccess18Plus(userTier);
  const userCanExclusive = canAccessExclusive(userTier);
  const activationsLimit = (TIER_LIMITS[userTier] ?? 1) + extraActivations;
  const activationsRemaining = userTier === 'DIAMOND' ? Infinity : Math.max(0, activationsLimit - activationsUsed);
  const tierColor = useMemo(() => {
    if (userTier === 'STAFF') return STAFF_COLOR;
    if (userTier === 'DIAMOND') return '#739fb8';
    if (userTier === 'GOLD') return '#c9a55e';
    if (userTier === 'SILVER') return '#90a4ae';
    return accent.primary;
  }, [userTier, accent.primary]);
  const tierShimmerClass = useMemo(() => {
    if (userTier === 'STAFF') return 'tier-staff';
    if (userTier === 'DIAMOND') return 'tier-diamond';
    if (userTier === 'GOLD') return 'tier-gold';
    return undefined;
  }, [userTier]);

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('token'); localStorage.removeItem('grim_email');
    setUserToken(''); setEmail('');
    try { await invoke('save_token', { token: '' }); } catch {}
    updateStatus('SESSION EXPIRED / LOGOUT');
  }, [updateStatus]);

  const fetchUserStatus = useCallback(async (token: string) => {
    try {
      const res = await pinnedGet(`/api/user-status?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setUserTier(String(data.tier).toUpperCase());
        if (typeof data.activations === 'number') setActivationsUsed(data.activations);
        if (typeof data.extra === 'number') setExtraActivations(data.extra);
        if (data.unlimited) {

          setLimitReset('');
        } else if (data.limit_reset_at) {
          const ms = new Date(data.limit_reset_at).getTime() - Date.now();
          setLimitReset(ms > 0 ? (ms / 3_600_000).toFixed(1) + 'H' : 'READY');
        }
        if (data.tier_expiry) setTierExpiry(new Date(data.tier_expiry).toLocaleDateString());
        if (data.referral_code) setMyReferralCode(data.referral_code);
        if (typeof data.referral_used_by === 'number') setReferralUsedCount(data.referral_used_by);
        const verified = data.email_verified === true;
        setEmailVerified(verified);
        if (data.contact_email) setContactEmail(data.contact_email);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const loginIsEmail = emailRegex.test(data.login_email || email);
        if (!verified && loginIsEmail) setShowEmailVerify(true);
        return true;
      }
      handleLogout(); return false;
    } catch { return false; }
  }, [handleLogout, email]);

  const completeRegistration = useCallback(async (referralCode: string) => {
    try {
      const res = await pinnedPost(`/api/register`, { email, password: pass, hwid, referral_code: referralCode || undefined });
      const data = await res.json();
      if (res.ok) {
        await invoke('save_token', { token: data.token });
        localStorage.setItem('token', data.token); localStorage.setItem('grim_email', email);
        setUserToken(data.token); updateStatus('ACCESS GRANTED');
        setAuthStatusType('success'); setAuthStatusMsg('SUCCESSFULLY AUTHORIZED');
        fetchUserStatus(data.token);
        if (!localStorage.getItem('grim_welcome_seen')) setShowDisclaimer(true);
        setTimeout(() => setAuthStatusMsg(''), 5000);

        try {
          await pinnedPost(`/api/send-verify-email`, { token: data.token });
        } catch {}
        setShowEmailVerify(true);
      } else {
        const err = String(data.error || '').toLowerCase();
        const msg = err.includes('email') && err.includes('exist') ? 'EMAIL ALREADY IN USE'
          : err.includes('hwid') ? 'ACCOUNT ALREADY LINKED'
          : err.includes('password') ? 'INVALID PASSWORD'
          : err.includes('referral') ? 'INVALID REFERRAL CODE' : 'AUTHORIZATION FAILED';
        if ((err.includes('hwid') || err.includes('hardware')) && data.existing_email) setHwidConflictEmail(data.existing_email);
        setAuthStatusType('error'); setAuthStatusMsg(msg); updateStatus(`AUTH ERROR: ${msg}`);
        setAuthStep('credentials'); setTimeout(() => setAuthStatusMsg(''), 5000);
      }
    } catch {
      setAuthStatusType('error'); setAuthStatusMsg('SERVER CONNECTION FAILED');
      updateStatus('SERVER CONNECTION FAILED'); setAuthStep('credentials');
      setTimeout(() => setAuthStatusMsg(''), 5000);
    }
  }, [email, pass, hwid, updateStatus, fetchUserStatus]);

  const handleAuth = useCallback(async () => {
    if (!hwid) { updateStatus('HWID NOT LOADED, PLEASE WAIT...'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (authMode === 'register') {
      if (!email || !emailRegex.test(email.trim())) {
        setAuthStatusType('error'); setAuthStatusMsg('ENTER A VALID EMAIL ADDRESS');
        setTimeout(() => setAuthStatusMsg(''), 3000); return;
      }
    } else {
      if (!email || email.trim().length < 2) {
        setAuthStatusType('error'); setAuthStatusMsg('ENTER EMAIL OR USERNAME');
        setTimeout(() => setAuthStatusMsg(''), 3000); return;
      }
    }
    updateStatus('CONNECTING TO MASTER SERVER...');
    if (authMode === 'register') {
      if (!pass) { setAuthStatusType('error'); setAuthStatusMsg('FILL IN ALL FIELDS'); setTimeout(() => setAuthStatusMsg(''), 3000); return; }
      if (pass.length < 6) { setAuthStatusType('error'); setAuthStatusMsg('PASSWORD TOO SHORT (MIN 6)'); setTimeout(() => setAuthStatusMsg(''), 3000); return; }
      setAuthStep('referral'); return;
    }
    try {
      const res = await pinnedPost(`/api/login`, { email, password: pass, hwid });
      const data = await res.json();
      if (res.ok) {
        await invoke('save_token', { token: data.token });
        localStorage.setItem('token', data.token); localStorage.setItem('grim_email', email);
        setUserToken(data.token); updateStatus('ACCESS GRANTED');
        setAuthStatusType('success'); setAuthStatusMsg('SUCCESSFULLY AUTHORIZED');
        fetchUserStatus(data.token);
        if (!localStorage.getItem('grim_welcome_seen')) setShowDisclaimer(true);
        setTimeout(() => setAuthStatusMsg(''), 5000);
      } else {
        const err = String(data.error || '').toLowerCase();
        const msg = err.includes('hwid') || err.includes('hardware') ? 'ACCOUNT ALREADY LINKED'
          : err.includes('password') ? 'INVALID PASSWORD'
          : err.includes('user') ? 'USER NOT FOUND' : 'AUTHORIZATION FAILED';
        if ((err.includes('hwid') || err.includes('hardware') || err.includes('mismatch')) && (data.hwid_account || data.existing_email))
          setHwidConflictEmail(data.hwid_account || data.existing_email);
        setAuthStatusType('error'); setAuthStatusMsg(msg); updateStatus(`AUTH ERROR: ${msg}`);
        setTimeout(() => setAuthStatusMsg(''), 5000);
      }
    } catch {
      setAuthStatusType('error'); setAuthStatusMsg('SERVER CONNECTION FAILED');
      updateStatus('SERVER CONNECTION FAILED'); setTimeout(() => setAuthStatusMsg(''), 5000);
    }
  }, [hwid, authMode, email, pass, updateStatus, fetchUserStatus]);

  const handleReferralApply = useCallback((code: string) => completeRegistration(code), [completeRegistration]);
  const handleReferralSkip  = useCallback(() => completeRegistration(''), [completeRegistration]);

  const handleForgotSendCode = useCallback(async (forgotEmailArg: string) => {
    updateStatus('SENDING RESET CODE...');
    try {
      const res = await pinnedPost(`/api/forgot-password`, { email: forgotEmailArg });
      const data = await res.json();
      if (res.ok) {
        setForgotStep('code');
        updateStatus('RESET CODE SENT TO EMAIL');
      } else {
        setAuthStatusType('error');
        setAuthStatusMsg(String(data.error || 'EMAIL NOT FOUND').toUpperCase());
        setTimeout(() => setAuthStatusMsg(''), 4000);
        updateStatus('FORGOT PASSWORD: EMAIL NOT FOUND');
      }
    } catch {
      setAuthStatusType('error');
      setAuthStatusMsg('SERVER CONNECTION FAILED');
      setTimeout(() => setAuthStatusMsg(''), 4000);
    }
  }, [updateStatus]);

  const handleForgotSetNewPass = useCallback(async (forgotEmailArg: string, code: string, newPass: string) => {
    updateStatus('RESETTING PASSWORD...');
    try {
      const res = await pinnedPost(`/api/reset-password`, { email: forgotEmailArg, code, new_password: newPass });
      const data = await res.json();
      if (res.ok) {
        setForgotStep('email');
        setShowForgotPassword(false);
        setAuthStatusType('success');
        setAuthStatusMsg('PASSWORD CHANGED — PLEASE LOGIN');
        updateStatus('PASSWORD RESET SUCCESS');
        setTimeout(() => setAuthStatusMsg(''), 5000);
      } else {
        setAuthStatusType('error');
        setAuthStatusMsg(String(data.error || 'INVALID CODE OR EXPIRED').toUpperCase());
        setTimeout(() => setAuthStatusMsg(''), 4000);
      }
    } catch {
      setAuthStatusType('error');
      setAuthStatusMsg('SERVER CONNECTION FAILED');
      setTimeout(() => setAuthStatusMsg(''), 4000);
    }
  }, [updateStatus]);

  const handleSendVerifyEmail = useCallback(async (newEmail?: string) => {
    updateStatus('SENDING VERIFICATION CODE...');
    try {
      const body: Record<string, string> = { token: userToken };
      if (newEmail) body.new_email = newEmail;
      const res = await pinnedPost(`/api/send-verify-email`, body);
      if (res.ok) {
        updateStatus('VERIFICATION CODE SENT');
        if (newEmail) setPendingLinkEmail(newEmail);
      } else {
        updateStatus('FAILED TO SEND CODE');
        throw new Error('FAILED TO SEND CODE');
      }
    } catch (e) {
      updateStatus('SERVER CONNECTION FAILED');
      throw e;
    }
  }, [userToken, updateStatus]);

  const handleVerifyEmailCode = useCallback(async (code: string) => {
    updateStatus('VERIFYING EMAIL...');
    try {
      const res = await pinnedPost(`/api/verify-email`, { token: userToken, code });
      if (res.ok) {
        setEmailVerified(true);
        setShowEmailVerify(false);
        if (pendingLinkEmail) { setContactEmail(pendingLinkEmail); setPendingLinkEmail(''); }
        updateStatus('EMAIL VERIFIED');
      } else {
        const data = await res.json();
        updateStatus(String(data.error || 'INVALID CODE').toUpperCase());
        throw new Error(String(data.error || 'INVALID CODE'));
      }
    } catch (e) {
      throw e;
    }
  }, [userToken, updateStatus, pendingLinkEmail]);

  const handleActivateKey = useCallback(async () => {
    updateStatus('VALIDATING KEY...');
    try {
      const res = await pinnedPost(`/api/activate-key`, { token: userToken, key_code: keyCode });
      const data = await res.json();
      if (res.ok) { updateStatus(`KEY ACTIVATED: ${data.tier || 'SUCCESS'}`); setKeyCode(''); fetchUserStatus(userToken); }
      else updateStatus(`ERROR: ${data.error.toUpperCase()}`);
    } catch { updateStatus('KEY ACTIVATION FAILED'); }
  }, [userToken, keyCode, updateStatus, fetchUserStatus]);

  const handleCreateReferralCode = useCallback(async () => {
    if (!newReferralCode.trim() || myReferralCode) return;
    setReferralCreating(true);
    try {
      const res = await pinnedPost(`/api/create-referral`, { token: userToken, code: newReferralCode.trim().toUpperCase() });
      const data = await res.json();
      if (res.ok) { setMyReferralCode(data.code); setNewReferralCode(''); updateStatus('REFERRAL CODE CREATED'); }
      else updateStatus(`ERROR: ${String(data.error || 'FAILED').toUpperCase()}`);
    } catch { updateStatus('REFERRAL CODE CREATION FAILED'); }
    finally { setReferralCreating(false); }
  }, [userToken, newReferralCode, myReferralCode, updateStatus]);

  const handleCopyReferral = useCallback(() => {
    if (!myReferralCode) return;
    navigator.clipboard.writeText(myReferralCode).then(() => { setReferralCopied(true); setTimeout(() => setReferralCopied(false), 2000); });
  }, [myReferralCode]);

  useEffect(() => {
    async function initSystem() {
      try {
        const id = await invoke<string>('get_hwid'); setHwid(id);
        const saved = await invoke<string>('load_token');
        if (saved && saved.length > 5) {
          const valid = await fetchUserStatus(saved);
          if (valid) { localStorage.setItem('token', saved); setUserToken(saved); setEmail(localStorage.getItem('grim_email') || ''); updateStatus('SESSION RESTORED'); }
        } else updateStatus('LOGIN REQUIRED');
      } catch {}
    }
    initSystem();

  }, []);

  useEffect(() => {
    if (!userToken) return;
    const iv = setInterval(() => { fetchUserStatus(userToken); }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [userToken, fetchUserStatus]);

  const value: AuthContextValue = {
    userToken, setUserToken, email, setEmail, pass, setPass, hwid,
    authMode, setAuthMode, authStep, setAuthStep,
    authStatusMsg, authStatusType, handleAuth, handleReferralApply, handleReferralSkip, handleLogout,
    emailVerified, contactEmail, setContactEmail, pendingLinkEmail, setPendingLinkEmail,
    showEmailVerify, setShowEmailVerify, handleSendVerifyEmail, handleVerifyEmailCode,
    showForgotPassword, setShowForgotPassword, forgotStep, setForgotStep, forgotEmail, setForgotEmail,
    handleForgotSendCode, handleForgotSetNewPass,
    userTier, tierColor, tierShimmerClass, limitReset, tierExpiry,
    activationsRemaining, activationsLimit,
    myReferralCode, setMyReferralCode, referralUsedCount, setReferralUsedCount,
    canDownloadUnique, userCan18, userCanExclusive, fetchUserStatus,
    showDisclaimer, setShowDisclaimer, hwidConflictEmail, setHwidConflictEmail,
    keyCode, setKeyCode, handleActivateKey,
    newReferralCode, setNewReferralCode, referralCopied, referralCreating,
    handleCreateReferralCode, handleCopyReferral,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { LIMIT_RESET_KEY };
