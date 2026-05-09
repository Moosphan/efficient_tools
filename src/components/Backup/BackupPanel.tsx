import { useState, useRef } from 'react';
import { useVault } from '../../context/VaultContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ConfirmDialog } from './ConfirmDialog';

interface BackupPanelProps {
  open: boolean;
  onClose: () => void;
}

export function BackupPanel({ open, onClose }: BackupPanelProps) {
  const { exportData, importData, clearAll } = useVault();
  const { showToast } = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `2fa-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup exported');
    } catch {
      setError('Export failed');
    }
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Select a backup file'); return; }
    setError('');
    try {
      const text = await file.text();
      importData(text);
      showToast('Backup imported');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const handleClear = () => {
    clearAll();
    showToast('All data cleared');
    setShowClearConfirm(false);
    onClose();
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Settings">
        <div className="backup-panel">
          <div className="backup-options">
            <button className="backup-option" onClick={handleExport}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <div>
                <div className="backup-option-title">Export backup</div>
                <div className="backup-option-desc">Download entries as JSON file</div>
              </div>
            </button>
            <div className="backup-import-section">
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="input-field"
                style={{ fontSize: 13 }}
              />
              <Button onClick={handleImport} style={{ marginTop: 8 }}>Import</Button>
            </div>
            <button className="backup-option backup-option-danger" onClick={() => setShowClearConfirm(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <div>
                <div className="backup-option-title">Clear all data</div>
                <div className="backup-option-desc">Delete everything permanently</div>
              </div>
            </button>
          </div>
          {error && <div className="form-error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
      </Modal>
      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Clear all data"
        message="This will permanently delete all your saved entries. This cannot be undone."
      />
    </>
  );
}
