import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';

const SAMPLE = JSON.stringify(
  { name: "Efficient Tools", version: "1.0.0", tools: [{ id: "json", status: "可用" }, { id: "regex", status: "可用" }], config: { theme: "flow", lang: "zh-CN" } },
  null,
  2
);

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const format = () => {
    const raw = input.trim();
    if (!raw) { setOutput(''); setError(''); return; }
    try {
      setOutput(JSON.stringify(JSON.parse(raw), null, 2));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const minify = () => {
    const raw = input.trim();
    if (!raw) { setOutput(''); setError(''); return; }
    try {
      setOutput(JSON.stringify(JSON.parse(raw)));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const copy = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  return (
    <ToolShell title="JSON 格式化" description="格式化、压缩、验证 JSON 数据">
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            输入
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => setInput(SAMPLE)}>示例</button>
              <button className="panel-btn" onClick={() => { setInput(''); setOutput(''); setError(''); }}>清空</button>
            </div>
          </div>
          <textarea
            className="tool-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='粘贴 JSON...\n{"key":"value"}'
          />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            输出
            <div className="panel-actions">
              <button className="panel-btn accent" onClick={format}>格式化</button>
              <button className="panel-btn" onClick={minify}>压缩</button>
              <button className="panel-btn" onClick={copy}>复制</button>
            </div>
          </div>
          <div className="output-area">{output || '等待输入…'}</div>
          {error && <div className="error-msg">JSON 解析错误: {error}</div>}
        </div>
      </div>
    </ToolShell>
  );
}
