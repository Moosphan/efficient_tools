import { useState, useRef, useCallback, useEffect } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type Position = 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right' | 'tile';

const POSITIONS: { id: Position; label: string }[] = [
  { id: 'top-left', label: '↖' },
  { id: 'top-right', label: '↗' },
  { id: 'center', label: '◎' },
  { id: 'bottom-left', label: '↙' },
  { id: 'bottom-right', label: '↘' },
  { id: 'tile', label: '▦' },
];

export default function WatermarkTool() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('watermark');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [text, setText] = useState('WATERMARK');
  const [fontSize, setFontSize] = useState(32);
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(-30);
  const [position, setPosition] = useState<Position>('tile');
  const [color, setColor] = useState('#ffffff');

  useCleanup(() => { setImage(null); setFileName(''); });

  const loadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => { setImage(img); setFileName(file.name); };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImage(file);
  }, [loadImage]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
  }, [loadImage]);

  // Draw watermark
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

    const drawText = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    };

    const tw = ctx.measureText(text).width;

    if (position === 'tile') {
      const gapX = tw + 100;
      const gapY = fontSize * 4;
      for (let y = -canvas.height; y < canvas.height * 2; y += gapY) {
        for (let x = -canvas.width; x < canvas.width * 2; x += gapX) {
          drawText(x, y);
        }
      }
    } else {
      const pad = 40;
      let x = 0, y = 0;
      switch (position) {
        case 'top-left': x = pad; y = pad + fontSize; break;
        case 'top-right': x = canvas.width - tw - pad; y = pad + fontSize; break;
        case 'center': x = (canvas.width - tw) / 2; y = canvas.height / 2; break;
        case 'bottom-left': x = pad; y = canvas.height - pad; break;
        case 'bottom-right': x = canvas.width - tw - pad; y = canvas.height - pad; break;
      }
      drawText(x, y);
    }
    ctx.globalAlpha = 1;
  }, [image, text, fontSize, opacity, rotation, position, color]);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const ext = fileName.split('.').pop() || 'png';
      a.download = `watermarked.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }, [image, fileName]);

  return (
    <ToolShell title={name} description={desc} headerRight={image ? <button className="btn" onClick={download}>{ui.download}</button> : undefined}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.settings')}</div>
          <div className="wm-settings">
            <div className="wm-row">
              <label>{ui.text}</label>
              <input className="input-field" value={text} onChange={(e) => setText(e.target.value)} placeholder={ui.textPlaceholder} />
            </div>
            <div className="wm-row">
              <label>{ui.fontSize}</label>
              <input type="range" min={12} max={120} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
              <span className="wm-val">{fontSize}px</span>
            </div>
            <div className="wm-row">
              <label>{ui.opacity}</label>
              <input type="range" min={5} max={100} value={opacity * 100} onChange={(e) => setOpacity(Number(e.target.value) / 100)} />
              <span className="wm-val">{Math.round(opacity * 100)}%</span>
            </div>
            <div className="wm-row">
              <label>{ui.rotation}</label>
              <input type="range" min={-90} max={90} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
              <span className="wm-val">{rotation}°</span>
            </div>
            <div className="wm-row">
              <label>{ui.color}</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <div className="wm-row">
              <label>{ui.position}</label>
              <div className="panel-actions">
                {POSITIONS.map((p) => (
                  <button key={p.id} className={`panel-btn panel-btn-sm${position === p.id ? ' accent' : ''}`} onClick={() => setPosition(p.id)}>{p.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">{t('common.preview')}</div>
          {image ? (
            <canvas ref={canvasRef} className="wm-canvas" />
          ) : (
            <div className="wm-dropzone" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
              <div className="wm-drop-icon">🖼</div>
              <div className="wm-drop-text">{ui.dropHint}</div>
              <label className="btn" style={{ cursor: 'pointer' }}>
                {ui.selectFile}
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>
          )}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
