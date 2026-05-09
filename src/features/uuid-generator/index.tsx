import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';

function generateUUIDv4(): string {
  return crypto.randomUUID();
}

function generateUUIDv7(): string {
  // UUID v7: 48-bit timestamp + 72-bit random
  const now = BigInt(Date.now());
  const rand = new Uint8Array(10);
  crypto.getRandomValues(rand);

  const tsHex = now.toString(16).padStart(12, '0');
  const randHex = Array.from(rand).map((b) => b.toString(16).padStart(2, '0')).join('');

  // Layout: tttttttt-tttr-4rrr-Nrrr-rrrrrrrrrrrr
  const timeHi = tsHex.slice(0, 8);
  const timeLo = tsHex.slice(8, 12);
  const version = '7';
  const variant = '8'; // 10xx binary, variant 1

  return `${timeHi}-${timeLo.slice(0, 3)}${version}-${timeLo.slice(3, 4)}${randHex.slice(0, 3)}-${variant}${randHex.slice(3, 4)}${randHex.slice(4, 7)}-${randHex.slice(7, 19)}`;
}

export default function UuidGenerator() {
  const [results, setResults] = useState<string[]>([]);
  const [version, setVersion] = useState<'v4' | 'v7'>('v4');
  const [count, setCount] = useState(1);
  const [noDashes, setNoDashes] = useState(false);

  const generate = () => {
    const fn = version === 'v4' ? generateUUIDv4 : generateUUIDv7;
    const uuids = Array.from({ length: Math.min(count, 1000) }, () => fn());
    setResults(uuids);
  };

  const displayResults = noDashes ? results.map((u) => u.replace(/-/g, '')) : results;

  const copyAll = () => navigator.clipboard.writeText(displayResults.join('\n'));
  const copyOne = (uuid: string) => navigator.clipboard.writeText(uuid);

  return (
    <ToolShell title="UUID 生成器" description="生成 v4/v7 UUID，批量生成，自定义格式">
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">配置</div>
          <div className="uuid-config">
            <div className="uuid-config-row">
              <label>版本</label>
              <div className="panel-actions">
                <button className={`panel-btn${version === 'v4' ? ' accent' : ''}`} onClick={() => setVersion('v4')}>v4 (随机)</button>
                <button className={`panel-btn${version === 'v7' ? ' accent' : ''}`} onClick={() => setVersion('v7')}>v7 (时间有序)</button>
              </div>
            </div>
            <div className="uuid-config-row">
              <label>数量</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                className="uuid-count-input"
              />
            </div>
            <div className="uuid-config-row">
              <label>格式</label>
              <button className={`panel-btn${noDashes ? ' accent' : ''}`} onClick={() => setNoDashes(!noDashes)}>
                {noDashes ? '无连字符' : '标准格式'}
              </button>
            </div>
            <button className="panel-btn accent" onClick={generate} style={{ marginTop: 8, width: '100%' }}>
              生成
            </button>
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            结果
            {results.length > 0 && (
              <div className="panel-actions">
                <button className="panel-btn" onClick={copyAll}>复制全部</button>
              </div>
            )}
          </div>
          <div className="uuid-results">
            {displayResults.length > 0 ? (
              displayResults.map((uuid, i) => (
                <div key={i} className="uuid-item" onClick={() => copyOne(uuid)}>
                  <span className="uuid-num">{i + 1}</span>
                  <span className="uuid-value">{uuid}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                点击"生成"按钮创建 UUID
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
