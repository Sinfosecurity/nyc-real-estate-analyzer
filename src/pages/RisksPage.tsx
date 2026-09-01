import { SelectField, TextField } from '../components/fields';
import { PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import type { RiskItem } from '../models';
import { createId } from '../utils/id';

const CATEGORIES: RiskItem['category'][] = [
  'income',
  'tenant',
  'legal',
  'physical',
  'financing',
  'market',
  'construction',
  'environmental',
  'insurance',
];

function severity(item: RiskItem): 'high' | 'medium' | 'low' {
  if (item.probability === 'high' && item.impact === 'high') return 'high';
  if (item.probability === 'low' && item.impact === 'low') return 'low';
  return 'medium';
}

export function RisksPage() {
  const { deal, updateDeal } = useDeal();
  const risks = deal.risks ?? [];

  const patch = (id: string, partial: Partial<RiskItem>) =>
    updateDeal((c) => ({
      ...c,
      risks: (c.risks ?? []).map((item) => (item.id === id ? { ...item, ...partial } : item)),
    }));

  return (
    <div className="stack">
      <PageHeader eyebrow="Risk register" title="Risks">
        <p className="muted">
          An empty register is not a safe property. This list never declares a deal acceptable.
        </p>
      </PageHeader>
      <Panel
        title="Register"
        actions={
          <button
            type="button"
            onClick={() =>
              updateDeal((c) => ({
                ...c,
                risks: [
                  ...(c.risks ?? []),
                  {
                    id: createId('risk'),
                    category: 'legal',
                    risk: '',
                    probability: 'medium',
                    impact: 'medium',
                    mitigation: '',
                    status: 'open',
                  },
                ],
              }))
            }
          >
            Add risk
          </button>
        }
      >
        {risks.length === 0 ? (
          <div className="empty-guide">
            <h3>No risks recorded yet</h3>
            <p>An empty register is not a safe property. Add the issues you are still verifying.</p>
          </div>
        ) : null}
        {risks.map((item) => (
          <article className="income-card" key={item.id}>
            <p className="small">
              Severity: <strong>{severity(item)}</strong>
            </p>
            <div className="form-grid cols-2">
              <SelectField
                label="Category"
                value={item.category}
                onChange={(category) => patch(item.id, { category: category as RiskItem['category'] })}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
              <SelectField
                label="Status"
                value={item.status}
                onChange={(status) => patch(item.id, { status: status as RiskItem['status'] })}
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'monitoring', label: 'Monitoring' },
                  { value: 'mitigated', label: 'Mitigated' },
                ]}
              />
              <SelectField
                label="Probability"
                value={item.probability}
                onChange={(probability) => patch(item.id, { probability: probability as RiskItem['probability'] })}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
              />
              <SelectField
                label="Impact"
                value={item.impact}
                onChange={(impact) => patch(item.id, { impact: impact as RiskItem['impact'] })}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
              />
              <TextField label="Risk" value={item.risk} onChange={(risk) => patch(item.id, { risk })} />
              <TextField label="Mitigation" value={item.mitigation} onChange={(mitigation) => patch(item.id, { mitigation })} />
            </div>
            <button
              type="button"
              className="danger"
              style={{ marginTop: 8 }}
              onClick={() => updateDeal((c) => ({ ...c, risks: (c.risks ?? []).filter((r) => r.id !== item.id) }))}
            >
              Remove
            </button>
          </article>
        ))}
      </Panel>
    </div>
  );
}
