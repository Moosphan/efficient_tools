import { useState, useRef, useCallback, useEffect } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Types ──

interface Segment {
  id: string;
  text: string;
  color: string;
}

interface Theme {
  id: string;
  name: { zh: string; en: string };
  colors: string[];
  bg: string;
  pointer: string;
  text: string;
  glow: string;
}

// ── Themes ──

const THEMES: Theme[] = [
  {
    id: 'neon',
    name: { zh: '霓虹', en: 'Neon' },
    colors: ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0', '#ffd166', '#ef476f', '#118ab2', '#073b4c'],
    bg: '#0a0a1a',
    pointer: '#ff006e',
    text: '#ffffff',
    glow: '0 0 20px rgba(255,0,110,0.6)',
  },
  {
    id: 'sunset',
    name: { zh: '日落', en: 'Sunset' },
    colors: ['#ff6b6b', '#ffa07a', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6', '#e74c3c', '#f39c12'],
    bg: '#1a1a2e',
    pointer: '#ffd93d',
    text: '#ffffff',
    glow: '0 0 20px rgba(255,217,61,0.5)',
  },
  {
    id: 'ocean',
    name: { zh: '海洋', en: 'Ocean' },
    colors: ['#0077b6', '#00b4d8', '#90e0ef', '#48cae4', '#023e8a', '#0096c7', '#ade8f4', '#caf0f8'],
    bg: '#03071e',
    pointer: '#00b4d8',
    text: '#ffffff',
    glow: '0 0 20px rgba(0,180,216,0.5)',
  },
  {
    id: 'forest',
    name: { zh: '森林', en: 'Forest' },
    colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#d8f3dc', '#1b4332'],
    bg: '#1b1b1b',
    pointer: '#52b788',
    text: '#ffffff',
    glow: '0 0 20px rgba(82,183,136,0.5)',
  },
  {
    id: 'candy',
    name: { zh: '糖果', en: 'Candy' },
    colors: ['#ff6f91', '#ff9671', '#ffc75f', '#f9f871', '#d65db1', '#ff6f91', '#ff9671', '#ffc75f'],
    bg: '#2b2b3d',
    pointer: '#ff6f91',
    text: '#ffffff',
    glow: '0 0 20px rgba(255,111,145,0.5)',
  },
  {
    id: 'minimal',
    name: { zh: '极简', en: 'Minimal' },
    colors: ['#222222', '#444444', '#666666', '#888888', '#aaaaaa', '#cccccc', '#222222', '#444444'],
    bg: '#ffffff',
    pointer: '#222222',
    text: '#ffffff',
    glow: '0 2px 10px rgba(0,0,0,0.15)',
  },
];

const DEFAULT_SEGMENTS: Segment[] = [
  { id: '1', text: '选项 A', color: '' },
  { id: '2', text: '选项 B', color: '' },
  { id: '3', text: '选项 C', color: '' },
  { id: '4', text: '选项 D', color: '' },
  { id: '5', text: '选项 E', color: '' },
  { id: '6', text: '选项 F', color: '' },
];

// ── Helper ──

function uid(): string {
  return Math.random().toString(36).slice(2, 8);
}

function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent));
  const b = Math.min(255, (num & 0x0000ff) + Math.round(2.55 * percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ── Determine winner ──
// The pointer is at the top (angle = -PI/2 in canvas coords, i.e. 12 o'clock).
// Segment i occupies canvas angles [startOffset + i*segAngle, startOffset + (i+1)*segAngle]
// where startOffset = angleRef.current - PI/2.
// The pointer is at canvas angle -PI/2.
// We need to find which segment index contains the pointer.
// Pointer canvas angle relative to wheel: (-PI/2 - startOffset) mod 2PI
//   = (-PI/2 - angleRef.current + PI/2) mod 2PI
//   = (-angleRef.current) mod 2PI
// Then index = floor(relativeAngle / segAngle) mod N

function determineWinner(angle: number, count: number): number {
  const segAngle = (2 * Math.PI) / count;
  // Normalize angle to [0, 2PI)
  const normalized = ((-angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const index = Math.floor(normalized / segAngle) % count;
  return index;
}

// ── Main Component ──

export default function SpinWheel() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('spinWheel');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [themeId, setThemeId] = useState('neon');
  const [segments, setSegments] = useState<Segment[]>(DEFAULT_SEGMENTS);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [spinDuration, setSpinDuration] = useState(4000);
  const angleRef = useRef(0);
  const animRef = useRef<number>(0);

  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  const getSegmentColor = useCallback((index: number) => {
    const seg = segments[index];
    if (seg?.color) return seg.color;
    return theme.colors[index % theme.colors.length];
  }, [segments, theme]);

  // Draw wheel
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 16;
    const segAngle = (2 * Math.PI) / segments.length;

    ctx.clearRect(0, 0, size, size);

    // Outer glow ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = theme.pointer;
    ctx.lineWidth = 3;
    ctx.shadowColor = theme.glow.includes('rgba') ? theme.glow.match(/rgba\([^)]+\)/)?.[0] || theme.pointer : theme.pointer;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.restore();

    // Draw segments
    for (let i = 0; i < segments.length; i++) {
      const startAngle = angleRef.current + i * segAngle - Math.PI / 2;
      const endAngle = startAngle + segAngle;
      const color = getSegmentColor(i);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, lighten(color, 20));
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Segment text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.fillStyle = theme.text;
      ctx.font = `bold ${Math.max(11, Math.min(16, r / (segments.length * 0.5)))}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      const textR = r * 0.65;
      ctx.fillText(segments[i].text, textR, 0);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
    centerGrad.addColorStop(0, lighten(theme.pointer, 30));
    centerGrad.addColorStop(1, theme.pointer);
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = theme.pointer;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GO', cx, cy);

    // Decorative dots on rim
    for (let i = 0; i < 24; i++) {
      const dotAngle = (i / 24) * 2 * Math.PI;
      const dx = cx + (r + 4) * Math.cos(dotAngle);
      const dy = cy + (r + 4) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dx, dy, 2, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? theme.pointer : 'rgba(255,255,255,0.3)';
      ctx.fill();
    }
  }, [segments, theme, getSegmentColor]);

  // Spin animation — physics-based friction simulation
  const spin = useCallback(() => {
    if (spinning || segments.length < 2) return;
    setSpinning(true);
    setResult(null);

    // Random initial angular velocity (rad/frame at 60fps)
    const initialSpeed = 0.3 + Math.random() * 0.1;
    const stopThreshold = 0.001;
    // Calibrate friction so total spin time matches spinDuration setting
    // speed decays as: speed * friction^frames, stops at stopThreshold
    // frames = log(stopThreshold/initialSpeed) / log(friction)
    // We solve for friction: friction = (stopThreshold/initialSpeed)^(1/frames)
    const totalFrames = (spinDuration / 1000) * 60;
    const friction = Math.pow(stopThreshold / initialSpeed, 1 / totalFrames);

    let speed = initialSpeed;
    let wobblePhase = 0;

    const animate = () => {
      speed *= friction;

      if (speed > stopThreshold) {
        // Normal spinning
        angleRef.current += speed;
        drawWheel();
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Wobble to a stop — small oscillation for realism
        wobblePhase += 0.15;
        const wobble = Math.sin(wobblePhase) * speed * 2;
        angleRef.current += wobble;
        drawWheel();

        if (wobblePhase < Math.PI * 2) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          // Final position
          const winIndex = determineWinner(angleRef.current, segments.length);
          setResult(segments[winIndex].text);
          setSpinning(false);
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, segments, spinDuration, drawWheel]);

  // Initial draw
  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  useEffect(() => {
    const handleResize = () => drawWheel();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheel]);

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const addSegment = () => {
    setSegments((prev) => [...prev, { id: uid(), text: `选项 ${String.fromCharCode(65 + prev.length)}`, color: '' }]);
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 2) return;
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSegment = (id: string, text: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));
  };

  const updateSegmentColor = (id: string, color: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)));
  };

  return (
    <ToolShell title={name} description={desc}>
      <div className="sw-layout">
        {/* Left: Wheel + Result */}
        <div className="sw-left">
          <div className="sw-wheel-area" style={{ background: theme.bg }}>
            {/* Pointer */}
            <div className="sw-pointer" style={{ color: theme.pointer }}>
              <svg width="32" height="40" viewBox="0 0 32 40">
                <polygon points="16,40 0,0 32,0" fill="currentColor" />
              </svg>
            </div>

            <canvas
              ref={canvasRef}
              className="sw-canvas"
              onClick={spinning ? undefined : spin}
              style={{ cursor: spinning ? 'wait' : 'pointer' }}
            />

            {/* Spin hint */}
            {!spinning && !result && (
              <div className="sw-spin-hint" style={{ color: theme.text }}>
                {ui.clickToSpin}
              </div>
            )}
          </div>

          {/* Result bar - separate from wheel */}
          <div className="sw-result-bar" style={{ borderColor: result ? theme.pointer : 'var(--border)' }}>
            {spinning ? (
              <div className="sw-result-spinning">
                <span className="sw-dots" />
              </div>
            ) : result ? (
              <div className="sw-result-content">
                <span className="sw-result-label">{ui.result}</span>
                <span className="sw-result-text" style={{ color: theme.pointer }}>{result}</span>
                <button className="sw-result-btn" onClick={spin}>{ui.spinAgain}</button>
              </div>
            ) : (
              <div className="sw-result-empty">{ui.clickToSpin}</div>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="sw-controls">
          {/* Theme selector */}
          <div className="sw-section">
            <div className="sw-section-title">{ui.theme}</div>
            <div className="sw-theme-grid">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  className={`sw-theme-btn${themeId === th.id ? ' sw-theme-active' : ''}`}
                  onClick={() => setThemeId(th.id)}
                  style={{ background: th.bg, borderColor: themeId === th.id ? th.pointer : 'var(--border)' }}
                >
                  <div className="sw-theme-preview">
                    {th.colors.slice(0, 4).map((c, i) => (
                      <span key={i} style={{ background: c }} />
                    ))}
                  </div>
                  <span style={{ color: th.bg === '#ffffff' ? '#333' : '#fff' }}>{lang === 'zh' ? th.name.zh : th.name.en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration slider */}
          <div className="sw-section">
            <div className="sw-section-title">{ui.spinDuration}: {(spinDuration / 1000).toFixed(1)}s</div>
            <input
              type="range"
              min="2000"
              max="8000"
              step="500"
              value={spinDuration}
              onChange={(e) => setSpinDuration(Number(e.target.value))}
              className="sw-slider"
            />
          </div>

          {/* Segments */}
          <div className="sw-section">
            <div className="sw-section-title">
              {ui.segments} ({segments.length})
              <button className="sw-edit-toggle" onClick={() => setEditMode(!editMode)}>
                {editMode ? ui.done : ui.edit}
              </button>
            </div>

            {editMode ? (
              <div className="sw-segment-list">
                {segments.map((seg, i) => (
                  <div key={seg.id} className="sw-segment-row">
                    <input
                      type="color"
                      value={seg.color || getSegmentColor(i)}
                      onChange={(e) => updateSegmentColor(seg.id, e.target.value)}
                      className="sw-color-pick"
                      title={ui.customColor}
                    />
                    <input
                      className="sw-segment-input"
                      value={seg.text}
                      onChange={(e) => updateSegment(seg.id, e.target.value)}
                      maxLength={20}
                    />
                    <button
                      className="sw-segment-del"
                      onClick={() => removeSegment(seg.id)}
                      disabled={segments.length <= 2}
                      title={ui.remove}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {segments.length < 12 && (
                  <button className="sw-add-btn" onClick={addSegment}>+ {ui.addSegment}</button>
                )}
              </div>
            ) : (
              <div className="sw-segment-preview">
                {segments.map((seg, i) => (
                  <span key={seg.id} className="sw-segment-tag" style={{ background: getSegmentColor(i), color: theme.text }}>
                    {seg.text}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
