import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ToolShellProps {
  title: string;
  description: string;
  children: ReactNode;
  headerRight?: ReactNode;
}

export function ToolShell({ title, description, children, headerRight }: ToolShellProps) {
  return (
    <>
      <div className="tool-page-header">
        <Link to="/" className="back-btn">←</Link>
        <div style={{ flex: 1 }}>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {headerRight && <div style={{ marginLeft: 16, flexShrink: 0 }}>{headerRight}</div>}
      </div>
      {children}
    </>
  );
}
