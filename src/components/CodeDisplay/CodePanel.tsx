import { useVault } from '../../context/VaultContext';
import { useTOTP } from '../../hooks/useTOTP';
import { formatCode } from '../../utils/format';
import { TimerRing } from './TimerRing';
import { CopyButton } from './CopyButton';

export function CodePanel() {
  const { state } = useVault();

  // Show the most recently added entry
  const currentEntry = state.entries.length > 0 ? state.entries[0] : null;

  if (!currentEntry) return null;

  return <CodePanelContent entry={currentEntry} />;
}

function CodePanelContent({ entry }: { entry: { id: string; issuer: string; account: string; secret: string; algorithm: string; digits: number; period: number } }) {
  const { code, remaining, progress, isUrgent } = useTOTP(entry as any);

  const label = entry.issuer || 'Verification Code';
  const subtitle = entry.account
    ? `${label} · ${entry.account}`
    : label;

  return (
    <div className="code-panel visible">
      <div className="code-service">{subtitle}</div>
      <div
        className="code-value"
        onClick={async () => {
          if (code !== '------') {
            try {
              await navigator.clipboard.writeText(code);
            } catch {
              // fallback handled by CopyButton
            }
          }
        }}
        title="Click to copy"
      >
        {formatCode(code)}
      </div>
      <TimerRing progress={progress} isUrgent={isUrgent} remaining={remaining} />
      <CopyButton code={code} />
    </div>
  );
}
