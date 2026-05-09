import { useEffect, useRef } from 'react';

/**
 * Registers a cleanup function that runs when the component unmounts.
 * Use to release large resources (big strings, buffers, workers, etc.)
 */
export function useCleanup(cleanup: () => void) {
  const ref = useRef(cleanup);
  ref.current = cleanup;

  useEffect(() => {
    return () => ref.current();
  }, []);
}
