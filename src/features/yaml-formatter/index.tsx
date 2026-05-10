import { useState, useRef, useCallback } from 'react';
import yaml from 'js-yaml';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

const SAMPLE_ZH = `# 项目配置
name: Efficient Tools
version: "1.0.0"
description: 开发者效率工具集

server:
  host: 0.0.0.0
  port: 3000
  cors: true

database:
  type: postgres
  host: localhost
  port: 5432
  name: efficient_tools

features:
  - JSON 格式化
  - YAML 格式化
  - 正则测试
  - 时间戳转换`;

const SAMPLE_EN = `# Project Config
name: Efficient Tools
version: "1.0.0"
description: Developer efficiency toolkit

server:
  host: 0.0.0.0
  port: 3000
  cors: true

database:
  type: postgres
  host: localhost
  port: 5432
  name: efficient_tools

features:
  - JSON Formatter
  - YAML Formatter
  - Regex Tester
  - Timestamp Converter`;

export default function YamlFormatter() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('yaml');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useCleanup(() => { setInput(''); setOutput(''); });

  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResize(e.target);
  }, [autoResize]);

  const setExample = useCallback(() => {
    const sample = lang === 'zh' ? SAMPLE_ZH : SAMPLE_EN;
    setInput(sample);
    requestAnimationFrame(() => {
      if (textareaRef.current) autoResize(textareaRef.current);
    });
  }, [lang, autoResize]);

  const format = () => {
    const raw = input.trim();
    if (!raw) { setOutput(''); setError(''); return; }
    try {
      const parsed = yaml.load(raw);
      setOutput(yaml.dump(parsed, { indent: 2, lineWidth: 120, noRefs: true }));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'YAML parse error');
      setOutput('');
    }
  };

  const minify = () => {
    const raw = input.trim();
    if (!raw) { setOutput(''); setError(''); return; }
    try {
      const parsed = yaml.load(raw);
      setOutput(yaml.dump(parsed, { indent: 0, lineWidth: -1, noRefs: true, flowLevel: 1 }));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'YAML parse error');
      setOutput('');
    }
  };

  const toJson = () => {
    const raw = input.trim();
    if (!raw) { setOutput(''); setError(''); return; }
    try {
      const parsed = yaml.load(raw);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'YAML parse error');
      setOutput('');
    }
  };

  const copy = () => { if (output) navigator.clipboard.writeText(output); };

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.input')}
            <div className="panel-actions">
              <button className="panel-btn" onClick={setExample}>{t('common.example')}</button>
              <button className="panel-btn" onClick={() => { setInput(''); setOutput(''); setError(''); }}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea ref={textareaRef} className="tool-textarea" style={{ height: 'auto', overflow: 'hidden' }} value={input} onInput={handleInput} placeholder={ui.placeholder} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              <button className="panel-btn accent" onClick={format}>{ui.format}</button>
              <button className="panel-btn" onClick={minify}>{ui.minify}</button>
              <button className="panel-btn" onClick={toJson}>{ui.toJson}</button>
              <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
            </div>
          </div>
          <div className="output-area">{output || t('common.waiting')}</div>
          {error && <div className="error-msg">{ui.errorPrefix}: {error}</div>}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
