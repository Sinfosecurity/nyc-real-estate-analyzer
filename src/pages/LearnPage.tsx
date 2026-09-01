import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlossaryTip } from '../components/MetricCard';
import { PageHeader, Panel } from '../components/ui';
import { GLOSSARY } from '../constants/glossary';

const LESSONS = [
  { id: 'income', title: 'Income', ids: ['gpr', 'gri', 'egi', 'rentroll', 'legalocc'] },
  { id: 'expenses', title: 'Expenses', ids: ['opex', 'oer', 'capex'] },
  { id: 'noi', title: 'NOI', ids: ['noi'] },
  { id: 'cap', title: 'Cap Rate', ids: ['caprate', 'grm'] },
  { id: 'financing', title: 'Financing', ids: ['pi', 'debt-service', 'amort', 'paydown'] },
  { id: 'dscr', title: 'DSCR', ids: ['dscr', 'dcr'] },
  { id: 'ltv', title: 'LTV / LTC', ids: ['ltv', 'ltc'] },
  { id: 'coc', title: 'Cash-on-Cash', ids: ['coc', 'tce', 'cashflow'] },
  { id: 'dy', title: 'Debt Yield', ids: ['debt-yield'] },
  { id: 'val', title: 'Valuation', ids: ['caprate', 'arv', 'comp'] },
  { id: 'offer', title: 'Maximum Offer', ids: ['caprate', 'dscr', 'coc'] },
  { id: 'reno', title: 'Renovation', ids: ['capex', 'arv'] },
  { id: 'refi', title: 'Refinance / BRRRR', ids: ['refi', 'brrrr', 'arv'] },
  { id: 'nyc', title: 'NYC Due Diligence', ids: ['co', 'dob', 'hpd', 'dof', 'bbl', 'zoning', 'rstab'] },
];

export function LearnPage() {
  const [params] = useSearchParams();
  const fromQuery = params.get('topic');
  const [active, setActive] = useState(LESSONS.some((l) => l.id === fromQuery) ? fromQuery! : LESSONS[0].id);
  const lesson = LESSONS.find((item) => item.id === active) ?? LESSONS[0];
  const entries = useMemo(
    () => lesson.ids.map((id) => GLOSSARY.find((g) => g.id === id)).filter(Boolean),
    [lesson],
  );

  return (
    <div className="stack">
      <PageHeader eyebrow="Education" title="Learning center">
        <p className="muted">
          Plain-English lessons tied to the same formulas the underwriting engine uses. This is
          education, not advice.
        </p>
      </PageHeader>
      <Panel title="Topics">
        <div className="btn-row">
          {LESSONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === active ? '' : 'secondary'}
              onClick={() => setActive(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
      </Panel>
      <Panel title={lesson.title}>
        <p>
          {lesson.id === 'income' &&
            'Start with legal rent only. GRI is scheduled legal rent × 12. EGI subtracts vacancy and adds other legal income. Unverified basement or cellar rent stays out of the base case.'}
          {lesson.id === 'expenses' &&
            'OpEx is what it costs to run the building. Taxes, insurance, and most utilities are usually fixed for the hold period. Management percent is variable. CapEx is not subtracted from NOI unless you put a reserve on the OpEx schedule.'}
          {lesson.id === 'noi' &&
            'NOI = EGI − OpEx. Debt service is never inside NOI. If NOI is wrong, cap rate, DSCR, and cash flow are all wrong.'}
          {lesson.id === 'cap' &&
            'Cap rate = NOI ÷ price. It is an unleveraged yield, not a quality grade. GRM ignores expenses and is only a screen.'}
          {lesson.id === 'financing' &&
            'P&I is the amortizing payment. Annual debt service is P&I × 12. Zero rate is principal ÷ months. Interest-only periods pay interest only.'}
          {lesson.id === 'dscr' &&
            'DSCR = NOI ÷ annual debt service. Below 1.00 means operations do not cover the mortgage. The app uses your target, not a hidden lender rule.'}
          {lesson.id === 'ltv' &&
            'LTV here is loan ÷ purchase price. LTC is loan ÷ total project cost. They answer different leverage questions.'}
          {lesson.id === 'coc' &&
            'Cash-on-cash is annual cash flow ÷ total cash invested. Closing costs and reserves belong in the denominator.'}
          {lesson.id === 'dy' &&
            'Debt yield = NOI ÷ loan. It ignores rate and amortization, which is why some lenders like it as a credit check.'}
          {lesson.id === 'val' &&
            'Income approach is NOI ÷ target cap. Sales comparison uses only comps you typed. The range is indicative, not an appraisal.'}
          {lesson.id === 'offer' &&
            'Conservative max offer is the most restrictive active constraint among cap rate, DSCR, CoC, LTV, cash, and renovation basis.'}
          {lesson.id === 'reno' &&
            'Value created = NOI increase ÷ target cap. That is income-approach value creation, not guaranteed market appreciation.'}
          {lesson.id === 'refi' &&
            'BRRRR refinance loan = ARV × refinance LTV. Cash left in deal = original cash − cash taken out. ARV is your assumption.'}
          {lesson.id === 'nyc' &&
            'BBL joins DOB, HPD, and DOF records. A lookup never concludes that a unit is legal. Legal occupancy must be verified separately.'}
        </p>
        <div className="glossary-grid">
          {entries.map((entry) =>
            entry ? <GlossaryTip key={entry.id} entry={entry} variant="light" /> : null,
          )}
        </div>
      </Panel>
    </div>
  );
}
