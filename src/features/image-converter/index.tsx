import { useState, useRef, useCallback } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

interface ConvertResult {
  name: string;
  width: number;
  height: number;
  originalSize: number;
  convertedSize: number;
  convertedUrl: string;
  convertedBlob: Blob;
  fromFormat: string;
  toFormat: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

const FORMAT_EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

export default function ImageConverter() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('imgConvert');
  const [targetFormat, setTargetFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState(92);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setSourceFile(file);
    setResult(null);
    if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    setSourcePreviewUrl(URL.createObjectURL(file));
  }, [sourcePreviewUrl]);

  const convert = useCallback(() => {
    if (!sourceFile) return;
    setProcessing(true);
    const fromFormat = sourceFile.type || 'unknown';
    const imgUrl = URL.createObjectURL(sourceFile);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(imgUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, img.width, img.height);
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) { setProcessing(false); return; }
        setResult({
          name: sourceFile.name,
          width: img.width, height: img.height,
          originalSize: sourceFile.size,
          convertedSize: blob.size,
          convertedUrl: URL.createObjectURL(blob),
          convertedBlob: blob,
          fromFormat: fromFormat.replace('image/', '').toUpperCase() || '?',
          toFormat: targetFormat.split('/')[1].toUpperCase(),
        });
        setProcessing(false);
      }, targetFormat, targetFormat === 'image/png' ? undefined : quality / 100);
    };
    img.src = imgUrl;
  }, [sourceFile, targetFormat, quality]);

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
    const ext = FORMAT_EXT[targetFormat];
    const baseName = result.name.replace(/\.[^.]+$/, '');
    const link = document.createElement('a');
    link.download = `${baseName}.${ext}`;
    link.href = result.convertedUrl;
    link.click();
  };

  const formats: OutputFormat[] = ['image/png', 'image/jpeg', 'image/webp'];

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.settings')}</div>
          <div className="uuid-config">
            <div className="uuid-config-row">
              <label>{ui.targetFormat}</label>
              <div className="panel-actions">
                {formats.map((f) => (
                  <button key={f} className={`panel-btn panel-btn-sm${targetFormat === f ? ' accent' : ''}`} onClick={() => setTargetFormat(f)}>{f.split('/')[1].toUpperCase()}</button>
                ))}
              </div>
            </div>
            {targetFormat !== 'image/png' && (
              <div className="uuid-config-row">
                <label>{ui.quality}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', minWidth: 36, textAlign: 'right' }}>{quality}%</span>
                </div>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} style={{ display: 'none' }} />
          <div className="qr-dropzone" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} style={{ margin: '12px 16px', padding: '24px 16px', cursor: 'pointer' }}>
            <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
              {sourceFile ? `${sourceFile.name} (${formatBytes(sourceFile.size)})` : ui.dropzone}
            </div>
          </div>
          {sourceFile && (
            <button className="panel-btn accent" onClick={convert} disabled={processing} style={{ margin: '0 16px 12px', width: 'calc(100% - 32px)' }}>
              {processing ? ui.processing : ui.convert}
            </button>
          )}
        </div>
        <div className="tool-panel">
          <div className="panel-header">{t('common.output')}</div>
          {result ? (
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, background: 'var(--surface-2)', borderRadius: 8, padding: 8 }}>
                <img src={result.convertedUrl} alt="" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: 'var(--muted)' }}>{ui.from}: </span>{result.fromFormat}</div>
                <div><span style={{ color: 'var(--muted)' }}>{ui.to}: </span>{result.toFormat}</div>
                <div><span style={{ color: 'var(--muted)' }}>{ui.originalSize}: </span>{formatBytes(result.originalSize)}</div>
                <div><span style={{ color: 'var(--muted)' }}>{ui.convertedSize}: </span>{formatBytes(result.convertedSize)}</div>
                <div><span style={{ color: 'var(--muted)' }}>{ui.dimensions}: </span>{result.width}×{result.height}</div>
              </div>
              <button className="panel-btn accent" onClick={download} style={{ marginTop: 16, width: '100%' }}>{t('common.download')}</button>
            </div>
          ) : sourcePreviewUrl ? (
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'center', background: 'var(--surface-2)', borderRadius: 8, padding: 8 }}>
                <img src={sourcePreviewUrl} alt="" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4 }} />
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
