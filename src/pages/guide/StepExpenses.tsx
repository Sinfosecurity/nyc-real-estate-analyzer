import { NumberField } from '../../components/fields';
import { ExplainBlock, LearnLink } from '../../components/guided/chrome';
import { Banner, PageHeader, Panel } from '../../components/ui';
import { EXPENSE_TEMPLATES } from '../../constants/defaults';
import { useDeal } from '../../hooks/useDeal';
import { money, pct } from '../../utils/format';

const GROUPS: { title: string; keys: string[]; blurb: string }[] = [
  {
    title: 'Property costs',
    keys: ['taxes', 'insurance', 'water'],
    blurb: 'Taxes, insurance, and water/sewer are usually the first bills an owner cannot avoid.',
  },
  {
    title: 'Operations',
    keys: ['repairs', 'maintenance', 'management', 'electric', 'gas', 'trash', 'landscaping', 'superintendent'],
    blurb: 'Day-to-day running of the building. Management percent is treated as variable.',
  },
  {
    title: 'Reserves',
    keys: ['reserve'],
    blurb: 'A replacement reserve is an underwriting habit, not a hidden bank account.',
  },
];

const TIPS: Record<string, string> = {
  taxes: 'NYC property tax for the year. Do not confuse this with market or assessed value.',
  insurance: 'Landlord policy estimate. Get a quote before you rely on the number.',
  water: 'Water and sewer. Often owner-paid in 1–4 family buildings.',
  repairs: 'Recurring repairs, not a roof replacement.',
  maintenance: 'Routine upkeep.',
  management: 'Even if you self-manage, many investors underwrite a fee.',
  electric: 'Owner-paid electricity only.',
  gas: 'Owner-paid heat or cooking gas.',
  trash: 'Private carting if applicable.',
  landscaping: 'Yard or snow if you will pay it.',
  superintendent: 'Super or porter if any.',
  reserve: 'Money set aside for future capital items. This line is inside NOI if you enter it here.',
};

export function StepExpenses() {
  const { deal, analysis, updateDeal } = useDeal();

  const patch = (id: string, annualAmount: number) =>
    updateDeal((c) => ({
      ...c,
      expenses: c.expenses.map((item) => (item.id === id ? { ...item, annualAmount, mode: 'dollar' as const } : item)),
    }));

  const applyEstimate = (key: string) => {
    const template = EXPENSE_TEMPLATES.find((item) => item.key === key);
    const row = deal.expenses.find((item) => item.key === key);
    if (!template || !row) return;
    patch(row.id, template.defaultAnnual);
  };

  return (
    <div className="stack">
      <PageHeader eyebrow="Step 4 of 8" title="What will this property cost to operate?">
        <p className="muted">These are operating costs, not the mortgage. Estimates are educational, not official bills.</p>
        <LearnLink to="/learn?topic=expenses">Learn: why operating expenses matter</LearnLink>
      </PageHeader>
      <Banner tone="info">Vacancy allowance lives on the income step / assumptions, not as a fake official expense.</Banner>
      {GROUPS.map((group) => (
        <Panel key={group.title} title={group.title} intro={group.blurb}>
          {group.keys.map((key) => {
            const item = deal.expenses.find((row) => row.key === key);
            if (!item) return null;
            return (
              <div className="expense-row" key={item.id}>
                <div>
                  <strong>{item.label}</strong>
                  <details>
                    <summary>What is this?</summary>
                    <p>{TIPS[key] ?? item.label}</p>
                  </details>
                </div>
                <NumberField label="Annual ($)" value={item.annualAmount} onChange={(annualAmount) => patch(item.id, annualAmount)} />
                <button type="button" className="secondary" onClick={() => applyEstimate(key)}>
                  Use estimate
                </button>
              </div>
            );
          })}
        </Panel>
      ))}
      <Panel title="Operating totals">
        <div className="metric-grid">
          <article className="metric-card tone-emphasis">
            <div className="metric-label">Annual operating expenses</div>
            <div className="metric-value">{money(analysis.operatingExpenses)}</div>
          </article>
          <article className="metric-card">
            <div className="metric-label">Monthly equivalent</div>
            <div className="metric-value">{money(analysis.monthlyOperatingExpenses)}</div>
          </article>
          <article className="metric-card">
            <div className="metric-label">Expense ratio</div>
            <div className="metric-value">{pct(analysis.operatingExpenseRatio)}</div>
          </article>
        </div>
        <ExplainBlock
          title="NOI — Net Operating Income"
          meaning="The income the property produces after normal operating expenses but before mortgage payments."
          formula="EGI − Operating Expenses"
          why="Investors use NOI to evaluate operating performance independently of how the purchase is financed."
        >
          <p>
            {money(analysis.egi)} − {money(analysis.operatingExpenses)} = {money(analysis.noi)} NOI
          </p>
        </ExplainBlock>
      </Panel>
    </div>
  );
}
