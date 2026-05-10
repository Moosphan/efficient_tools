import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');

const ZH_WORDS = '的是在不了有和人这中大为上个国我以要他时来用们生到作地于出会同年可就对开最如新发将近前体从定理心都然本去能把好公日月明子那得还事没与资讯后我们工作可以使用这个工具来生成中文占位文本方便在设计阶段快速填充内容'.split(' ');

function generateLorem(count: number, type: 'paragraphs' | 'sentences' | 'words', lang: 'latin' | 'chinese'): string {
  const words = lang === 'latin' ? LOREM_WORDS : ZH_WORDS;
  const rand = () => words[Math.floor(Math.random() * words.length)];
  const sentence = () => {
    const len = 8 + Math.floor(Math.random() * 12);
    const s = Array.from({ length: len }, rand).join(lang === 'latin' ? ' ' : '');
    return lang === 'latin' ? s.charAt(0).toUpperCase() + s.slice(1) + '.' : s + '。';
  };
  const paragraph = () => Array.from({ length: 3 + Math.floor(Math.random() * 4) }, sentence).join(lang === 'latin' ? ' ' : '');

  if (type === 'words') return Array.from({ length: count }, rand).join(lang === 'latin' ? ' ' : '');
  if (type === 'sentences') return Array.from({ length: count }, sentence).join(lang === 'latin' ? ' ' : '');
  return Array.from({ length: count }, paragraph).join('\n\n');
}

export default function LoremGenerator() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('lorem');
  const [count, setCount] = useState(3);
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [lang, setLang] = useState<'latin' | 'chinese'>('latin');
  const [output, setOutput] = useState('');

  const generate = () => setOutput(generateLorem(count, type, lang));
  const copy = () => { if (output) navigator.clipboard.writeText(output); };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.settings')}</div>
          <div className="uuid-config">
            <div className="uuid-config-row">
              <label>{ui.language}</label>
              <div className="panel-actions">
                <button className={`panel-btn panel-btn-sm${lang === 'latin' ? ' accent' : ''}`} onClick={() => setLang('latin')}>Lorem Ipsum</button>
                <button className={`panel-btn panel-btn-sm${lang === 'chinese' ? ' accent' : ''}`} onClick={() => setLang('chinese')}>{ui.chinese}</button>
              </div>
            </div>
            <div className="uuid-config-row">
              <label>{ui.type}</label>
              <div className="panel-actions">
                {(['paragraphs', 'sentences', 'words'] as const).map((t) => (
                  <button key={t} className={`panel-btn panel-btn-sm${type === t ? ' accent' : ''}`} onClick={() => setType(t)}>{ui[t]}</button>
                ))}
              </div>
            </div>
            <div className="uuid-config-row">
              <label>{ui.count}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <input type="range" min={1} max={20} value={count} onChange={(e) => setCount(parseInt(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', minWidth: 24, textAlign: 'right' }}>{count}</span>
              </div>
            </div>
            <button className="panel-btn accent" onClick={generate} style={{ marginTop: 8, width: '100%' }}>{ui.generate}</button>
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            {output && (
              <div className="panel-actions">
                <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
              </div>
            )}
          </div>
          <div style={{ padding: 16, fontSize: 13, lineHeight: 1.8, color: output ? 'var(--fg)' : 'var(--muted)', whiteSpace: 'pre-wrap', fontFamily: lang === 'latin' ? 'var(--font-body)' : 'inherit' }}>
            {output || t('common.waiting')}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
