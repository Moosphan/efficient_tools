import { useState, useEffect, useRef } from 'react';
import { generateTOTP } from '../crypto/totp';
import type { TotpEntry, TotpResult } from '../types';

export function useTOTP(entry: TotpEntry | null) {
  const [result, setResult] = useState<TotpResult>({ code: '------', remaining: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    if (!entry) {
      setResult({ code: '------', remaining: 0 });
      return;
    }

    let cancelled = false;

    const update = async () => {
      try {
        const r = await generateTOTP(entry.secret, entry.algorithm, entry.digits, entry.period);
        if (!cancelled) setResult(r);
      } catch (err) {
        console.error('TOTP error:', err);
        if (!cancelled) setResult({ code: '------', remaining: 0 });
      }
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [entry?.id, entry?.secret, entry?.algorithm, entry?.digits, entry?.period]);

  const progress = entry ? result.remaining / entry.period : 0;
  const isUrgent = result.remaining <= 5;

  return { ...result, progress, isUrgent };
}
