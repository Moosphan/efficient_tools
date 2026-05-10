import { useState } from 'react';
import { parse, stringify } from 'smol-toml';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

const SAMPLE = `# 项目配置
name = "Efficient Tools"
version = "1.0.0"
description = "开发者效率工具集"

[server]
host = "0.0.0.0"
port = 3000
cors = true

[database]
type = "postgres"
host = "localhost"
port = 5432
name = "efficient_tools"

[features]
items = ["JSON", "YAML", "TOML", "SQL"]`;

export default function TomlFormatter() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('toml');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  useCleanup(() => { setInput(''); setOutput(''); });

  const format = () => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    try {
      const parsed = parse(input);
      setOutput(stringify(parsed));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'TOML parse error');
      setOutput('');
    }
  };

  const toJson = () => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    try {
      const parsed = parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'TOML parse error');
      setOutput('');
    }
  };

  const validate = () => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    try {
      parse(input);
      setOutput(ui.valid);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'TOML parse error');
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
              <button className="panel-btn" onClick={() => setInput(SAMPLE)}>{t('common.example')}</button>
              <button className="panel-btn" onClick={() => { setInput(''); setOutput(''); setError(''); }}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={ui.placeholder} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              <button className="panel-btn accent" onClick={format}>{ui.format}</button>
              <button className="panel-btn" onClick={toJson}>{ui.toJson}</button>
              <button className="panel-btn" onClick={validate}>{ui.validate}</button>
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
