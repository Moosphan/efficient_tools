import { useState } from 'react';
import Ajv from 'ajv';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

const ajv = new Ajv({ allErrors: true, verbose: true });

const SAMPLE_SCHEMA = JSON.stringify({
  type: 'object',
  required: ['name', 'age', 'email'],
  properties: {
    name: { type: 'string', minLength: 1 },
    age: { type: 'integer', minimum: 0, maximum: 150 },
    email: { type: 'string', format: 'email' },
    tags: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
}, null, 2);

const SAMPLE_DATA = JSON.stringify({
  name: '张三',
  age: 28,
  email: 'zhangsan@example.com',
  tags: ['developer', 'frontend'],
}, null, 2);

export default function JsonSchemaValidator() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('jsonSchema');
  const [schemaStr, setSchemaStr] = useState('');
  const [dataStr, setDataStr] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [valid, setValid] = useState<boolean | null>(null);

  useCleanup(() => { setSchemaStr(''); setDataStr(''); setErrors([]); setValid(null); });

  const validate = () => {
    if (!schemaStr.trim() || !dataStr.trim()) { setValid(null); setErrors([]); return; }
    try {
      const schema = JSON.parse(schemaStr);
      const data = JSON.parse(dataStr);
      const validateFn = ajv.compile(schema);
      const isValid = validateFn(data);
      setValid(isValid);
      if (!isValid && validateFn.errors) {
        setErrors(validateFn.errors.map((e) => `${e.instancePath || '/'} ${e.message ?? ''}`));
      } else {
        setErrors([]);
      }
    } catch (e) {
      setValid(false);
      setErrors([e instanceof Error ? e.message : 'Parse error']);
    }
  };

  const loadSample = () => {
    setSchemaStr(SAMPLE_SCHEMA);
    setDataStr(SAMPLE_DATA);
    setValid(null);
    setErrors([]);
  };

  return (
    <ToolShell title={name} description={desc}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="tool-panel">
          <div className="panel-header">
            {ui.schema}
            <div className="panel-actions">
              <button className="panel-btn" onClick={loadSample}>{t('common.example')}</button>
              <button className="panel-btn" onClick={() => { setSchemaStr(''); setDataStr(''); setValid(null); setErrors([]); }}>{t('common.clear')}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={schemaStr} onChange={(e) => setSchemaStr(e.target.value)} placeholder={ui.schemaPlaceholder} />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {ui.data}
            <div className="panel-actions">
              <button className="panel-btn accent" onClick={validate}>{ui.validate}</button>
            </div>
          </div>
          <textarea className="tool-textarea" value={dataStr} onChange={(e) => setDataStr(e.target.value)} placeholder={ui.dataPlaceholder} />
        </div>
      </div>
      {valid !== null && (
        <div className="tool-panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            {ui.result}
            <span style={{ fontSize: 13, fontWeight: 600, color: valid ? 'var(--green)' : 'var(--red)' }}>{valid ? ui.valid : ui.invalid}</span>
          </div>
          {!valid && errors.length > 0 && (
            <div style={{ padding: 12 }}>
              {errors.map((err, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--red)', padding: '4px 0', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--muted)', marginRight: 8 }}>#{i + 1}</span>{err}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
