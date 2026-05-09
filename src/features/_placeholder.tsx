import { ToolShell } from '../shell/ToolShell';

export function createPlaceholder(name: string, description: string) {
  return function PlaceholderTool() {
    return (
      <ToolShell title={name} description={description}>
        <div className="tool-panel">
          <div className="output-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 14 }}>
            该工具正在开发中，敬请期待…
          </div>
        </div>
      </ToolShell>
    );
  };
}
