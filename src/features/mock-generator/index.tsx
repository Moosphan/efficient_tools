import { useState, useCallback } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type TabMode = 'api' | 'data';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type OutputFormat = 'msw' | 'json-server' | 'fetch-mock' | 'preview';
type FieldType = 'string' | 'number' | 'boolean' | 'email' | 'name' | 'phone' | 'address' | 'url' | 'date' | 'id' | 'avatar' | 'color' | 'ip';

interface FieldDef { name: string; type: FieldType; }

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'string', label: 'String' }, { value: 'number', label: 'Number' }, { value: 'boolean', label: 'Boolean' },
  { value: 'email', label: 'Email' }, { value: 'name', label: 'Name' }, { value: 'phone', label: 'Phone' },
  { value: 'address', label: 'Address' }, { value: 'url', label: 'URL' }, { value: 'date', label: 'Date' },
  { value: 'id', label: 'ID' }, { value: 'avatar', label: 'Avatar' }, { value: 'color', label: 'Color' }, { value: 'ip', label: 'IP' },
];

const NAMES_ZH = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '孙九', '周十', '吴晨', '郑阳', '黄蕾', '林峰', '何雪', '马超', '罗静'];
const CITIES_ZH = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆'];
const DOMAINS = ['example.com', 'test.io', 'demo.org', 'sample.net', 'mock.dev'];
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

function genValue(type: FieldType, i: number): unknown {
  switch (type) {
    case 'string': return `Sample text ${i + 1}`;
    case 'number': return randInt(1, 1000);
    case 'boolean': return Math.random() > 0.5;
    case 'email': return `user${i + 1}@${pick(DOMAINS)}`;
    case 'name': return pick(NAMES_ZH);
    case 'phone': return `1${randInt(30, 99)}${String(randInt(10000000, 99999999))}`;
    case 'address': return pick(CITIES_ZH) + pick(['朝阳区', '海淀区', '浦东新区', '南山区', '西湖区']) + pick(['人民路', '中山路', '解放路']) + randInt(1, 200) + '号';
    case 'url': return `https://${pick(DOMAINS)}/page/${i + 1}`;
    case 'date': return new Date(Date.now() - randInt(0, 365 * 86400000)).toISOString().slice(0, 10);
    case 'id': return `id_${Date.now().toString(36)}_${randInt(1000, 9999)}`;
    case 'avatar': return `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`;
    case 'color': return pick(COLORS);
    case 'ip': return `${randInt(10, 223)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
    default: return null;
  }
}

const DATA_TEMPLATES: Record<string, { name: string; fields: FieldDef[] }> = {
  user: { name: 'User', fields: [{ name: 'id', type: 'id' }, { name: 'name', type: 'name' }, { name: 'email', type: 'email' }, { name: 'phone', type: 'phone' }, { name: 'avatar', type: 'avatar' }, { name: 'active', type: 'boolean' }] },
  product: { name: 'Product', fields: [{ name: 'id', type: 'id' }, { name: 'name', type: 'string' }, { name: 'price', type: 'number' }, { name: 'color', type: 'color' }, { name: 'inStock', type: 'boolean' }, { name: 'url', type: 'url' }] },
  order: { name: 'Order', fields: [{ name: 'orderId', type: 'id' }, { name: 'userName', type: 'name' }, { name: 'amount', type: 'number' }, { name: 'address', type: 'address' }, { name: 'createdAt', type: 'date' }] },
  post: { name: 'Post', fields: [{ name: 'id', type: 'id' }, { name: 'title', type: 'string' }, { name: 'author', type: 'name' }, { name: 'views', type: 'number' }, { name: 'published', type: 'boolean' }, { name: 'createdAt', type: 'date' }] },
};

interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  status: number;
  body: string; // JSON string
  delay: number; // ms
}

const SAMPLE_ENDPOINTS: ApiEndpoint[] = [
  { method: 'GET', path: '/api/users', status: 200, body: JSON.stringify([
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'admin' },
    { id: 2, name: '李四', email: 'lisi@example.com', role: 'user' },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: 'user' },
  ], null, 2), delay: 100 },
  { method: 'GET', path: '/api/users/:id', status: 200, body: JSON.stringify({ id: 1, name: '张三', email: 'zhangsan@example.com', role: 'admin', createdAt: '2024-01-15T08:30:00Z' }, null, 2), delay: 80 },
  { method: 'POST', path: '/api/users', status: 201, body: JSON.stringify({ id: 4, name: '新用户', email: 'new@example.com', role: 'user' }, null, 2), delay: 150 },
  { method: 'DELETE', path: '/api/users/:id', status: 204, body: '', delay: 50 },
];

function generateMswCode(endpoints: ApiEndpoint[]): string {
  const handlers = endpoints.map((ep) => {
    const method = ep.method.toLowerCase();
    const bodyStr = ep.body ? ep.body.trim() : 'null';
    const delay = ep.delay > 0 ? `\n    await delay(${ep.delay});` : '';
    return `  http.${method}('${ep.path}', async () => {${delay}
    return HttpResponse.json(${bodyStr}, { status: ${ep.status} });
  }),`;
  }).join('\n');

  return `import { http, HttpResponse, delay } from 'msw';
import { setupWorker } from 'msw/browser';

const handlers = [
${handlers}
];

export const worker = setupWorker(...handlers);

// 在应用入口使用:
// if (process.env.NODE_ENV === 'development') {
//   worker.start({ onUnhandledRequest: 'bypass' });
// }`;
}

function generateJsonServerCode(endpoints: ApiEndpoint[]): string {
  const resources: Record<string, unknown[]> = {};
  for (const ep of endpoints) {
    if (ep.method !== 'GET' || !ep.body) continue;
    try {
      const parsed = JSON.parse(ep.body);
      const resource = ep.path.replace(/^\/api\//, '').replace(/\/:.+$/, '').replace(/\//g, '_');
      if (Array.isArray(parsed)) resources[resource] = parsed;
    } catch { /* skip */ }
  }
  return `// db.json
${JSON.stringify(resources, null, 2)}

// 启动: npx json-server --watch db.json --port 3001
// 然后前端请求 http://localhost:3001/users`;
}

function generateFetchMockCode(endpoints: ApiEndpoint[]): string {
  const mocks = endpoints.map((ep) => {
    const bodyStr = ep.body ? ep.body.trim() : 'null';
    const delay = ep.delay > 0 ? `await new Promise(r => setTimeout(r, ${ep.delay}));\n    ` : '';
    return `// ${ep.method} ${ep.path}
fetchMock.${ep.method.toLowerCase()}('${ep.path}', () => {
    ${delay}return { status: ${ep.status}, body: ${bodyStr} };
  });`;
  }).join('\n\n');

  return `// 使用 fetch-mock (npm install fetch-mock)
import fetchMock from 'fetch-mock';

${mocks}

// 测试完成后恢复:
// fetchMock.restore();`;
}

function previewEndpoint(ep: ApiEndpoint): string {
  const lines = [
    `${ep.method} ${ep.path}`,
    `Status: ${ep.status}`,
    ep.delay > 0 ? `Delay: ${ep.delay}ms` : null,
    '',
    ep.body ? ep.body : '(empty body)',
  ].filter(Boolean);
  return lines.join('\n');
}

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];
const METHOD_COLORS: Record<string, string> = { GET: 'var(--green)', POST: 'var(--amber)', PUT: 'var(--accent)', DELETE: 'var(--red)' };

export default function MockGenerator() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('mockGen');
  const [tab, setTab] = useState<TabMode>('api');

  // ── API Mock state ──
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(SAMPLE_ENDPOINTS);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('msw');
  const [output, setOutput] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);

  // ── Test Data state ──
  const [fields, setFields] = useState<FieldDef[]>(DATA_TEMPLATES.user.fields);
  const [dataCount, setDataCount] = useState(5);
  const [dataOutput, setDataOutput] = useState('');

  // ── Data generation functions ──
  const addField = () => setFields([...fields, { name: `field${fields.length + 1}`, type: 'string' }]);
  const removeField = (i: number) => setFields(fields.filter((_, idx) => idx !== i));
  const updateField = (i: number, key: keyof FieldDef, value: string) => { const next = [...fields]; next[i] = { ...next[i], [key]: value }; setFields(next); };
  const loadTemplate = (key: string) => { setFields(DATA_TEMPLATES[key].fields); setDataOutput(''); };

  const generateData = () => {
    const data = Array.from({ length: Math.min(dataCount, 50) }, (_, i) => {
      const obj: Record<string, unknown> = {};
      for (const f of fields) obj[f.name] = genValue(f.type, i);
      return obj;
    });
    setDataOutput(JSON.stringify(data, null, 2));
  };

  const injectToEndpoint = useCallback(() => {
    if (!dataOutput) return;
    // Add the generated data as a new GET endpoint
    const name = fields[0]?.name === 'id' ? 'items' : 'data';
    setEndpoints([...endpoints, { method: 'GET', path: `/api/${name}`, status: 200, body: dataOutput, delay: 100 }]);
    setTab('api');
  }, [dataOutput, fields, endpoints]);

  const addEndpoint = () => {
    setEndpoints([...endpoints, { method: 'GET', path: '/api/new', status: 200, body: '{}', delay: 0 }]);
    setSelectedIdx(endpoints.length);
  };

  const removeEndpoint = (i: number) => {
    setEndpoints(endpoints.filter((_, idx) => idx !== i));
    if (selectedIdx === i) setSelectedIdx(null);
    else if (selectedIdx !== null && selectedIdx > i) setSelectedIdx(selectedIdx - 1);
  };

  const updateEndpoint = (i: number, key: keyof ApiEndpoint, value: unknown) => {
    const next = [...endpoints];
    next[i] = { ...next[i], [key]: value };
    setEndpoints(next);
  };

  const generate = () => {
    switch (outputFormat) {
      case 'msw': setOutput(generateMswCode(endpoints)); break;
      case 'json-server': setOutput(generateJsonServerCode(endpoints)); break;
      case 'fetch-mock': setOutput(generateFetchMockCode(endpoints)); break;
      case 'preview': setOutput(endpoints.map(previewEndpoint).join('\n\n---\n\n')); break;
    }
  };

  const copy = () => { if (output) navigator.clipboard.writeText(output); };
  const selected = selectedIdx !== null ? endpoints[selectedIdx] : null;

  return (
    <ToolShell title={name} description={desc}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--surface)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        <button className={`panel-btn${tab === 'api' ? ' accent' : ''}`} onClick={() => setTab('api')}>{ui.apiMock}</button>
        <button className={`panel-btn${tab === 'data' ? ' accent' : ''}`} onClick={() => setTab('data')}>{ui.testData}</button>
      </div>

      {tab === 'data' ? (
        <div className="tool-layout">
          <div className="tool-panel">
            <div className="panel-header">
              {ui.fields}
              <div className="panel-actions">
                {Object.entries(DATA_TEMPLATES).map(([key, tmpl]) => (
                  <button key={key} className="panel-btn panel-btn-sm" onClick={() => loadTemplate(key)}>{tmpl.name}</button>
                ))}
                <button className="panel-btn panel-btn-sm" onClick={addField}>+ {ui.addField}</button>
              </div>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {fields.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="text" value={f.name} onChange={(e) => updateField(i, 'name', e.target.value)} style={{ flex: 1, padding: '4px 8px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)' }} />
                  <select value={f.type} onChange={(e) => updateField(i, 'type', e.target.value)} style={{ padding: '4px 6px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12 }}>
                    {FIELD_TYPES.map((ft) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                  </select>
                  <button className="panel-btn panel-btn-sm" onClick={() => removeField(i)} style={{ color: 'var(--red)', padding: '2px 6px' }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ui.dataCount}</span>
              <input type="range" min={1} max={50} value={dataCount} onChange={(e) => setDataCount(parseInt(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', minWidth: 24 }}>{dataCount}</span>
              <button className="panel-btn accent" onClick={generateData}>{ui.generateData}</button>
            </div>
          </div>
          <div className="tool-panel">
            <div className="panel-header">
              {t('common.output')}
              {dataOutput && (
                <div className="panel-actions">
                  <button className="panel-btn" onClick={() => navigator.clipboard.writeText(dataOutput)}>{t('common.copy')}</button>
                  <button className="panel-btn" onClick={injectToEndpoint}>{ui.injectToApi}</button>
                </div>
              )}
            </div>
            <pre style={{ flex: 1, padding: 16, margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, color: dataOutput ? 'var(--fg)' : 'var(--muted)', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {dataOutput || t('common.waiting')}
            </pre>
          </div>
        </div>
      ) : (
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {ui.endpoints}
            <div className="panel-actions">
              <button className="panel-btn panel-btn-sm" onClick={addEndpoint}>+ {ui.addEndpoint}</button>
            </div>
          </div>
          <div style={{ padding: '0 16px', maxHeight: 300, overflow: 'auto' }}>
            {endpoints.map((ep, i) => (
              <div
                key={i}
                onClick={() => setSelectedIdx(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 4, cursor: 'pointer', background: selectedIdx === i ? 'var(--accent-bg, rgba(99,102,241,0.1))' : 'transparent', borderBottom: '1px solid var(--border)' }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: METHOD_COLORS[ep.method], minWidth: 40 }}>{ep.method}</span>
                <span style={{ flex: 1, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.path}</span>
                <span style={{ fontSize: 10, color: ep.status < 300 ? 'var(--green)' : ep.status < 500 ? 'var(--amber)' : 'var(--red)' }}>{ep.status}</span>
                <button className="panel-btn panel-btn-sm" onClick={(e) => { e.stopPropagation(); removeEndpoint(i); }} style={{ color: 'var(--red)', padding: '1px 4px', fontSize: 10 }}>✕</button>
              </div>
            ))}
          </div>

          {selected && selectedIdx !== null && (
            <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <select value={selected.method} onChange={(e) => updateEndpoint(selectedIdx, 'method', e.target.value)} style={{ padding: '4px 6px', background: 'var(--surface)', color: METHOD_COLORS[selected.method], border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="text" value={selected.path} onChange={(e) => updateEndpoint(selectedIdx, 'path', e.target.value)} placeholder="/api/resource" style={{ flex: 1, padding: '4px 8px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)' }} />
                <input type="number" value={selected.status} onChange={(e) => updateEndpoint(selectedIdx, 'status', parseInt(e.target.value) || 200)} style={{ width: 56, padding: '4px 6px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)', textAlign: 'center' }} />
                <input type="number" value={selected.delay} onChange={(e) => updateEndpoint(selectedIdx, 'delay', parseInt(e.target.value) || 0)} placeholder="ms" title="Delay (ms)" style={{ width: 56, padding: '4px 6px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono)', textAlign: 'center' }} />
              </div>
              <textarea
                value={selected.body}
                onChange={(e) => updateEndpoint(selectedIdx, 'body', e.target.value)}
                placeholder="Response JSON body…"
                style={{ width: '100%', minHeight: 120, padding: 8, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          )}
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            <div className="panel-actions">
              {([['msw', 'MSW'], ['json-server', 'json-server'], ['fetch-mock', 'fetch-mock'], ['preview', ui.preview]] as const).map(([k, l]) => (
                <button key={k} className={`panel-btn panel-btn-sm${outputFormat === k ? ' accent' : ''}`} onClick={() => setOutputFormat(k as OutputFormat)}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: '8px 16px', display: 'flex', gap: 8 }}>
            <button className="panel-btn accent" onClick={generate} style={{ flex: 1 }}>{ui.generateCode}</button>
            <button className="panel-btn" onClick={copy}>{t('common.copy')}</button>
          </div>
          <pre style={{ flex: 1, padding: 16, margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, color: output ? 'var(--fg)' : 'var(--muted)', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {output || t('common.waiting')}
          </pre>
        </div>
      </div>
      )}
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
