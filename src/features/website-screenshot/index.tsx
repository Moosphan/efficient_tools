import { useState, useCallback, useRef } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Types ──

type Device = 'desktop' | 'tablet' | 'mobile';
type ScreenshotType = 'viewport' | 'fullpage';
type Background = 'none' | 'gradient1' | 'gradient2' | 'gradient3' | 'gradient4' | 'blur';
type ExportFormat = 'png' | 'jpeg';
type FrameStyle = 'none' | 'macbook' | 'iphone' | 'ipad' | 'browser';

interface ScreenshotConfig {
  url: string;
  device: Device;
  type: ScreenshotType;
  background: Background;
  frame: FrameStyle;
  format: ExportFormat;
  quality: number;
  padding: number;
  borderRadius: number;
  shadow: boolean;
}

// ── Constants ──

const DEVICE_SIZES: Record<Device, { width: number; height: number; label: string }> = {
  desktop: { width: 1440, height: 900, label: 'Desktop (1440×900)' },
  tablet: { width: 768, height: 1024, label: 'Tablet (768×1024)' },
  mobile: { width: 375, height: 812, label: 'Mobile (375×812)' }, // kept for API compatibility
};

const BACKGROUNDS: Record<Background, { label: string; style: string }> = {
  none: { label: '无', style: 'transparent' },
  gradient1: { label: '紫蓝渐变', style: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  gradient2: { label: '青蓝渐变', style: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)' },
  gradient3: { label: '橙粉渐变', style: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  gradient4: { label: '深蓝渐变', style: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d1b69 100%)' },
  blur: { label: '模糊背景', style: 'blur' },
};

const FRAMES: Record<FrameStyle, { label: string; icon: string }> = {
  none: { label: '无框架', icon: '⬜' },
  macbook: { label: 'MacBook', icon: '💻' },
  iphone: { label: 'iPhone', icon: '📱' },
  ipad: { label: 'iPad', icon: '📋' },
  browser: { label: '浏览器', icon: '🌐' },
};

// ── API ──

// Multiple screenshot APIs for fallback
const SCREENSHOT_APIS = {
  // WordPress.com mshots (free, no auth)
  mshots: (url: string, width: number, height: number, fullpage: boolean) =>
    `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=${width}&h=${fullpage ? 2000 : height}&full=${fullpage ? 1 : 0}`,

  // Microlink (free tier, 50 req/day)
  microlink: (url: string, width: number, height: number, fullpage: boolean) =>
    `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=${width}&viewport.height=${height}${fullpage ? '&fullPage=true' : ''}`,

  // PageSpeed Insights (free, Google API)
  pagespeed: (url: string, width: number, height: number) =>
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&screenshot=true&strategy=${width > 768 ? 'desktop' : 'mobile'}`,
};

function getScreenshotUrls(url: string, device: Device, type: ScreenshotType): string[] {
  const size = DEVICE_SIZES[device];
  const isFullpage = type === 'fullpage';

  // Ensure URL has protocol
  let targetUrl = url;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  // Return multiple API URLs to try
  return [
    SCREENSHOT_APIS.mshots(targetUrl, size.width, size.height, isFullpage),
  ];
}

function captureScreenshot(url: string, device: Device, type: ScreenshotType): string {
  const urls = getScreenshotUrls(url, device, type);
  return urls[0];
}

// ── Frame Components ──

function MacbookFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="ws-frame-macbook">
      <div className="ws-frame-macbook-top">
        <div className="ws-frame-macbook-notch">
          <div className="ws-frame-macbook-camera" />
        </div>
        <div className="ws-frame-macbook-screen">
          {children}
        </div>
      </div>
      <div className="ws-frame-macbook-bottom" />
      <div className="ws-frame-macbook-shadow" />
    </div>
  );
}

function IphoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="ws-frame-iphone">
      <div className="ws-frame-iphone-top">
        <div className="ws-frame-iphone-notch" />
      </div>
      <div className="ws-frame-iphone-screen">
        {children}
      </div>
      <div className="ws-frame-iphone-bottom">
        <div className="ws-frame-iphone-home" />
      </div>
    </div>
  );
}

function IpadFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="ws-frame-ipad">
      <div className="ws-frame-ipad-camera" />
      <div className="ws-frame-ipad-screen">
        {children}
      </div>
      <div className="ws-frame-ipad-home" />
    </div>
  );
}

function BrowserFrame({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div className="ws-frame-browser">
      <div className="ws-frame-browser-top">
        <div className="ws-frame-browser-dots">
          <span className="ws-dot ws-dot-red" />
          <span className="ws-dot ws-dot-yellow" />
          <span className="ws-dot ws-dot-green" />
        </div>
        <div className="ws-frame-browser-url">
          <span className="ws-frame-browser-lock">🔒</span>
          <span className="ws-frame-browser-url-text">{url}</span>
        </div>
        <div className="ws-frame-browser-actions">
          <span>⋯</span>
        </div>
      </div>
      <div className="ws-frame-browser-screen">
        {children}
      </div>
    </div>
  );
}

// ── Main Component ──

export default function WebsiteScreenshot() {
  const { lang } = useI18n();
  const { name: toolName, desc, ui, help } = useToolI18n('websiteScreenshot');
  const [config, setConfig] = useState<ScreenshotConfig>({
    url: '',
    device: 'desktop',
    type: 'viewport',
    background: 'gradient1',
    frame: 'browser',
    format: 'png',
    quality: 90,
    padding: 40,
    borderRadius: 12,
    shadow: true,
  });
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const updateConfig = <K extends keyof ScreenshotConfig>(key: K, value: ScreenshotConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleCapture = useCallback(async () => {
    if (!config.url) {
      setError(lang === 'zh' ? '请输入 URL' : 'Please enter a URL');
      return;
    }

    // Add protocol if missing
    let url = config.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    setError('');
    setLoading(true);
    setScreenshot(null);

    // Try each API in sequence
    const tryLoadImage = (imageUrl: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const timeout = setTimeout(() => {
          img.onload = null;
          img.onerror = null;
          reject(new Error('timeout'));
        }, 15000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve(imageUrl);
        };
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('load error'));
        };
        img.src = imageUrl;
      });
    };

    const urls = getScreenshotUrls(url, config.device, config.type);

    for (const imageUrl of urls) {
      try {
        const result = await tryLoadImage(imageUrl);
        setScreenshot(result);
        setLoading(false);
        return;
      } catch {
        // Try next API
        continue;
      }
    }

    setError(lang === 'zh' ? '截图生成失败，请稍后重试' : 'Screenshot generation failed, please try again later');
    setLoading(false);
  }, [config.url, config.device, config.type, lang]);

  const handleExport = useCallback(async () => {
    if (!previewRef.current || !screenshot) return;

    try {
      // Use html2canvas-like approach with canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = screenshot;
      });

      const padding = config.padding;
      const framePadding = config.frame === 'none' ? 0 : 20;
      const totalPadding = padding + framePadding;

      canvas.width = img.width + totalPadding * 2;
      canvas.height = img.height + totalPadding * 2;

      // Draw background
      if (config.background !== 'none') {
        if (config.background === 'blur') {
          // Draw blurred background
          ctx.filter = 'blur(50px)';
          ctx.drawImage(img, -50, -50, canvas.width + 100, canvas.height + 100);
          ctx.filter = 'none';
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          // Gradient backgrounds
          const gradients: Record<string, string[]> = {
            gradient1: ['#667eea', '#764ba2'],
            gradient2: ['#0093E9', '#80D0C7'],
            gradient3: ['#f093fb', '#f5576c'],
            gradient4: ['#0c0c1d', '#2d1b69'],
          };
          const colors = gradients[config.background] || gradients.gradient1;
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, colors[0]);
          gradient.addColorStop(1, colors[1]);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

      // Draw screenshot with rounded corners
      const radius = config.borderRadius;
      const x = totalPadding;
      const y = totalPadding;
      const w = img.width;
      const h = img.height;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();

      // Export
      const mimeType = config.format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const quality = config.format === 'jpeg' ? config.quality / 100 : undefined;
      const dataUrl = canvas.toDataURL(mimeType, quality);

      // Download
      const link = document.createElement('a');
      link.download = `screenshot-${new URL(config.url || 'https://example.com').hostname}.${config.format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      setError(lang === 'zh' ? '导出失败' : 'Export failed');
    }
  }, [screenshot, config, lang]);

  const renderFrame = (content: React.ReactNode) => {
    switch (config.frame) {
      case 'macbook':
        return <MacbookFrame>{content}</MacbookFrame>;
      case 'iphone':
        return <IphoneFrame>{content}</IphoneFrame>;
      case 'ipad':
        return <IpadFrame>{content}</IpadFrame>;
      case 'browser':
        return <BrowserFrame url={config.url || 'example.com'}>{content}</BrowserFrame>;
      default:
        return content;
    }
  };

  return (
    <ToolShell title={toolName} description={desc}>
      <div className="ws-layout">
        {/* Config Panel */}
        <div className="ws-config">
          {/* URL Input */}
          <div className="ws-section">
            <div className="ws-section-title">{ui.url || 'URL'}</div>
            <div className="ws-url-input-group">
              <input
                type="text"
                className="ws-url-input"
                placeholder={ui.urlPlaceholder || 'Enter website URL...'}
                value={config.url}
                onChange={e => updateConfig('url', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCapture()}
              />
              <button
                className="ws-capture-btn"
                onClick={handleCapture}
                disabled={loading}
              >
                {loading ? (ui.capturing || 'Capturing...') : (ui.capture || 'Capture')}
              </button>
            </div>
            {error && <div className="ws-error">{error}</div>}
          </div>

          {/* Device */}
          <div className="ws-section">
            <div className="ws-section-title">{ui.device || 'Device'}</div>
            <div className="ws-btn-group">
              <button
                className={`ws-btn ${config.device === 'desktop' ? 'ws-btn-active' : ''}`}
                onClick={() => updateConfig('device', 'desktop')}
              >
                💻 {DEVICE_SIZES.desktop.label}
              </button>
              <button
                className={`ws-btn ${config.device === 'tablet' ? 'ws-btn-active' : ''}`}
                onClick={() => updateConfig('device', 'tablet')}
              >
                📱 {DEVICE_SIZES.tablet.label}
              </button>
            </div>
          </div>

          {/* Screenshot Type */}
          <div className="ws-section">
            <div className="ws-section-title">{ui.screenshotType || 'Screenshot Type'}</div>
            <div className="ws-btn-group">
              <button
                className={`ws-btn ${config.type === 'viewport' ? 'ws-btn-active' : ''}`}
                onClick={() => updateConfig('type', 'viewport')}
              >
                {ui.viewport || 'Viewport'}
              </button>
              <button
                className={`ws-btn ${config.type === 'fullpage' ? 'ws-btn-active' : ''}`}
                onClick={() => updateConfig('type', 'fullpage')}
              >
                {ui.fullpage || 'Full Page'}
              </button>
            </div>
          </div>

          {/* Frame */}
          <div className="ws-section">
            <div className="ws-section-title">{ui.frame || 'Frame'}</div>
            <div className="ws-btn-group">
              {(Object.entries(FRAMES) as [FrameStyle, typeof FRAMES[FrameStyle]][])
                .filter(([key]) => key !== 'iphone')
                .map(([key, val]) => (
                  <button
                    key={key}
                    className={`ws-btn ${config.frame === key ? 'ws-btn-active' : ''}`}
                    onClick={() => updateConfig('frame', key)}
                  >
                    {val.icon} {val.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Background */}
          <div className="ws-section">
            <div className="ws-section-title">{ui.background || 'Background'}</div>
            <div className="ws-bg-grid">
              {(Object.entries(BACKGROUNDS) as [Background, typeof BACKGROUNDS[Background]][]).map(([key, val]) => (
                <button
                  key={key}
                  className={`ws-bg-btn ${config.background === key ? 'ws-bg-active' : ''}`}
                  onClick={() => updateConfig('background', key)}
                  title={val.label}
                >
                  {key === 'none' ? (
                    <span className="ws-bg-none">✕</span>
                  ) : key === 'blur' ? (
                    <span className="ws-bg-blur">模糊</span>
                  ) : (
                    <div className="ws-bg-preview" style={{ background: val.style }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Style Options */}
          <div className="ws-section">
            <div className="ws-section-title">{ui.style || 'Style'}</div>

            <div className="ws-slider-row">
              <label>{ui.padding || 'Padding'}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.padding}
                onChange={e => updateConfig('padding', Number(e.target.value))}
              />
              <span className="ws-slider-val">{config.padding}px</span>
            </div>

            <div className="ws-slider-row">
              <label>{ui.borderRadius || 'Border Radius'}</label>
              <input
                type="range"
                min="0"
                max="32"
                value={config.borderRadius}
                onChange={e => updateConfig('borderRadius', Number(e.target.value))}
              />
              <span className="ws-slider-val">{config.borderRadius}px</span>
            </div>

            <label className="ws-checkbox">
              <input
                type="checkbox"
                checked={config.shadow}
                onChange={e => updateConfig('shadow', e.target.checked)}
              />
              <span>{ui.shadow || 'Shadow'}</span>
            </label>
          </div>

          {/* Export Options */}
          <div className="ws-section">
            <div className="ws-section-title">{ui.export || 'Export'}</div>

            <div className="ws-btn-group">
              <button
                className={`ws-btn ${config.format === 'png' ? 'ws-btn-active' : ''}`}
                onClick={() => updateConfig('format', 'png')}
              >
                PNG
              </button>
              <button
                className={`ws-btn ${config.format === 'jpeg' ? 'ws-btn-active' : ''}`}
                onClick={() => updateConfig('format', 'jpeg')}
              >
                JPEG
              </button>
            </div>

            {config.format === 'jpeg' && (
              <div className="ws-slider-row">
                <label>{ui.quality || 'Quality'}</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={config.quality}
                  onChange={e => updateConfig('quality', Number(e.target.value))}
                />
                <span className="ws-slider-val">{config.quality}%</span>
              </div>
            )}

            <button
              className="ws-export-btn"
              onClick={handleExport}
              disabled={!screenshot}
            >
              {ui.download || 'Download'} {config.format.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="ws-preview-area">
          <div className="ws-preview-container" ref={previewRef}>
            {loading ? (
              <div className="ws-loading">
                <div className="ws-loading-spinner" />
                <div className="ws-loading-text">
                  {ui.capturing || 'Generating preview...'}
                </div>
                <div className="ws-loading-sub">
                  {lang === 'zh' ? '截图生成中，请稍候...' : 'Generating screenshot, please wait...'}
                </div>
              </div>
            ) : screenshot ? (
              <div
                className={`ws-preview-wrapper ${config.shadow ? 'ws-shadow' : ''}`}
                style={{
                  background: config.background === 'blur' ? undefined : BACKGROUNDS[config.background].style,
                  padding: config.padding,
                }}
              >
                {config.background === 'blur' && screenshot && (
                  <>
                    <div
                      className="ws-blur-bg"
                      style={{ backgroundImage: `url(${screenshot})` }}
                    />
                    <div className="ws-blur-overlay" />
                  </>
                )}
                <div
                  className="ws-screenshot-frame"
                  style={{ borderRadius: config.borderRadius }}
                >
                  {renderFrame(
                    <img
                      src={screenshot}
                      alt="Screenshot"
                      className="ws-screenshot-img"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="ws-empty">
                <div className="ws-empty-icon">📸</div>
                <div className="ws-empty-text">
                  {ui.emptyText || 'Enter a URL and click Capture to generate a screenshot'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
