import { useState, useRef, useEffect, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14' | 'pharmacode' | 'codabar';

const FORMATS: { value: BarcodeFormat; label: string; desc: string }[] = [
  { value: 'CODE128', label: 'Code 128', desc: '通用，支持全部 ASCII' },
  { value: 'CODE39', label: 'Code 39', desc: '大写字母+数字' },
  { value: 'EAN13', label: 'EAN-13', desc: '13 位商品条码' },
  { value: 'EAN8', label: 'EAN-8', desc: '8 位商品条码' },
  { value: 'UPC', label: 'UPC-A', desc: '12 位北美商品码' },
  { value: 'ITF14', label: 'ITF-14', desc: '物流包装码' },
  { value: 'pharmacode', label: 'Pharmacode', desc: '药品编码' },
  { value: 'codabar', label: 'Codabar', desc: '图书馆/血库' },
];

export default function BarcodeGenerator() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('barcode');
  const [value, setValue] = useState('');
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [lineColor, setLineColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showText, setShowText] = useState(true);
  const [height, setHeight] = useState(80);
  const [error, setError] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  const render = useCallback(() => {
    if (!svgRef.current || !value.trim()) { setError(''); return; }
    try {
      JsBarcode(svgRef.current, value.trim(), {
        format,
        lineColor,
        background: bgColor,
        displayValue: showText,
        height,
        margin: 10,
        fontSize: 14,
        font: 'monospace',
      });
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Barcode generation error');
    }
  }, [value, format, lineColor, bgColor, showText, height]);

  useEffect(() => { render(); }, [render]);

  const downloadSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `barcode-${value || 'empty'}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = `barcode-${value || 'empty'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const currentFormat = FORMATS.find((f) => f.value === format);

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.settings')}</div>
          <div className="uuid-config">
            <div className="uuid-config-row">
              <label>{ui.format}</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as BarcodeFormat)} style={{ flex: 1, padding: '4px 8px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13 }}>
                {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label} — {f.desc}</option>)}
              </select>
            </div>
            <div className="uuid-config-row">
              <label>{ui.value}</label>
              <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={currentFormat?.desc || ui.placeholder} style={{ flex: 1, padding: '6px 10px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, fontFamily: 'var(--font-mono)' }} />
            </div>
            <div className="uuid-config-row">
              <label>{ui.height}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <input type="range" min={30} max={200} value={height} onChange={(e) => setHeight(parseInt(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', minWidth: 32 }}>{height}px</span>
              </div>
            </div>
            <div className="uuid-config-row">
              <label>{ui.colors}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={lineColor} onChange={(e) => setLineColor(e.target.value)} style={{ width: 32, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: 32, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} />{ui.showText}
                </label>
              </div>
            </div>
          </div>
          <div style={{ padding: '8px 16px', display: 'flex', gap: 8 }}>
            <button className="panel-btn accent" onClick={downloadPNG} style={{ flex: 1 }}>{t('common.download')} PNG</button>
            <button className="panel-btn" onClick={downloadSVG} style={{ flex: 1 }}>{t('common.download')} SVG</button>
          </div>
          {error && <div className="error-msg" style={{ margin: '0 16px 12px' }}>{error}</div>}
        </div>
        <div className="tool-panel">
          <div className="panel-header">{t('common.preview')}</div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24, minHeight: 200 }}>
            {value.trim() ? (
              <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }} />
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t('common.waiting')}</div>
            )}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
