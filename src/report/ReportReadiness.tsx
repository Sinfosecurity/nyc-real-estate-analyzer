import type { ReportKind, ReportReadiness } from './types';

const CHECK_MARK: Record<ReportReadiness['checks'][number]['state'], string> = {
  pass: '✓',
  warn: '⚠',
  open: '○',
};

export function ReportReadinessPanel({
  readiness,
  kind,
  onKind,
  onGenerate,
}: {
  readiness: ReportReadiness;
  kind: ReportKind;
  onKind: (kind: ReportKind) => void;
  onGenerate: () => void;
}) {
  return (
    <section className="report-ready no-print">
      <header>
        <p className="rpt-kicker">Report readiness</p>
        <h2>{readiness.level}</h2>
        <p className="muted">
          {readiness.reportClass}. Financial result {readiness.financialSignal}. Underwriting confidence{' '}
          {readiness.confidence}.
        </p>
      </header>
      <div className="report-ready-metrics">
        <div>
          <span>Financial inputs</span>
          <strong>{readiness.financialCompleteness}%</strong>
        </div>
        <div>
          <span>Property verification</span>
          <strong>{readiness.recordVerification}%</strong>
        </div>
        <div>
          <span>Due diligence</span>
          <strong>{readiness.dueDiligence}%</strong>
        </div>
        <div>
          <span>Overall</span>
          <strong>{readiness.confidence}</strong>
        </div>
      </div>
      <p className="small">
        Warnings: {readiness.warningCount} · Critical conflicts: {readiness.criticalCount}
      </p>
      <ul className="report-ready-checks">
        {readiness.checks.map((check) => (
          <li key={check.id}>
            <span>{CHECK_MARK[check.state]}</span> {check.label}
          </li>
        ))}
      </ul>
      {readiness.conflicts.slice(0, 4).map((conflict) => (
        <p key={conflict.id} className={`report-conflict tone-${conflict.severity}`}>
          <strong>{conflict.title}.</strong> {conflict.explanation}
        </p>
      ))}
      <fieldset className="report-kind">
        <legend>Report type</legend>
        <label>
          <input type="radio" name="report-kind" checked={kind === 'executive'} onChange={() => onKind('executive')} />
          Executive investment memo
        </label>
        <label>
          <input type="radio" name="report-kind" checked={kind === 'full'} onChange={() => onKind('full')} />
          Full underwriting report
        </label>
        <label>
          <input type="radio" name="report-kind" checked={kind === 'diligence'} onChange={() => onKind('diligence')} />
          Due diligence report
        </label>
      </fieldset>
      <div className="btn-row">
        <button type="button" onClick={onGenerate}>
          {readiness.generateLabel}
        </button>
      </div>
    </section>
  );
}
