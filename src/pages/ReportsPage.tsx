import { useMemo, useState } from 'react';
import { PageHeader } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import { ReportDocument } from '../report/ReportDocument';
import { ReportReadinessPanel } from '../report/ReportReadiness';
import { assessReportReadiness } from '../report/readiness';
import type { ReportKind } from '../report/types';

function csvEscape(value: string | number | null): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function ReportsPage() {
  const { deal, analysis, exportJson } = useDeal();
  const readiness = useMemo(() => assessReportReadiness(deal, analysis), [deal, analysis]);
  const [kind, setKind] = useState<ReportKind>('full');
  const [generated, setGenerated] = useState(false);

  const exportCsv = () => {
    const lines = [
      ['Metric', 'Value'],
      ['Deal', deal.name],
      ['Address', deal.property.address],
      ['Purchase Price', analysis.purchasePrice],
      ['GRI', analysis.gri],
      ['EGI', analysis.egi],
      ['NOI', analysis.noi],
      ['Cap Rate', analysis.capRate],
      ['Loan', analysis.loanAmount],
      ['LTV', analysis.ltv],
      ['DSCR', analysis.dscr],
      ['Cash Flow', analysis.cashFlowAnnual],
      ['CoC', analysis.cashOnCash],
      ['Debt Yield', analysis.debtYield],
      ['Total Cash', analysis.totalCashInvested],
      ['Value @ Target Cap', analysis.supportedValue],
      ['Conservative Max Offer', analysis.maxOffer.conservative],
      ['Financial Signal', analysis.health.financialSignal ?? analysis.health.signal],
      ['Report Class', readiness.reportClass],
      ['Confidence', readiness.confidence],
    ];
    const csv = lines.map((row) => row.map((cell) => csvEscape(cell as never)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deal.name.replace(/[^\w]+/g, '-') || 'deal'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stack report">
      <div className="no-print">
        <PageHeader eyebrow="Investment analysis report" title={deal.property.address || deal.name}>
          <p className="muted">
            Review readiness, then generate a print-ready underwriting memo. Browser Print / Save as PDF is the
            supported export path.
          </p>
          <div className="btn-row">
            {generated ? (
              <button type="button" onClick={() => window.print()}>
                Print / Save PDF
              </button>
            ) : null}
            <button type="button" className="secondary" onClick={exportJson}>
              Export JSON
            </button>
            <button type="button" className="secondary" onClick={exportCsv}>
              Export CSV
            </button>
          </div>
        </PageHeader>
        <ReportReadinessPanel
          readiness={readiness}
          kind={kind}
          onKind={setKind}
          onGenerate={() => setGenerated(true)}
        />
      </div>
      {generated ? <ReportDocument deal={deal} analysis={analysis} readiness={readiness} kind={kind} /> : null}
    </div>
  );
}
