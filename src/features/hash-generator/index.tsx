import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useCleanup } from '../../shared/hooks/useCleanup';

type Algo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

const ALGOS: { value: Algo; label: string }[] = [
  { value: 'SHA-1', label: 'SHA-1' },
  { value: 'SHA-256', label: 'SHA-256' },
  { value: 'SHA-384', label: 'SHA-384' },
  { value: 'SHA-512', label: 'SHA-512' },
];

async function computeHash(text: string, algo: Algo, encoding: 'hex' | 'base64'): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest(algo, data);
  const hashArray = new Uint8Array(hashBuffer);

  if (encoding === 'base64') {
    let binary = '';
    for (const b of hashArray) binary += String.fromCharCode(b);
    return btoa(binary);
  }

  return Array.from(hashArray).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function HashGenerator() {
  const [input, setInput] = useState('');
  const [algo, setAlgo] = useState<Algo>('SHA-256');
  const [encoding, setEncoding] = useState<'hex' | 'base64'>('hex');
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useCleanup(() => { setInput(''); setResults({}); });

  const compute = async () => {
    if (!input) { setResults({}); setError(''); return; }
    try {
      const hash = await computeHash(input, algo, encoding);
      setResults({ [algo]: hash });
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hash 计算失败');
    }
  };

  const computeAll = async () => {
    if (!input) { setResults({}); setError(''); return; }
    try {
      const entries = await Promise.all(
        ALGOS.map(async (a) => [a.value, await computeHash(input, a.value, encoding)] as const)
      );
      setResults(Object.fromEntries(entries));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hash 计算失败');
    }
  };

  const copyHash = (hash: string) => navigator.clipboard.writeText(hash);

  return (
    <ToolShell title="Hash 生成器" description="SHA-1/256/384/512 哈希计算，支持 HEX 和 Base64 输出">
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            输入文本
            <div className="panel-actions">
              <button className="panel-btn" onClick={() => { setInput(''); setResults({}); }}>清空</button>
            </div>
          </div>
          <textarea
            className="tool-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要计算 Hash 的文本…"
          />
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            算法
            <div className="panel-actions">
              {ALGOS.map((a) => (
                <button
                  key={a.value}
                  className={`panel-btn${algo === a.value ? ' accent' : ''}`}
                  onClick={() => setAlgo(a.value)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-header">
            输出格式
            <div className="panel-actions">
              <button className={`panel-btn${encoding === 'hex' ? ' accent' : ''}`} onClick={() => setEncoding('hex')}>HEX</button>
              <button className={`panel-btn${encoding === 'base64' ? ' accent' : ''}`} onClick={() => setEncoding('base64')}>Base64</button>
              <button className="panel-btn accent" onClick={compute}>计算</button>
              <button className="panel-btn" onClick={computeAll}>全部算法</button>
            </div>
          </div>
          <div className="hash-results">
            {Object.entries(results).map(([algorithm, hash]) => (
              <div key={algorithm} className="hash-result-row">
                <span className="hash-algo">{algorithm}</span>
                <span className="hash-value" title={hash}>{hash}</span>
                <button className="hash-copy" onClick={() => copyHash(hash)}>复制</button>
              </div>
            ))}
            {error && <div className="error-msg">{error}</div>}
            {Object.keys(results).length === 0 && !error && (
              <div className="hash-empty">输入文本后点击计算…</div>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
