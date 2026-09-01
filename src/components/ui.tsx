import type { ReactNode } from 'react';
import type { DealSignal } from '../models';

export function Panel({
  title,
  intro,
  actions,
  children,
  id,
}: {
  title?: string;
  intro?: string;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="panel" id={id}>
      {(title || actions) && (
        <header className="panel-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {intro ? <p className="panel-intro">{intro}</p> : null}
          </div>
          {actions ? <div className="panel-actions">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}

export function Banner({
  children,
  tone = 'warn',
}: {
  children: ReactNode;
  tone?: 'warn' | 'info' | 'danger';
}) {
  return <div className={`banner tone-${tone}`}>{children}</div>;
}

export function SignalStamp({ signal }: { signal: DealSignal }) {
  const cls =
    signal === 'STRONG REVIEW' ? 'signal-strong' : signal === 'INVESTIGATE' ? 'signal-mid' : 'signal-pass';
  return <div className={`signal-stamp ${cls}`}>{signal}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {children}
    </header>
  );
}

export function FormGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return <div className={`form-grid cols-${cols}`}>{children}</div>;
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="metric-grid">{children}</div>;
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="empty-note">{children}</p>;
}
