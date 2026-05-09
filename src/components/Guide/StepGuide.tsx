export function StepGuide() {
  return (
    <div className="guide-section">
      <div className="guide-heading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        How to get your 2FA secret?
      </div>
      <div className="guide-steps">
        <div className="guide-step">
          <div className="step-num">1</div>
          <div className="step-body">
            <div className="step-title">Go to account security settings</div>
            <div className="step-desc">
              Log into the service (GitHub, Google, etc.) and find the security or two-factor authentication settings.
            </div>
          </div>
        </div>
        <div className="guide-step">
          <div className="step-num">2</div>
          <div className="step-body">
            <div className="step-title">Choose authenticator app</div>
            <div className="step-desc">
              Select "Authenticator app" as your verification method. The service will show a QR code and a secret key.
            </div>
          </div>
        </div>
        <div className="guide-step">
          <div className="step-num">3</div>
          <div className="step-body">
            <div className="step-title">Copy the secret key</div>
            <div className="step-desc">
              Click "Can't scan?" or "Enter key" to see the Base32 secret. Copy it (e.g. <code>JBSWY3DPEHPK3PXP</code>), or copy the full <code>otpauth://</code> URI.
            </div>
          </div>
        </div>
        <div className="guide-step">
          <div className="step-num">4</div>
          <div className="step-body">
            <div className="step-title">Paste into the input above</div>
            <div className="step-desc">
              Paste the secret or URI into the input field and click "Generate" to see your 6-digit code.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
