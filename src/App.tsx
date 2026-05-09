import { useState, useRef } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { Header } from './components/Layout/Header';
import { SecurityNote } from './components/Layout/SecurityNote';
import { BlurOverlay } from './components/Layout/BlurOverlay';
import { CodePanel } from './components/CodeDisplay/CodePanel';
import { BackupPanel } from './components/Backup/BackupPanel';
import { StepGuide } from './components/Guide/StepGuide';
import { ServiceLinks } from './components/Guide/ServiceLinks';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import { useImport } from './hooks/useImport';
import jsQR from 'jsqr';

function QuickImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addEntry } = useVault();
  const { showToast } = useToast();
  const { parseInput } = useImport();
  const [uriInput, setUriInput] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUriImport = () => {
    setError('');
    const raw = uriInput.trim();
    if (!raw) return;
    try {
      const entry = parseInput(raw);
      addEntry(entry);
      showToast('Entry imported');
      setUriInput('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid input');
    }
  };

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
    <Modal open={open} onClose={onClose} title="Import">
      <div className="import-dialog">
        <div className="import-section">
          <div className="import-section-label">Paste URI or Secret</div>
          <div className="import-uri">
            <Input
              value={uriInput}
              onChange={(e) => setUriInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUriImport()}
              placeholder="otpauth://totp/... or Base32 secret"
            />
            <Button onClick={handleUriImport}>Import</Button>
          </div>
        </div>
        <div className="import-divider">
          <span>or</span>
        </div>
        <div className="import-section">
          <div className="import-section-label">Scan QR Code</div>
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
        </div>
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

function MainApp() {
  const { state, addEntry } = useVault();
  const { showToast } = useToast();
  const { parseInput } = useImport();
  const [secretInput, setSecretInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

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
        <button className="toolbar-btn" onClick={() => setShowImport(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import QR / URI
        </button>
        <button className="toolbar-btn" onClick={() => setShowBackup(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
          Settings
        </button>
      </div>

      <CodePanel />
      <StepGuide />
      <ServiceLinks />
      <SecurityNote />

      <QuickImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
      />

      <BackupPanel
        open={showBackup}
        onClose={() => setShowBackup(false)}
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
