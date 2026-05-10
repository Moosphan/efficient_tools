import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type CipherType = 'rot13' | 'caesar' | 'reverse' | 'braille' | 'upsidedown' | 'morse' | 'emoji' | 'binary' | 'hex';

const BRAILLE_MAP: Record<string, string> = { a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑', f: '⠋', g: '⠛', h: '⠓', i: '⠊', j: '⠚', k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕', p: '⠏', q: '⠟', r: '⠗', s: '⠎', t: '⠞', u: '⠥', v: '⠧', w: '⠺', x: '⠭', y: '⠽', z: '⠵', ' ': ' ', '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑', '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚' };
const BRAILLE_REVERSE: Record<string, string> = Object.fromEntries(Object.entries(BRAILLE_MAP).map(([k, v]) => [v, k]));
const MORSE_MAP: Record<string, string> = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', ' ': ' ' };
const MORSE_REVERSE: Record<string, string> = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));
const UPSIDEDOWN_MAP: Record<string, string> = { a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'Ɫ', '8': '8', '9': '6', '0': '0', '.': '˙', ',:': '\'', '!': '¡', '?': '¿', '(': ')', ')': '(', '[': ']', ']': '[' };
const EMOJI_MAP = ['😀', '😂', '🥰', '😎', '🤔', '😢', '😡', '🤗', '😏', '🥺', '👍', '👏', '🤝', '✌️', '🤞', '👋', '💪', '🙏', '👀', '❤️', '🔥', '⭐', '✅', '❌', '💡', '🎯', '🚀', '🎉', '💻', '📱', '🐛', '🔧', '📦', '🎨', '📝', '🔒', '🔑', '🎵', '🎬', '📊', '🌈', '☀️', '🌙', '⚡', '🌊', '🍕', '☕', '🎁', '🏆', '💎'];
const EMOJI_SEP = '⬜'; // separator between emoji-encoded chars


function rot13(text: string): string {
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function caesar(text: string, shift: number): string {
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

function toBraille(text: string): string {
  return text.toLowerCase().split('').map((c) => BRAILLE_MAP[c] ?? c).join('');
}

function fromBraille(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    // Try 2-char braille (number prefix)
    if (i + 1 < text.length) {
      const two = text.slice(i, i + 2);
      if (BRAILLE_REVERSE[two]) { result += BRAILLE_REVERSE[two]; i += 2; continue; }
    }
    const one = text[i];
    result += BRAILLE_REVERSE[one] ?? one;
    i++;
  }
  return result;
}

function toMorse(text: string): string {
  const unsupported: string[] = [];
  const result = text.toLowerCase().split('').map((c) => {
    if (c === ' ') return '/';
    const morse = MORSE_MAP[c];
    if (!morse && !unsupported.includes(c)) unsupported.push(c);
    return morse ?? '?';
  }).join(' ');
  if (unsupported.length > 0) throw new Error(`不支持的字符: ${unsupported.join(' ')}`);
  return result;
}

function fromMorse(text: string): string {
  return text.split(' ').map((c) => MORSE_REVERSE[c] ?? c).join('');
}

function toUpsideDown(text: string): string {
  return text.toLowerCase().split('').reverse().map((c) => UPSIDEDOWN_MAP[c] ?? c).join('');
}

function fromUpsideDown(text: string): string {
  const reverseMap = Object.fromEntries(Object.entries(UPSIDEDOWN_MAP).map(([k, v]) => [v, k]));
  return text.split('').map((c) => reverseMap[c] ?? c).reverse().join('');
}

function toEmoji(text: string): string {
  // Each char → emoji index, separated by ⬜ for unambiguous decoding
  return Array.from(text).map((c) => {
    const code = c.codePointAt(0)!;
    if (code < EMOJI_MAP.length) return EMOJI_MAP[code];
    // For chars outside emoji range, use hex code with 🔢 prefix
    return '🔢' + code.toString(16) + '🔢';
  }).join(EMOJI_SEP);
}

function fromEmoji(text: string): string {
  // Build reverse map using Array.from for proper codepoint handling
  const reverseMap = new Map<string, number>();
  EMOJI_MAP.forEach((emoji, i) => reverseMap.set(emoji, i));

  const tokens = text.split(EMOJI_SEP);
  return tokens.map((token) => {
    if (!token) return '';
    // Check for hex-encoded chars: 🔢hex🔢
    if (token.startsWith('🔢')) {
      const hex = token.replace(/🔢/g, '');
      const code = parseInt(hex, 16);
      return isNaN(code) ? token : String.fromCodePoint(code);
    }
    // Look up in emoji map
    const idx = reverseMap.get(token);
    if (idx !== undefined) return String.fromCodePoint(idx);
    return token;
  }).join('');
}

function toBinary(text: string): string {
  return Array.from(text).map((c) => c.codePointAt(0)!.toString(2).padStart(8, '0')).join(' ');
}

function fromBinary(text: string): string {
  return text.trim().split(/\s+/).map((b) => String.fromCharCode(parseInt(b, 2))).join('');
}

function toHex(text: string): string {
  return Array.from(text).map((c) => c.codePointAt(0)!.toString(16).padStart(2, '0')).join(' ');
}

function fromHex(text: string): string {
  return text.trim().split(/\s+/).map((h) => String.fromCharCode(parseInt(h, 16))).join('');
}

export default function TextCipher() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('textCipher');
  const [input, setInput] = useState('');
  const [cipher, setCipher] = useState<CipherType>('rot13');
  const [caesarShift, setCaesarShift] = useState(3);
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const process = (): string => {
    if (!input) return '';
    try {
      if (cipher === 'rot13') return mode === 'encode' ? rot13(input) : rot13(input);
      if (cipher === 'caesar') return mode === 'encode' ? caesar(input, caesarShift) : caesar(input, -caesarShift);
      if (cipher === 'reverse') return mode === 'encode' ? input.split('').reverse().join('') : input.split('').reverse().join('');
      if (cipher === 'braille') return mode === 'encode' ? toBraille(input) : fromBraille(input);
      if (cipher === 'upsidedown') return mode === 'encode' ? toUpsideDown(input) : fromUpsideDown(input);
      if (cipher === 'morse') return mode === 'encode' ? toMorse(input) : fromMorse(input);
      if (cipher === 'emoji') return mode === 'encode' ? toEmoji(input) : fromEmoji(input);
      if (cipher === 'binary') return mode === 'encode' ? toBinary(input) : fromBinary(input);
      if (cipher === 'hex') return mode === 'encode' ? toHex(input) : fromHex(input);
      return input;
    } catch { return ui.decodeError; }
  };

  const output = process();
  const copy = () => { if (output) navigator.clipboard.writeText(output); };

  const CIPHERS: { value: CipherType; label: string; tag: string }[] = [
    { value: 'rot13', label: 'ROT13', tag: ui.classic },
    { value: 'caesar', label: ui.caesar, tag: ui.classic },
    { value: 'reverse', label: ui.reverse, tag: ui.fun },
    { value: 'binary', label: 'Binary', tag: ui.encoding },
    { value: 'hex', label: 'Hex', tag: ui.encoding },
    { value: 'morse', label: ui.morse, tag: ui.classic },
    { value: 'braille', label: ui.braille, tag: ui.social },
    { value: 'upsidedown', label: ui.upsidedown, tag: ui.social },
    { value: 'emoji', label: ui.emoji, tag: ui.social },
  ];

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {ui.cipherType}
            <div className="panel-actions">
              <button className={`panel-btn panel-btn-sm${mode === 'encode' ? ' accent' : ''}`} onClick={() => setMode('encode')}>{ui.encode}</button>
              <button className={`panel-btn panel-btn-sm${mode === 'decode' ? ' accent' : ''}`} onClick={() => setMode('decode')}>{ui.decode}</button>
            </div>
          </div>
          <div style={{ padding: '10px 16px 8px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {CIPHERS.map((c) => (
              <button key={c.value} className={`panel-btn panel-btn-sm${cipher === c.value ? ' accent' : ''}`} onClick={() => setCipher(c.value)}>
                {c.label} <span style={{ fontSize: 9, opacity: 0.6 }}>{c.tag}</span>
              </button>
            ))}
          </div>
          {cipher === 'caesar' && (
            <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ui.shift}</span>
              <input type="range" min={1} max={25} value={caesarShift} onChange={(e) => setCaesarShift(parseInt(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', minWidth: 16 }}>{caesarShift}</span>
            </div>
          )}
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.inputPlaceholder} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => { setInput(output); }}>{ui.swap}</button>
              <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
            </div>
          </div>
          <div className="output-area" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{output || t('common.waiting')}</div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
