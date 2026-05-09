import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ToolShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ToolShell({ title, description, children }: ToolShellProps) {
  return (
    <>
      <div className="tool-page-header">
        <Link to="/" className="back-btn">←</Link>
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </>
  );
}
