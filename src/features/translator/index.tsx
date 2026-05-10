import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

export default function Translator() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('translate');
  const [input, setInput] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');

  useCleanup(() => { setInput(''); });

  const openTranslate = () => {
    const text = input.trim();
    if (!text) return;
    const sl = sourceLang === 'auto' ? '' : sourceLang;
    window.open(`https://translate.google.com/?sl=${sl}&tl=${targetLang}&text=${encodeURIComponent(text)}&op=translate`, '_blank');
  };

  const copy = () => { if (input) navigator.clipboard.writeText(input); };

  const langOptions = [
    { value: 'auto', label: ui.autoDetect },
    { value: 'zh-CN', label: '中文' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'es', label: 'Español' },
    { value: 'ru', label: 'Русский' },
  ];

  const quickPhrases = [
    { label: 'undefined is not a function', text: 'undefined is not a function' },
    { label: 'Cannot read property of null', text: "Cannot read property 'x' of null" },
    { label: 'ECONNREFUSED', text: 'connect ECONNREFUSED 127.0.0.1:3306' },
    { label: 'ENOMEM', text: 'ENOMEM: not enough memory' },
    { label: 'Permission denied', text: 'Permission denied (publickey)' },
    { label: 'Module not found', text: "Cannot find module 'express'" },
  ];

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setInput('')}>{t('common.clear')}</button>
              <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">{ui.langSettings}</div>
          <div className="translate-lang-row">
            <div className="translate-lang-field">
              <label>{ui.source}</label>
              <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                {langOptions.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <span className="translate-arrow">→</span>
            <div className="translate-lang-field">
              <label>{ui.target}</label>
              <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                {langOptions.filter((l) => l.value !== 'auto').map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>
          <button className="panel-btn accent" onClick={openTranslate} style={{ margin: '12px 16px', width: 'calc(100% - 32px)' }}>{ui.translateBtn}</button>
          <div className="panel-header">{ui.quickPhrases}</div>
          <div className="translate-shortcuts">
            {quickPhrases.map((p) => (
              <button key={p.label} className="translate-shortcut" onClick={() => setInput(p.text)}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
