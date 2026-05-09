import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';

export default function Base64Codec() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [urlSafe, setUrlSafe] = useState(false);

  const process = () => {
    const raw = input;
    if (!raw) { setOutput(''); setError(''); return; }
    try {
      if (mode === 'encode') {
        let encoded = btoa(unescape(encodeURIComponent(raw)));
        if (urlSafe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        setOutput(encoded);
      } else {
        let str = raw;
        if (urlSafe) str = str.replace(/-/g, '+').replace(/_/g, '/');
        const pad = str.length % 4;
        if (pad) str += '='.repeat(4 - pad);
        setOutput(decodeURIComponent(escape(atob(str))));
      }
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '处理失败');
      setOutput('');
    }
  };

  const swap = () => {
    setInput(output);
    setOutput('');
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  const copy = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  return (
    <ToolShell title="Base64 编解码" description="文本的 Base64 编解码，支持 URL-safe 格式">
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {mode === 'encode' ? '原始文本' : 'Base64 文本'}
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => { setInput(''); setOutput(''); setError(''); }}>清空</button>
            </div>
          </div>
          <textarea
            className="tool-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本…' : '输入 Base64 文本…'}
          />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {mode === 'encode' ? 'Base64 结果' : '解码结果'}
            <div className="panel-actions">
              <button className={`panel-btn${urlSafe ? ' accent' : ''}`} onClick={() => setUrlSafe(!urlSafe)}>URL-safe</button>
              <button className="panel-btn accent" onClick={process}>{mode === 'encode' ? '编码' : '解码'}</button>
              <button className="panel-btn" onClick={swap}>⇄ 交换</button>
              <button className="panel-btn" onClick={copy}>复制</button>
            </div>
          </div>
          <div className="output-area">{output || '等待处理…'}</div>
          {error && <div className="error-msg">错误: {error}</div>}
        </div>
      </div>
    </ToolShell>
  );
}
