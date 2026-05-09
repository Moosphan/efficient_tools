import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';

export default function UrlCodec() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [component, setComponent] = useState(false);
  const [params, setParams] = useState<{ key: string; value: string }[]>([]);

  useCleanup(() => { setInput(''); setOutput(''); setParams([]); });

  const process = () => {
    const raw = input;
    if (!raw) { setOutput(''); setError(''); setParams([]); return; }
    try {
      if (mode === 'encode') {
        setOutput(component ? encodeURIComponent(raw) : encodeURI(raw));
      } else {
        const decoded = component ? decodeURIComponent(raw) : decodeURI(raw);
        setOutput(decoded);
        tryParseParams(decoded);
      }
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '处理失败');
      setOutput('');
    }
  };

  const tryParseParams = (str: string) => {
    try {
      const url = new URL(str);
      const p: { key: string; value: string }[] = [];
      url.searchParams.forEach((value, key) => p.push({ key, value }));
      if (p.length > 0) { setParams(p); return; }
    } catch { /* not a full URL */ }
    if (str.includes('=')) {
      const p: { key: string; value: string }[] = [];
      const sp = new URLSearchParams(str.startsWith('?') ? str : `?${str}`);
      sp.forEach((value, key) => p.push({ key, value }));
      setParams(p);
    } else {
      setParams([]);
    }
  };

  const swap = () => {
    setInput(output);
    setOutput('');
    setParams([]);
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  const copy = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  return (
    <ToolShell title="URL 编解码" description="URL 编码/解码，自动解析查询参数">
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {mode === 'encode' ? '原始文本' : '编码文本'}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => { setInput(''); setOutput(''); setError(''); setParams([]); }}>清空</button>
            </div>
          </div>
          <textarea
            className="tool-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入 URL 或文本…\nhttps://example.com/path?name=你好&lang=zh' : '输入编码后的 URL…'}
          />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {mode === 'encode' ? '编码结果' : '解码结果'}
            <div className="panel-actions">
              <button className={`panel-btn${component ? ' accent' : ''}`} onClick={() => setComponent(!component)}>Component</button>
              <button className="panel-btn accent" onClick={process}>{mode === 'encode' ? '编码' : '解码'}</button>
              <button className="panel-btn" onClick={swap}>⇄ 交换</button>
              <button className="panel-btn" onClick={copy}>复制</button>
            </div>
          </div>
          <div className="output-area">{output || '等待处理…'}</div>
          {error && <div className="error-msg">错误: {error}</div>}
          {params.length > 0 && (
            <>
              <div className="panel-header">查询参数</div>
              <div className="url-params">
                {params.map((p, i) => (
                  <div key={i} className="url-param-row">
                    <span className="url-param-key">{p.key}</span>
                    <span className="url-param-sep">=</span>
                    <span className="url-param-value">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
