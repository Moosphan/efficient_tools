import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { TotpEntry } from '../types';

const STORAGE_KEY = '2fa_entries';

interface VaultState {
  ready: boolean;
  entries: TotpEntry[];
  selectedId: string | null;
}

type VaultAction =
  | { type: 'INIT'; entries: TotpEntry[] }
  | { type: 'ADD_ENTRY'; entry: TotpEntry }
  | { type: 'DELETE_ENTRY'; id: string }
  | { type: 'SET_ENTRIES'; entries: TotpEntry[] }
  | { type: 'CLEAR_ALL' };

function vaultReducer(state: VaultState, action: VaultAction): VaultState {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        ready: true,
        entries: action.entries,
        selectedId: action.entries.length > 0 ? action.entries[0].id : null,
      };
    case 'ADD_ENTRY': {
      const entries = [action.entry, ...state.entries];
      return { ...state, entries, selectedId: action.entry.id };
    }
    case 'DELETE_ENTRY': {
      const entries = state.entries.filter((e) => e.id !== action.id);
      const selectedId =
        state.selectedId === action.id
          ? entries.length > 0
            ? entries[0].id
            : null
          : state.selectedId;
      return { ...state, entries, selectedId };
    }
    case 'SET_ENTRIES':
      return { ...state, entries: action.entries };
    case 'CLEAR_ALL':
      return { ...state, entries: [], selectedId: null };
    default:
      return state;
  }
}

interface VaultContextValue {
  state: VaultState;
  addEntry: (entry: TotpEntry) => void;
  deleteEntry: (id: string) => void;
  clearAll: () => void;
  exportData: () => string;
  importData: (json: string) => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
}

function loadEntries(): TotpEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: TotpEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(vaultReducer, {
    ready: false,
    entries: [],
    selectedId: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const entries = loadEntries();
    dispatch({ type: 'INIT', entries });
  }, []);

  useEffect(() => {
    if (state.ready) {
      saveEntries(state.entries);
    }
  }, [state.entries, state.ready]);

  const addEntry = (entry: TotpEntry) => {
    dispatch({ type: 'ADD_ENTRY', entry });
  };

  const deleteEntry = (id: string) => {
    dispatch({ type: 'DELETE_ENTRY', id });
  };

  const clearAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'CLEAR_ALL' });
  };

  const exportData = (): string => {
    return JSON.stringify(stateRef.current.entries, null, 2);
  };

  const importData = (json: string) => {
    try {
      const imported: TotpEntry[] = JSON.parse(json);
      const existingSecrets = new Set(stateRef.current.entries.map((e) => e.secret));
      const newEntries = imported.filter((e) => !existingSecrets.has(e.secret));
      dispatch({ type: 'SET_ENTRIES', entries: [...stateRef.current.entries, ...newEntries] });
    } catch {
      throw new Error('Invalid data format');
    }
  };

  return (
    <VaultContext.Provider
      value={{ state, addEntry, deleteEntry, clearAll, exportData, importData }}
    >
      {children}
    </VaultContext.Provider>
  );
}
