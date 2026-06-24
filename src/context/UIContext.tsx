import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { useTheme } from './ThemeContext';

export type StatusType = 'info' | 'success' | 'error';

interface UIContextValue {
  statusMsg: string;
  statusType: StatusType;
  statusToken: number;
  updateStatus: (msg: string) => void;
  showProfile: boolean; setShowProfile: (v: boolean) => void;
  showAgeGate: boolean; setShowAgeGate: (v: boolean) => void;
  ageVerified: boolean; setAgeVerified: (v: boolean) => void;
}

const UIContext = createContext<UIContextValue>(null!);
export const useUI = () => useContext(UIContext);

const ERROR_RE = /ERROR|TIMEOUT|FAILED|LIMIT REACHED|ОШИБК|НЕ НАЙДЕН|НЕ ОБНАРУЖ/i;
const SUCCESS_RE = /SUCCESS|DONE|ADDED|RESTORED|УСПЕШНО|ИНСТАЛЛИРОВ|ЗАПУЩЕН|ВОССТАНОВЛ/i;

export function UIProvider({ children }: { children: ReactNode }) {
  const { t } = useTheme();
  const [statusMsg, setStatusMsg] = useState<string>(t.statusReady);
  const [statusType, setStatusType] = useState<StatusType>('info');
  const [statusToken, setStatusToken] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [ageVerified, setAgeVerified] = useState(() => localStorage.getItem('grim_age_ok') === 'true');

  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateStatus = useCallback((msg: string) => {
    setStatusMsg(msg);
    setStatusType(ERROR_RE.test(msg) ? 'error' : SUCCESS_RE.test(msg) ? 'success' : 'info');
    setStatusToken(n => n + 1);
    if (msg !== t.statusReady) {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => setStatusMsg(t.statusReady), 5000);
    }
  }, [t.statusReady]);

  const value: UIContextValue = {
    statusMsg, statusType, statusToken, updateStatus,
    showProfile, setShowProfile,
    showAgeGate, setShowAgeGate, ageVerified, setAgeVerified,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
