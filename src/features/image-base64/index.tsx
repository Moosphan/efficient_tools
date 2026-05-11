import { useState, useRef, useCallback } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type OutputMode = 'datauri' | 'pure' | 'css' | 'html' | 'markdown';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMimeType(dataUri: string): string {
  const match = dataUri.match(/^data:([^;]+);/);
  return match ? match[1] : 'image/png';
}

function formatOutput(dataUri: string, mode: OutputMode): string {
  const mime = getMimeType(dataUri);
  const pure = dataUri.replace(/^data:[^;]+;base64,/, '');

  switch (mode) {
    case 'datauri':
      return dataUri;
    case 'pure':
      return pure;
    case 'css':
      return `background-image: url("${dataUri}");\nbackground-size: contain;\nbackground-repeat: no-repeat;`;
    case 'html':
      return `<img src="${dataUri}" alt="image" />`;
    case 'markdown':
      return `![image](${dataUri})`;
    default:
      return dataUri;
  }
}

export default function ImageBase64() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('imgBase64');
  const [dataUri, setDataUri] = useState('');
  const [inputText, setInputText] = useState('');
  const [outputMode, setOutputMode] = useState<OutputMode>('datauri');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setFileName(file.name);
    setFileSize(file.size);
    try {
      const uri = await fileToBase64(file);
      setDataUri(uri);
      setInputText('');
      // Get image dimensions
      const img = new Image();
      img.onload = () => setImgSize({ w: img.width, h: img.height });
      img.src = uri;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'File read error');
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleFile(file);
        break;
      }
    }
  }, [handleFile]);

  const handleTextInput = useCallback((text: string) => {
    setInputText(text);
    setError('');
    if (!text.trim()) { setDataUri(''); return; }
    // Try to decode base64 to image
    let uri = text.trim();
    if (!uri.startsWith('data:')) {
      // Pure base64 — try to detect type from magic bytes
      try {
        const binary = atob(uri);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        let mime = 'image/png';
        if (bytes[0] === 0xFF && bytes[1] === 0xD8) mime = 'image/jpeg';
        else if (bytes[0] === 0x89 && bytes[1] === 0x50) mime = 'image/png';
        else if (bytes[0] === 0x47 && bytes[1] === 0x49) mime = 'image/gif';
        else if (bytes[0] === 0x52 && bytes[1] === 0x49) mime = 'image/webp';
        uri = `data:${mime};base64,${text.trim()}`;
      } catch {
        setError(ui.invalidBase64);
        return;
      }
    }
    setDataUri(uri);
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.width, h: img.height });
      setFileName('');
      // Estimate file size from base64 length
      const base64Part = uri.split(',')[1] || '';
      setFileSize(Math.floor(base64Part.length * 0.75));
    };
    img.onerror = () => setError(ui.invalidImage);
    img.src = uri;
  }, [ui]);

  const output = dataUri ? formatOutput(dataUri, outputMode) : '';
  const copy = () => { if (output) navigator.clipboard.writeText(output); };

  const downloadImage = () => {
    if (!dataUri) return;
    const link = document.createElement('a');
    const ext = getMimeType(dataUri).split('/')[1] === 'jpeg' ? 'jpg' : getMimeType(dataUri).split('/')[1];
    link.download = fileName || `image.${ext}`;
    link.href = dataUri;
    link.click();
  };

  const clear = () => {
    setDataUri('');
    setInputText('');
    setError('');
    setFileName('');
    setFileSize(0);
    setImgSize({ w: 0, h: 0 });
  };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => fileInputRef.current?.click()}>{ui.uploadImage}</button>
              <button className="panel-btn" onClick={clear}>{t('common.clear')}</button>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} style={{ display: 'none' }} />
          <div
            className="qr-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onPaste={handlePaste}
            onClick={() => fileInputRef.current?.click()}
            style={{ margin: '10px 16px 0', padding: '20px 16px', cursor: 'pointer' }}
          >
            <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
              {ui.dropzone}
            </div>
          </div>
          <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{ui.orPaste}</span>
            <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <textarea
            className="tool-textarea"
            value={inputText}
            onChange={(e) => handleTextInput(e.target.value)}
            placeholder={ui.textPlaceholder}
            style={{ minHeight: 80, fontSize: 11 }}
          />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              {([['datauri', 'Data URI'], ['pure', 'Base64'], ['css', 'CSS'], ['html', 'HTML'], ['markdown', 'MD']] as const).map(([k, l]) => (
                <button key={k} className={`panel-btn panel-btn-sm${outputMode === k ? ' accent' : ''}`} onClick={() => setOutputMode(k as OutputMode)}>{l}</button>
              ))}
            </div>
          </div>
          {dataUri && (
            <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Image preview */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 4, background: 'var(--surface-2)', flexShrink: 0 }}>
                <img src={dataUri} alt="" style={{ display: 'block', maxWidth: 80, maxHeight: 80, borderRadius: 4 }} />
              </div>
              {/* Info */}
              <div style={{ flex: 1, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)', lineHeight: 1.8 }}>
                {fileName && <div>{fileName}</div>}
                <div>{imgSize.w} × {imgSize.h}px · {formatBytes(fileSize)}</div>
                <div>{getMimeType(dataUri)}</div>
              </div>
              <button className="panel-btn panel-btn-sm" onClick={downloadImage}>{t('common.download')}</button>
            </div>
          )}
          <div style={{ padding: '10px 16px 8px', display: 'flex', gap: 8 }}>
            <button className="panel-btn accent" onClick={copy} style={{ flex: 1 }} disabled={!output}>{t('common.copy')}</button>
          </div>
          {error && <div className="error-msg" style={{ margin: '0 16px 12px' }}>{error}</div>}
          <pre style={{ flex: 1, padding: 16, margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.6, color: output ? 'var(--fg)' : 'var(--muted)', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {output || t('common.waiting')}
          </pre>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
