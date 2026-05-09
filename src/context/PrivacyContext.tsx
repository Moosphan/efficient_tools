import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

const STORAGE_KEY = '2fa_privacy_mode';

interface PrivacyContextValue {
  isBlurred: boolean;
  privacyMode: boolean;
  togglePrivacyMode: () => void;
  unblur: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({
  isBlurred: false,
  privacyMode: false,
  togglePrivacyMode: () => {},
  unblur: () => {},
});

export function usePrivacy() {
  return useContext(PrivacyContext);
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isBlurred, setIsBlurred] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    if (!privacyMode) {
      setIsBlurred(false);
      return;
    }

    const handleVisibility = () => {
      if (document.hidden) {
        setIsBlurred(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [privacyMode]);

  const togglePrivacyMode = useCallback(() => {
    setPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      if (!next) setIsBlurred(false);
      return next;
    });
  }, []);

  const unblur = useCallback(() => {
    setIsBlurred(false);
  }, []);

  return (
    <PrivacyContext.Provider value={{ isBlurred, privacyMode, togglePrivacyMode, unblur }}>
      {children}
    </PrivacyContext.Provider>
  );
}
