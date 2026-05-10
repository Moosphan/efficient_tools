import {
  createContext,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { clsx } from 'clsx';
import { createSandboxStore, type SandboxState } from './store';
import { ToolSelector } from './ToolSelector';
import { toolMap } from './registry';
import styles from './SandboxPanel.module.css';

/* ------------------------------------------------------------------ */
/*  Store instance with devtools                                       */
/* ------------------------------------------------------------------ */

const createStoreWithDevtools = () =>
  createSandboxStore(
    devtools(
      (set) => ({
        currentTool: null,
        previewWidth: 50,
        fullscreen: false,
        panelOpen: true,
        setTool: (tool) => set({ currentTool: tool }, 'sandbox/setTool'),
        setPreviewWidth: (width) =>
          set({ previewWidth: width }, 'sandbox/setPreviewWidth'),
        toggleFullscreen: () =>
          set((s) => ({ fullscreen: !s.fullscreen }), 'sandbox/toggleFullscreen'),
        setPanelOpen: (open) =>
          set({ panelOpen: open }, 'sandbox/setPanelOpen'),
      }) as StateCreator<SandboxState>,
      { name: 'Sandbox Store', enabled: import.meta.env.DEV }
    )
  );

/* ------------------------------------------------------------------ */
/*  React context                                                      */
/* ------------------------------------------------------------------ */

const SandboxContext = createContext<ReturnType<typeof createSandboxStore> | null>(
  null
);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export interface SandboxProviderProps {
  children: ReactNode;
  /** Custom store instance (defaults to the built-in one) */
  store?: ReturnType<typeof createSandboxStore>;
}

export function SandboxProvider({ children, store }: SandboxProviderProps) {
  const storeRef = useRef(store ?? createStoreWithDevtools());
  return (
    <SandboxContext.Provider value={storeRef.current}>
      {children}
    </SandboxContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Selector hook                                                      */
/* ------------------------------------------------------------------ */

export function useSandboxStore<T>(
  selector: (state: SandboxState) => T,
  equalityFn?: (a: T, b: T) => boolean
): T {
  const store = useContext(SandboxContext);
  if (!store) {
    throw new Error('useSandboxStore must be used within a <SandboxProvider>');
  }
  return useStore(store, selector, equalityFn);
}

/* ------------------------------------------------------------------ */
/*  Panel component                                                    */
/* ------------------------------------------------------------------ */

export function SandboxPanel() {
  const { currentTool, fullscreen, panelOpen, setPanelOpen, toggleFullscreen } =
    useSandboxStore(
      useShallow((s) => ({
        currentTool: s.currentTool,
        fullscreen: s.fullscreen,
        panelOpen: s.panelOpen,
        setPanelOpen: s.setPanelOpen,
        toggleFullscreen: s.toggleFullscreen,
      }))
    );

  const ToolComponent = currentTool ? toolMap[currentTool]?.component : null;

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen, setPanelOpen]);

  if (!panelOpen) return null;

  return (
    <div className={clsx(styles.sandboxPanel, fullscreen && styles.fullscreen)}>
      <div className={styles.sandboxHeader}>
        <div className={styles.sandboxHeaderLeft}>
          <span className={styles.sandboxTitle}>Sandbox</span>
        </div>
        <div className={styles.sandboxHeaderActions}>
          <button
            className={styles.headerBtn}
            onClick={toggleFullscreen}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
            )}
          </button>
          <button
            className={styles.headerBtn}
            onClick={() => setPanelOpen(false)}
            title="Close sandbox"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.sandboxContent}>
        <div
          className={styles.toolArea}
          style={{ width: `${50}%` }}
        >
          <div className={styles.toolSelectorWrapper}>
            <ToolSelector />
          </div>
          {ToolComponent ? (
            <div className={styles.toolContent}>
              <ToolComponent />
            </div>
          ) : (
            <div className={styles.toolPlaceholder}>
              <span>Select a tool to get started</span>
            </div>
          )}
        </div>
        <div className={styles.previewArea}>
          <div className={styles.previewPlaceholder}>
            <span>Preview area</span>
          </div>
        </div>
      </div>
    </div>
  );
}
