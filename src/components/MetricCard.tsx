import { useState } from 'react';
import { GLOSSARY_BY_ID, type GlossaryEntry } from '../constants/glossary';
import type { CalculationTrace } from '../models';
import { useDeal } from '../hooks/useDeal';
import { money, pctPoints, ratio } from '../utils/format';

interface MetricCardProps {
  label: string;
  value: string;
  glossaryId?: string;
  trace?: CalculationTrace;
  tone?: 'default' | 'emphasis' | 'warn';
}

function formatTraceValue(line: CalculationTrace['lines'][number]): string {
  if (line.value === null || line.value === undefined || !Number.isFinite(line.value)) return 'N/A';
  if (line.isPercent) return pctPoints(line.value);
  return money(line.value);
}

export function FormulaBlock({ trace }: { trace: CalculationTrace }) {
  return (
    <div className="formula-block">
      <strong>{trace.title}</strong>
      <ol>
        {trace.lines.map((line) => (
          <li key={line.label}>
            <span>{line.operator ? `${line.operator} ` : ''}{line.label}</span>
            <b>{formatTraceValue(line)}</b>
          </li>
        ))}
      </ol>
      <div className="formula-result">
        <span>{trace.resultLabel}</span>
        <b>
          {trace.result === null || trace.result === undefined
            ? 'N/A'
            : trace.resultIsPercent
              ? pctPoints(trace.result)
              : Number.isFinite(trace.result) && Math.abs(trace.result) < 20 && !trace.resultIsPercent && trace.title.includes('DSCR')
                ? ratio(trace.result)
                : money(trace.result)}
        </b>
      </div>
      {trace.note ? <p>{trace.note}</p> : null}
    </div>
  );
}

export function GlossaryTip({ entry, variant = 'dark' }: { entry: GlossaryEntry; variant?: 'dark' | 'light' }) {
  return (
    <div className={variant === 'light' ? 'glossary-item' : 'glossary-tip'}>
      <strong>
        {entry.acronym} — {entry.name}
      </strong>
      <p>{entry.explanation}</p>
      <p>
        <em>Formula:</em> {entry.formula}
      </p>
      <p>
        <em>Why it matters:</em> {entry.why}
      </p>
      {entry.interpretation ? (
        <p>
          <em>Interpretation:</em> {entry.interpretation}
        </p>
      ) : null}
    </div>
  );
}

export function MetricCard({ label, value, glossaryId, trace, tone = 'default' }: MetricCardProps) {
  const { showCalculations } = useDeal();
  const [open, setOpen] = useState(false);
  const entry = glossaryId ? GLOSSARY_BY_ID[glossaryId] : undefined;

  return (
    <article className={`metric-card tone-${tone}`}>
      <header>
        <div className="metric-label">{label}</div>
        {entry ? (
          <details className="info-pop">
            <summary aria-label={`About ${entry.acronym}`}>i</summary>
            <GlossaryTip entry={entry} />
          </details>
        ) : null}
      </header>
      <div className="metric-value">{value}</div>
      {entry ? (
        <details className="explain-block metric-explain">
          <summary>What does this mean?</summary>
          <GlossaryTip entry={entry} variant="light" />
        </details>
      ) : null}
      {showCalculations && trace ? <FormulaBlock trace={trace} /> : null}
      {!showCalculations && trace ? (
        <button type="button" className="text-btn" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide calculation' : 'Show calculation'}
        </button>
      ) : null}
      {!showCalculations && open && trace ? <FormulaBlock trace={trace} /> : null}
    </article>
  );
}
