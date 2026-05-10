import { useState, useRef, useCallback } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

interface ImageInfo {
  name: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressedUrl: string;
  compressedBlob: Blob;
  format: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function ImageCompressor() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('imgCompress');
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/jpeg');
  const [maxWidth, setMaxWidth] = useState(0);
  const [result, setResult] = useState<ImageInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setSourceFile(file);
    setResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  const compress = useCallback(() => {
    if (!sourceFile) return;
    setProcessing(true);
    const img = new Image();
    const url = URL.createObjectURL(sourceFile);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width, h = img.height;
      if (maxWidth > 0 && w > maxWidth) {
        h = Math.round(h * (maxWidth / w));
        w = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) { setProcessing(false); return; }
        setResult({
          name: sourceFile.name,
          width: w, height: h,
          originalSize: sourceFile.size,
          compressedSize: blob.size,
          compressedUrl: URL.createObjectURL(blob),
          compressedBlob: blob,
          format: format.split('/')[1].toUpperCase(),
        });
        setProcessing(false);
      }, format, format === 'image/png' ? undefined : quality / 100);
    };
    img.src = url;
  }, [sourceFile, quality, format, maxWidth]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const download = () => {
    if (!result) return;
    const ext = format.split('/')[1];
    const baseName = result.name.replace(/\.[^.]+$/, '');
    const link = document.createElement('a');
    link.download = `${baseName}-compressed.${ext}`;
    link.href = result.compressedUrl;
    link.click();
  };

  const ratio = result ? Math.round((1 - result.compressedSize / result.originalSize) * 100) : 0;

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.settings')}</div>
          <div className="uuid-config">
            <div className="uuid-config-row">
              <label>{ui.format}</label>
              <div className="panel-actions">
                {(['image/jpeg', 'image/webp', 'image/png'] as const).map((f) => (
                  <button key={f} className={`panel-btn panel-btn-sm${format === f ? ' accent' : ''}`} onClick={() => setFormat(f)}>{f.split('/')[1].toUpperCase()}</button>
                ))}
              </div>
            </div>
            {format !== 'image/png' && (
              <div className="uuid-config-row">
                <label>{ui.quality}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', minWidth: 36, textAlign: 'right' }}>{quality}%</span>
                </div>
              </div>
            )}
            {format === 'image/png' && (
              <div style={{ fontSize: 12, color: 'var(--amber)', padding: '4px 0' }}>{ui.pngTip}</div>
            )}
            <div className="uuid-config-row">
              <label>{ui.maxWidth}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <input type="range" min={0} max={3840} step={100} value={maxWidth} onChange={(e) => setMaxWidth(parseInt(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', minWidth: 48, textAlign: 'right' }}>{maxWidth === 0 ? ui.noLimit : maxWidth + 'px'}</span>
              </div>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} style={{ display: 'none' }} />
          <div className="qr-dropzone" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} style={{ margin: '12px 16px', padding: '24px 16px', cursor: 'pointer' }}>
            <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
              {sourceFile ? `${sourceFile.name} (${formatBytes(sourceFile.size)})` : ui.dropzone}
            </div>
          </div>
          {sourceFile && (
            <button className="panel-btn accent" onClick={compress} disabled={processing} style={{ margin: '0 16px 12px', width: 'calc(100% - 32px)' }}>
              {processing ? ui.processing : ui.compress}
            </button>
          )}
        </div>
        <div className="tool-panel">
          <div className="panel-header">{t('common.output')}</div>
          {result ? (
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, background: 'var(--surface-2)', borderRadius: 8, padding: 8 }}>
                <img src={result.compressedUrl} alt="" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: 'var(--muted)' }}>{ui.originalSize}: </span>{formatBytes(result.originalSize)}</div>
                <div><span style={{ color: 'var(--muted)' }}>{ui.compressedSize}: </span>{formatBytes(result.compressedSize)}</div>
                <div><span style={{ color: 'var(--muted)' }}>{ui.dimensions}: </span>{result.width}×{result.height}</div>
                <div><span style={{ color: 'var(--muted)' }}>{ui.reduction}: </span><span style={{ color: ratio > 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{ratio > 0 ? '-' : '+'}{Math.abs(ratio)}%</span></div>
              </div>
              {ratio < 0 && <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8 }}>{ui.sizeIncreased}</div>}
              <button className="panel-btn accent" onClick={download} style={{ marginTop: 16, width: '100%' }}>{t('common.download')}</button>
            </div>
          ) : previewUrl ? (
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'center', background: 'var(--surface-2)', borderRadius: 8, padding: 8 }}>
                <img src={previewUrl} alt="" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4 }} />
              </div>
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>{ui.adjustHint}</div>
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('common.waiting')}</div>
          )}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
