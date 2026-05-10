import { type ReactNode } from 'react';

interface HelpSectionProps {
  title: string;
  features?: string[];
  usage?: string[];
  params?: { label: string; desc: string }[];
  children?: ReactNode;
}

export function HelpSection({ title, features, usage, params, children }: HelpSectionProps) {
  return (
    <div className="tool-help">
      <h3>{title}</h3>
      <div className="tool-help-grid">
        {features && features.length > 0 && (
          <div className="tool-help-card">
            <h4>Features</h4>
            <ul>{features.map((f, i) => <li key={i}>{f}</li>)}</ul>
          </div>
        )}
        {usage && usage.length > 0 && (
          <div className="tool-help-card">
            <h4>Usage</h4>
            <ol className="tool-help-steps">{usage.map((u, i) => <li key={i}>{u}</li>)}</ol>
          </div>
        )}
        {params && params.length > 0 && (
          <div className="tool-help-card">
            <h4>Parameters</h4>
            <dl className="tool-help-params">
              {params.map((p, i) => (
                <div key={i}><dt>{p.label}</dt><dd>{p.desc}</dd></div>
              ))}
            </dl>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
