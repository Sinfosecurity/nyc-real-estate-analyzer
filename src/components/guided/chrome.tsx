import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { DealAnalysis, FieldProvenance } from '../../models';
import { GUIDE_STEPS, stepStatus, type GuideStepId, type GuidedProgress } from '../../ux/progress';

const PROVENANCE_LABEL: Record<FieldProvenance, string> = {
  official_source: 'Official record',
  listing_source: 'Listing',
  user_entered: 'User entered',
  calculated: 'Calculated',
  unverified: 'Unverified',
};

export function SourceBadge({ kind }: { kind: FieldProvenance }) {
  return <span className={`src-badge src-${kind}`}>{PROVENANCE_LABEL[kind]}</span>;
}

export function Importance({ kind }: { kind: 'required' | 'recommended' | 'optional' | 'retrieved' | 'verify' }) {
  const label = {
    required: 'Required',
    recommended: 'Recommended',
    optional: 'Optional',
    retrieved: 'Automatically retrieved',
    verify: 'Needs verification',
  }[kind];
  return <span className={`imp-badge imp-${kind}`}>{label}</span>;
}

export function ProgressRail({
  current,
  progress,
  analysis,
}: {
  current: GuideStepId;
  progress: GuidedProgress;
  analysis: DealAnalysis;
}) {
  return (
    <ol className="guide-rail" aria-label="Analysis steps">
      {GUIDE_STEPS.map((step) => {
        const status = stepStatus(step.id, progress, analysis);
        const mark = status === 'done' ? '✓' : status === 'warn' ? '⚠' : '○';
        return (
          <li key={step.id} className={`${step.id === current ? 'is-current' : ''} is-${status}`}>
            <Link to={step.path}>
              <span aria-hidden="true">{mark}</span> {step.short}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function NextActionCard({ text }: { text: string }) {
  return (
    <aside className="next-card" aria-live="polite">
      <p className="eyebrow">What should I do next?</p>
      <p>{text}</p>
    </aside>
  );
}

export function LearnLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="learn-inline" to={to}>
      {children}
    </Link>
  );
}

export function EmptyGuide({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="empty-guide">
      <h3>{title}</h3>
      <div>{children}</div>
      {actions ? <div className="btn-row">{actions}</div> : null}
    </div>
  );
}

export function ExplainBlock({
  title,
  meaning,
  formula,
  why,
  children,
}: {
  title: string;
  meaning: string;
  formula?: string;
  why?: string;
  children?: ReactNode;
}) {
  return (
    <details className="explain-block">
      <summary>What does this mean?</summary>
      <div>
        <strong>{title}</strong>
        <p>{meaning}</p>
        {formula ? (
          <p>
            <em>Formula:</em> {formula}
          </p>
        ) : null}
        {why ? (
          <p>
            <em>Why you care:</em> {why}
          </p>
        ) : null}
        {children}
      </div>
    </details>
  );
}
