import { useState } from 'react';
import { useClipboard } from '../../hooks/useClipboard';
import { useToast } from '../../context/ToastContext';

interface CopyButtonProps {
  code: string;
}

export function CopyButton({ code }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const copy = useClipboard();
  const { showToast } = useToast();

  const handleCopy = async () => {
    if (!code || code === '------') return;
    const ok = await copy(code);
    if (ok) {
      setCopied(true);
      showToast('Code copied');
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="copy-area">
      <button
        className={`copy-btn${copied ? ' copied' : ''}`}
        onClick={handleCopy}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <span>{copied ? 'Copied' : 'Copy code'}</span>
      </button>
    </div>
  );
}
