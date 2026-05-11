import { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

interface FaviconSize { size: number; label: string; platform: string; }

const FAVICON_SIZES: FaviconSize[] = [
  { size: 16, label: '16×16', platform: 'Browser tab' },
  { size: 32, label: '32×32', platform: 'Favicon / Retina tab' },
  { size: 48, label: '48×48', platform: 'Windows site tile' },
  { size: 57, label: '57×57', platform: 'iOS (old)' },
  { size: 60, label: '60×60', platform: 'iOS' },
  { size: 72, label: '72×72', platform: 'iPad' },
  { size: 76, label: '76×76', platform: 'iPad' },
  { size: 96, label: '96×96', platform: 'Google TV' },
  { size: 114, label: '114×114', platform: 'iPhone Retina' },
  { size: 120, label: '120×120', platform: 'iPhone Retina' },
  { size: 128, label: '128×128', platform: 'Chrome Web Store' },
  { size: 144, label: '144×144', platform: 'Windows tile' },
  { size: 152, label: '152×152', platform: 'iPad Retina' },
  { size: 167, label: '167×167', platform: 'iPad Pro' },
  { size: 180, label: '180×180', platform: 'Apple Touch Icon' },
  { size: 192, label: '192×192', platform: 'Android Chrome' },
  { size: 196, label: '196×196', platform: 'Android Chrome' },
  { size: 256, label: '256×256', platform: 'Windows tile (large)' },
  { size: 512, label: '512×512', platform: 'PWA splash' },
];

type ShapeMode = 'square' | 'rounded' | 'circle';

function renderFavicon(
  ctx: CanvasRenderingContext2D,
  size: number,
  text: string,
  bgColor: string,
  fgColor: string,
  fontSize: number,
  shape: ShapeMode,
  image: HTMLImageElement | null,
  imageOptions: ImageOptions,
): void {
  ctx.clearRect(0, 0, size, size);

  // Background shape
  ctx.fillStyle = bgColor;
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'rounded') {
    const r = size * 0.15;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.arcTo(size, 0, size, r, r);
    ctx.lineTo(size, size - r);
    ctx.arcTo(size, size, size - r, size, r);
    ctx.lineTo(r, size);
    ctx.arcTo(0, size, 0, size - r, r);
    ctx.lineTo(0, r);
    ctx.arcTo(0, 0, r, 0, r);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, size, size);
  }

  if (image) {
    const scale = imageOptions.scale / 100;
    const imgW = image.width * scale;
    const imgH = image.height * scale;
    const imgX = (size - imgW) / 2 + imageOptions.offsetX;
    const imgY = (size - imgH) / 2 + imageOptions.offsetY;

    // Apply image round corners if set
    if (imageOptions.roundCorners > 0) {
      const r = imageOptions.roundCorners;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(imgX + r, imgY);
      ctx.lineTo(imgX + imgW - r, imgY);
      ctx.arcTo(imgX + imgW, imgY, imgX + imgW, imgY + r, r);
      ctx.lineTo(imgX + imgW, imgY + imgH - r);
      ctx.arcTo(imgX + imgW, imgY + imgH, imgX + imgW - r, imgY + imgH, r);
      ctx.lineTo(imgX + r, imgY + imgH);
      ctx.arcTo(imgX, imgY + imgH, imgX, imgY + imgH - r, r);
      ctx.lineTo(imgX, imgY + r);
      ctx.arcTo(imgX, imgY, imgX + r, imgY, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, imgX, imgY, imgW, imgH);
      ctx.restore();
    } else {
      ctx.drawImage(image, imgX, imgY, imgW, imgH);
    }
  } else if (text) {
    ctx.fillStyle = fgColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const scaledSize = Math.round(fontSize * (size / 512));
    ctx.font = `${scaledSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`;
    ctx.fillText(text, size / 2, size / 2 + size * 0.02);
  }
}

interface ImageOptions {
  scale: number;     // 10-200 %
  offsetX: number;   // -200 to 200 px
  offsetY: number;   // -200 to 200 px
  roundCorners: number; // 0-256 px
}

export default function FaviconGenerator() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('favicon');
  const [text, setText] = useState('⚡');
  const [bgColor, setBgColor] = useState('#6366f1');
  const [fgColor, setFgColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(120);
  const [shape, setShape] = useState<ShapeMode>('rounded');
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [imageOptions, setImageOptions] = useState<ImageOptions>({ scale: 100, offsetX: 0, offsetY: 0, roundCorners: 0 });
  const [selectedSizes, setSelectedSizes] = useState<number[]>([16, 32, 180, 192, 512]);
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      setSourceImage(img);
      setImageOptions({ scale: 100, offsetX: 0, offsetY: 0, roundCorners: 0 });
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const clearImage = useCallback(() => {
    setSourceImage(null);
    setImageOptions({ scale: 100, offsetX: 0, offsetY: 0, roundCorners: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const toggleSize = (size: number) => {
    setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size].sort((a, b) => a - b));
  };

  const selectAll = () => setSelectedSizes(FAVICON_SIZES.map((s) => s.size));
  const selectCommon = () => setSelectedSizes([16, 32, 180, 192, 512]);

  const generatePng = useCallback((size: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      renderFavicon(ctx, size, text, bgColor, fgColor, fontSize, shape, sourceImage, imageOptions);
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
  }, [text, bgColor, fgColor, fontSize, shape, sourceImage, imageOptions]);

  const downloadAll = useCallback(async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      await Promise.all(
        selectedSizes.map(async (size) => {
          const blob = await generatePng(size);
          zip.file(`favicon-${size}x${size}.png`, blob);
        })
      );
      // Also add the HTML snippet
      const html = generateHtml(selectedSizes);
      zip.file('favicon.html', html);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.download = 'favicons.zip';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }, [selectedSizes, generatePng]);

  const copyHtml = () => navigator.clipboard.writeText(generateHtml(selectedSizes));

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.settings')}</div>
          <div className="uuid-config">
            {/* Content input */}
            <div className="uuid-config-row">
              <label>{ui.content}</label>
              <div style={{ display: 'flex', gap: 6, flex: 1, alignItems: 'center' }}>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={ui.contentPlaceholder}
                  disabled={!!sourceImage}
                  style={{ flex: 1, padding: '6px 10px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 16, opacity: sourceImage ? 0.5 : 1 }}
                />
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                {sourceImage ? (
                  <button className="panel-btn panel-btn-sm" onClick={clearImage} style={{ color: 'var(--red)' }}>{ui.clearImage}</button>
                ) : (
                  <button className="panel-btn panel-btn-sm" onClick={() => fileInputRef.current?.click()}>{ui.uploadImage}</button>
                )}
              </div>
            </div>

            {/* Font size (only for text mode) */}
            {!sourceImage && (
              <div className="uuid-config-row">
                <label>{ui.fontSize}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <input type="range" min={60} max={200} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', minWidth: 32 }}>{fontSize}</span>
                </div>
              </div>
            )}

            {/* Image editing options */}
            {sourceImage && (
              <>
                <div className="uuid-config-row">
                  <label>{ui.imageScale}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <input type="range" min={10} max={200} value={imageOptions.scale} onChange={(e) => setImageOptions({ ...imageOptions, scale: parseInt(e.target.value) })} style={{ flex: 1 }} />
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', minWidth: 36 }}>{imageOptions.scale}%</span>
                  </div>
                </div>
                <div className="uuid-config-row">
                  <label>{ui.imageRound}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <input type="range" min={0} max={256} value={imageOptions.roundCorners} onChange={(e) => setImageOptions({ ...imageOptions, roundCorners: parseInt(e.target.value) })} style={{ flex: 1 }} />
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', minWidth: 36 }}>{imageOptions.roundCorners}px</span>
                  </div>
                </div>
                <div className="uuid-config-row">
                  <label>{ui.imageOffset}</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>X</span>
                    <input type="range" min={-200} max={200} value={imageOptions.offsetX} onChange={(e) => setImageOptions({ ...imageOptions, offsetX: parseInt(e.target.value) })} style={{ flex: 1 }} />
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Y</span>
                    <input type="range" min={-200} max={200} value={imageOptions.offsetY} onChange={(e) => setImageOptions({ ...imageOptions, offsetY: parseInt(e.target.value) })} style={{ flex: 1 }} />
                  </div>
                </div>
              </>
            )}

            {/* Shape */}
            <div className="uuid-config-row">
              <label>{ui.shape}</label>
              <div className="panel-actions">
                <button className={`panel-btn panel-btn-sm${shape === 'square' ? ' accent' : ''}`} onClick={() => setShape('square')}>{ui.square}</button>
                <button className={`panel-btn panel-btn-sm${shape === 'rounded' ? ' accent' : ''}`} onClick={() => setShape('rounded')}>{ui.rounded}</button>
                <button className={`panel-btn panel-btn-sm${shape === 'circle' ? ' accent' : ''}`} onClick={() => setShape('circle')}>{ui.circle}</button>
              </div>
            </div>

            {/* Colors */}
            <div className="uuid-config-row">
              <label>{ui.colors}</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{ui.bg}</span>
                  <div style={{ position: 'relative', width: 30, height: 24 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 4, background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px' }} />
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', opacity: 0.9 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{ui.fg}</span>
                  <div style={{ position: 'relative', width: 30, height: 24 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 4, background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px' }} />
                    <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', opacity: 0.9 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Size selector */}
          <div className="panel-header">
            {ui.sizes}
            <div className="panel-actions">
              <button className="panel-btn panel-btn-sm" onClick={selectCommon}>{ui.commonSizes}</button>
              <button className="panel-btn panel-btn-sm" onClick={selectAll}>{ui.selectAll}</button>
            </div>
          </div>
          <div style={{ padding: '8px 16px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {FAVICON_SIZES.map((s) => (
              <button
                key={s.size}
                className={`panel-btn panel-btn-sm${selectedSizes.includes(s.size) ? ' accent' : ''}`}
                onClick={() => toggleSize(s.size)}
                title={s.platform}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '8px 16px 12px', display: 'flex', gap: 8 }}>
            <button className="panel-btn accent" onClick={downloadAll} disabled={downloading} style={{ flex: 1 }}>
              {downloading ? '打包中…' : `${ui.downloadAll} (${selectedSizes.length})`}
            </button>
            <button className="panel-btn" onClick={copyHtml}>{ui.copyHtml}</button>
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">{t('common.preview')}</div>
          <div style={{ padding: 16 }}>
            {/* Main preview */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 4, background: 'var(--surface-2)' }}>
                <PreviewCanvas text={text} bgColor={bgColor} fgColor={fgColor} fontSize={fontSize} shape={shape} image={sourceImage} imageOptions={imageOptions} previewSize={512} displaySize={200} />
              </div>
            </div>
            {/* Size previews */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end' }}>
              {[16, 32, 48, 64, 96].map((size) => (
                <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: 2, background: 'var(--surface-2)' }}>
                    <PreviewCanvas text={text} bgColor={bgColor} fgColor={fgColor} fontSize={fontSize} shape={shape} image={sourceImage} imageOptions={imageOptions} previewSize={512} displaySize={size} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{size}px</span>
                </div>
              ))}
            </div>
          </div>
          {/* HTML snippet */}
          <div className="panel-header">{ui.htmlSnippet}</div>
          <pre style={{ margin: 0, padding: 16, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {generateHtml(selectedSizes)}
          </pre>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}

function generateHtml(sizes: number[]): string {
  const lines = sizes.map((size) => {
    if (size === 16) return `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">`;
    if (size === 32) return `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">`;
    if (size === 180) return `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`;
    if (size === 192) return `<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">`;
    if (size === 512) return `<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">`;
    return `<link rel="icon" type="image/png" sizes="${size}x${size}" href="/favicon-${size}x${size}.png">`;
  });
  return lines.join('\n');
}

function PreviewCanvas({ text, bgColor, fgColor, fontSize, shape, image, imageOptions, previewSize, displaySize }: {
  text: string; bgColor: string; fgColor: string; fontSize: number; shape: ShapeMode; image: HTMLImageElement | null; imageOptions: ImageOptions; previewSize: number; displaySize?: number;
}) {
  const refCallback = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    canvas.width = previewSize;
    canvas.height = previewSize;
    const ctx = canvas.getContext('2d')!;
    renderFavicon(ctx, previewSize, text, bgColor, fgColor, fontSize, shape, image, imageOptions);
  };

  const display = displaySize ?? previewSize;
  return <canvas ref={refCallback} width={previewSize} height={previewSize} style={{ display: 'block', width: display, height: display, imageRendering: display < 48 ? 'pixelated' : 'auto' }} />;
}
