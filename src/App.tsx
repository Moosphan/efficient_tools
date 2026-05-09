import { useState, useRef } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { PrivacyProvider, usePrivacy } from './context/PrivacyContext';
import { Header } from './components/Layout/Header';
import { SecurityNote } from './components/Layout/SecurityNote';
import { BlurOverlay } from './components/Layout/BlurOverlay';
import { CodePanel } from './components/CodeDisplay/CodePanel';
import { StepGuide } from './components/Guide/StepGuide';
import { ServiceLinks } from './components/Guide/ServiceLinks';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import { ConfirmDialog } from './components/Backup/ConfirmDialog';
import { useImport } from './hooks/useImport';
import jsQR from 'jsqr';

function QrImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addEntry } = useVault();
  const { showToast } = useToast();
  const { parseInput } = useImport();
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const data = await parseQrFile(file);
      const entry = parseInput(data);
      addEntry(entry);
      showToast('QR code imported');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'QR decode failed');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Modal open={open} onClose={onClose} title="Import QR Code">
      <div className="import-dialog">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <Button
          variant="ghost"
          onClick={() => fileRef.current?.click()}
          style={{ width: '100%' }}
        >
          Choose QR image
        </Button>
        {error && <div className="form-error">{error}</div>}
      </div>
    </Modal>
  );
}

async function parseQrFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Cannot create canvas'));
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) resolve(code.data);
        else reject(new Error('No QR code found in image'));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { clearAll } = useVault();
  const { showToast } = useToast();
  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClear = () => {
    clearAll();
    showToast('All data cleared');
    setShowClearConfirm(false);
    onClose();
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Settings">
        <div className="settings-panel">
          <div className="settings-item">
            <div className="settings-item-row">
              <div className="settings-item-info">
                <div className="settings-item-title">Privacy Protection</div>
                <div className="settings-item-desc">
                  Automatically hide codes when the browser tab loses focus. Prevents others from seeing your codes on screen.
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={privacyMode}
                  onChange={togglePrivacyMode}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          <button className="backup-option backup-option-danger" onClick={() => setShowClearConfirm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <div>
              <div className="backup-option-title">Clear all data</div>
              <div className="backup-option-desc">Delete all saved entries permanently</div>
            </div>
          </button>
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

function MainApp() {
  const { state, addEntry } = useVault();
  const { showToast } = useToast();
  const { parseInput } = useImport();
  const [secretInput, setSecretInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [showQrImport, setShowQrImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleGenerate = () => {
    const raw = secretInput.trim();
    if (!raw) return;
    setInputError('');
    try {
      const entry = parseInput(raw);
      addEntry(entry);
      setSecretInput('');
      showToast('Code generated');
    } catch (err) {
      setInputError(err instanceof Error ? err.message : 'Invalid input');
    }
  };

  if (!state.ready) return null;

  return (
    <>
      <Header />

      <div className="input-section">
        <div className="input-row">
          <Input
            value={secretInput}
            onChange={(e) => {
              setSecretInput(e.target.value);
              if (inputError) setInputError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Paste Secret or otpauth:// URI"
          />
          <Button onClick={handleGenerate}>Generate</Button>
        </div>
        <div className="input-hint">
          Supports Base32 keys and otpauth:// URIs. Press Enter to generate.
        </div>
        {inputError && (
          <div className="form-error" style={{ marginTop: 8 }}>
            {inputError}
          </div>
        )}
      </div>

      <div className="toolbar">
        <button className="toolbar-btn" onClick={() => setShowQrImport(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          Import QR
        </button>
        <button className="toolbar-btn" onClick={() => setShowSettings(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </button>
      </div>

      <CodePanel />
      <StepGuide />
      <ServiceLinks />
      <SecurityNote />

      <QrImportDialog
        open={showQrImport}
        onClose={() => setShowQrImport(false)}
      />

      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <VaultProvider>
        <PrivacyProvider>
          <MainApp />
          <BlurOverlay />
        </PrivacyProvider>
      </VaultProvider>
    </ToastProvider>
  );
}
