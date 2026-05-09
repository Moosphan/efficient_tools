import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

interface PrivacyContextValue {
  isBlurred: boolean;
  unblur: () => void;
  manualBlur: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({
  isBlurred: false,
  unblur: () => {},
  manualBlur: () => {},
});

export function usePrivacy() {
  return useContext(PrivacyContext);
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isBlurred, setIsBlurred] = useState(false);
  const manualBlurRef = useRef(false);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !manualBlurRef.current) {
        setIsBlurred(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const unblur = useCallback(() => {
    setIsBlurred(false);
    manualBlurRef.current = false;
  }, []);

  const manualBlur = useCallback(() => {
    manualBlurRef.current = true;
    setIsBlurred(true);
  }, []);

  return (
    <PrivacyContext.Provider value={{ isBlurred, unblur, manualBlur }}>
      {children}
    </PrivacyContext.Provider>
  );
}
