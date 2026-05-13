import { useState, useRef, useCallback } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';
import { useTOTP } from './hooks/useTOTP';
import { useImport } from './hooks/useImport';
import { formatCode } from './utils/format';
import { TimerRing } from './components/TimerRing';
import { CopyButton } from './components/CopyButton';
import type { TotpEntry } from './types';

export default function TotpTool() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('totp');
  const [entries, setEntries] = useState<TotpEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<TotpEntry | null>(null);
  const [secretInput, setSecretInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parseInput, parseQrImage } = useImport();

  const addEntry = useCallback((entry: TotpEntry) => {
    setEntries((prev) => [entry, ...prev]);
    setCurrentEntry(entry);
    setSecretInput('');
    setInputError('');
  }, []);

  const handleGenerate = () => {
    const raw = secretInput.trim();
    if (!raw) return;
    setInputError('');
    try {
      addEntry(parseInput(raw));
    } catch (err) {
      setInputError(err instanceof Error ? err.message : 'Invalid input');
    }
  };

  const handleQrFile = useCallback(async (file: File) => {
    setScanning(true);
    setInputError('');
    try {
      const decoded = await parseQrImage(file);
      const entry = parseInput(decoded);
      addEntry(entry);
    } catch (err) {
      setInputError(err instanceof Error ? err.message : 'Failed to decode QR code');
    } finally {
      setScanning(false);
    }
  }, [parseQrImage, parseInput, addEntry]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleQrFile(file);
    e.target.value = '';
  }, [handleQrFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleQrFile(file);
  }, [handleQrFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleQrFile(file);
        break;
      }
    }
  }, [handleQrFile]);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {ui.secretKey || 'Secret'}
          </div>

          {/* Text input */}
          <div className="totp-input-row">
            <input
              type="text"
              value={secretInput}
              onChange={(e) => { setSecretInput(e.target.value); if (inputError) setInputError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              onPaste={handlePaste}
              placeholder={ui.placeholder || 'JBSWY3DPEHPK3PXP or otpauth://totp/...'}
              className="totp-input"
            />
            <button className="panel-btn accent" onClick={handleGenerate} disabled={scanning}>{t('common.generate')}</button>
          </div>

          {/* Divider */}
          <div className="totp-divider">
            <span>{ui.orText || 'OR'}</span>
          </div>

          {/* QR import: drag-drop zone */}
          <div
            className={`totp-qr-zone${dragOver ? ' totp-qr-zone-active' : ''}${scanning ? ' totp-qr-scanning' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            {scanning ? (
              <span className="totp-qr-text">{ui.scanning || 'Scanning QR code...'}</span>
            ) : (
              <>
                <span className="totp-qr-icon">📷</span>
                <span className="totp-qr-text">{ui.importQr || 'Import from QR code image'}</span>
                <span className="totp-qr-hint">{ui.qrHint || 'Drop image, click to select, or paste (Ctrl+V)'}</span>
              </>
            )}
          </div>

          {inputError && <div className="error-msg">{inputError}</div>}
          {currentEntry && <TotpDisplay entry={currentEntry} ui={ui} />}
          {entries.length > 1 && (
            <>
              <div className="panel-header" style={{ marginTop: 16 }}>{ui.history || 'History'}</div>
              <div className="totp-history">
                {entries.map((e) => (
                  <div
                    key={e.id}
                    className={`totp-history-item${currentEntry?.id === e.id ? ' active' : ''}`}
                    onClick={() => setCurrentEntry(e)}
                  >
                    <span className="totp-history-name">{e.issuer || 'Unnamed'}</span>
                    <span className="totp-history-secret">{e.secret.slice(0, 6)}...</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="tool-panel">
          <div className="panel-header">{ui.setupGuide || help?.title || 'Usage Guide'}</div>
          <div className="totp-guide">
            <div className="totp-guide-step">
              <div className="totp-guide-num">1</div>
              <div>
                <div className="totp-guide-title">{ui.step1}</div>
                <div className="totp-guide-desc">{ui.step1Desc}</div>
              </div>
            </div>
            <div className="totp-guide-step">
              <div className="totp-guide-num">2</div>
              <div>
                <div className="totp-guide-title">{ui.step2}</div>
                <div className="totp-guide-desc">{ui.step2Desc}</div>
              </div>
            </div>
            <div className="totp-guide-step">
              <div className="totp-guide-num">3</div>
              <div>
                <div className="totp-guide-title">{ui.step3}</div>
                <div className="totp-guide-desc">{ui.step3Desc}</div>
              </div>
            </div>
            <div className="totp-guide-step">
              <div className="totp-guide-num">4</div>
              <div>
                <div className="totp-guide-title">{ui.step4}</div>
                <div className="totp-guide-desc">{ui.step4Desc}</div>
              </div>
            </div>
          </div>
          <div className="totp-services">
            <div className="totp-services-title">{ui.services || 'Popular Services'}</div>
            <div className="totp-services-links">
              <a className="totp-service-link" href="https://github.com/settings/security" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </a>
              <a className="totp-service-link" href="https://myaccount.google.com/security" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </a>
              <a className="totp-service-link" href="https://support.microsoft.com/en-us/account-billing/how-to-use-two-step-verification-with-your-microsoft-account-c7910146-672f-01e9-50a0-93b4585e7eb4" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M11.4 24H0V12.6h11.4V24z" fill="#F25022"/><path d="M24 24H12.6V12.6H24V24z" fill="#7FBA00"/><path d="M11.4 11.4H0V0h11.4v11.4z" fill="#00A4EF"/><path d="M24 11.4H12.6V0H24v11.4z" fill="#FFB900"/></svg>
                Microsoft
              </a>
              <a className="totp-service-link" href="https://www.notion.com/help/two-step-verification" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.296-.794c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.986-.56-1.732-.56H6.282c-.84 0-1.074.234-1.414.606L.46 6.068c-.234.233-.28.56-.28.84l1.554 10.46c.047.606.374 1.4.746 1.814l4.184 3.804c.28.233.606.373.986.373h9.82c.606 0 .887-.327 1.167-.98l3.296-10.094c.187-.514.047-.794-.28-.794H9.84c-.327 0-.56.187-.514.514l.467 4.62c.047.326.187.513.514.513h7.95c.234 0 .374.14.327.373l-.7 2.18c-.047.187-.234.327-.514.327H9.14c-.606 0-.986-.187-1.36-.653L4.46 4.208z"/></svg>
                Notion
              </a>
              <a className="totp-service-link" href="https://appleid.apple.com" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Apple
              </a>
            </div>
          </div>
        </div>
      </div>
      {help && (
        <HelpSection title={ui.conceptTitle || 'Concepts'}>
          <div className="tool-help-card totp-explain">
            <h4>{ui.whatIs2fa || 'What is 2FA?'}</h4>
            <p>{ui.whatIs2faDesc || 'Two-Factor Authentication (2FA) adds a second layer of security beyond your password. Even if someone steals your password, they cannot access your account without the time-based verification code.'}</p>
            <h4>{ui.howItWorks || 'How TOTP Works'}</h4>
            <ol className="totp-explain-steps">
              <li><strong>{ui.howStep1 || 'Shared Secret'}</strong> — {ui.howStep1Desc || 'When you enable 2FA, the service generates a unique secret key shared between you and the server.'}</li>
              <li><strong>{ui.howStep2 || 'Time-Based Code'}</strong> — {ui.howStep2Desc || 'Both your device and the server independently compute a 6-digit code using the secret key + current time (RFC 6238).'}</li>
              <li><strong>{ui.howStep3 || '30-Second Window'}</strong> — {ui.howStep3Desc || 'The code changes every 30 seconds. Both sides must agree on the current time (UTC).'}</li>
              <li><strong>{ui.howStep4 || 'Verification'}</strong> — {ui.howStep4Desc || 'You enter the code shown on your device. The server computes its own code and compares — if they match, access is granted.'}</li>
            </ol>
            <p className="totp-explain-note">{ui.securityNote || 'Your secret key never leaves your browser. All computation happens locally using the Web Crypto API.'}</p>
          </div>
        </HelpSection>
      )}
    </ToolShell>
  );
}

function TotpDisplay({ entry, ui }: { entry: TotpEntry; ui: Record<string, string> }) {
  const { code, remaining, progress, isUrgent } = useTOTP(entry);

  return (
    <div className="totp-display">
      <div className="totp-code-label">{entry.issuer || ui.accountName || 'Verification Code'}</div>
      <div className="totp-code-value">{formatCode(code)}</div>
      <TimerRing progress={progress} isUrgent={isUrgent} remaining={remaining} />
      <CopyButton code={code} />
    </div>
  );
}
