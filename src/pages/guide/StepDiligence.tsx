import { SelectField, TextField } from '../../components/fields';
import { PageHeader, Panel } from '../../components/ui';
import { useDeal } from '../../hooks/useDeal';
import type { DueDiligenceItem, DueDiligenceStatus } from '../../models';

const GROUPS: { title: string; match: (label: string, category: string) => boolean }[] = [
  {
    title: 'Legal & occupancy',
    match: (label, category) =>
      category === 'legal' || /occupancy|unit count|zoning|basement|certificate/i.test(label),
  },
  {
    title: 'Building records',
    match: (label, category) =>
      ['dob', 'hpd', 'oath'].includes(category) || /DOB|HPD|ECB|OATH|permit|violation/i.test(label),
  },
  {
    title: 'Financial',
    match: (label, category) =>
      category === 'financial' || /rent roll|lease|tax|utilit|insurance/i.test(label),
  },
  {
    title: 'Physical',
    match: (label, category) =>
      ['property', 'structural', 'mechanical', 'environmental'].includes(category) ||
      /roof|foundation|electrical|plumbing|heat|boiler|environmental|mold/i.test(label),
  },
  {
    title: 'Closing',
    match: (label, category) =>
      ['closing', 'title', 'appraisal', 'transaction'].includes(category) ||
      /title|survey|appraisal|attorney|loan|closing/i.test(label),
  },
];

const STATUS_ICON: Record<DueDiligenceStatus, string> = {
  verified: '✓ Verified',
  issue_found: '⚠ Issue found',
  not_started: '○ Not checked',
  pending: '⏳ Pending',
  requested: '⏳ Requested',
  resolved: '✓ Resolved',
  not_applicable: '○ Not applicable',
};

export function StepDiligence() {
  const { deal, updateDeal } = useDeal();
  const done = deal.dueDiligence.filter((item) =>
    ['verified', 'resolved', 'not_applicable', 'issue_found'].includes(item.status),
  ).length;

  const patch = (id: string, partial: Partial<DueDiligenceItem>) =>
    updateDeal((c) => ({
      ...c,
      dueDiligence: c.dueDiligence.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    }));

  const used = new Set<string>();

  return (
    <div className="stack">
      <PageHeader eyebrow="Step 7 of 8" title="Before you buy">
        <p className="muted">
          {done} of {deal.dueDiligence.length} checks have a status other than “not started.” Completing a
          row does not retrieve official records.
        </p>
      </PageHeader>
      {GROUPS.map((group) => {
        const items = deal.dueDiligence.filter((item) => {
          if (used.has(item.id)) return false;
          const hit = group.match(item.label, item.category);
          if (hit) used.add(item.id);
          return hit;
        });
        if (items.length === 0) return null;
        return (
          <Panel key={group.title} title={group.title}>
            {items.map((item) => (
              <article className="dd-item" key={item.id}>
                <div className="card-toolbar">
                  <strong>{item.label}</strong>
                  <span>{STATUS_ICON[item.status]}</span>
                </div>
                <details>
                  <summary>Why this matters</summary>
                  <p className="small">
                    This is a standard acquisition check. Marking it complete is your workplan, not a
                    legal determination.
                  </p>
                </details>
                <div className="form-grid cols-2" style={{ marginTop: 8 }}>
                  <SelectField
                    label="Status"
                    value={item.status}
                    onChange={(status) => patch(item.id, { status: status as DueDiligenceStatus })}
                    options={Object.entries(STATUS_ICON).map(([value, label]) => ({ value, label }))}
                  />
                  <TextField label="Notes" value={item.notes} onChange={(notes) => patch(item.id, { notes })} />
                  <TextField label="Source" value={item.source ?? ''} onChange={(source) => patch(item.id, { source })} />
                  <TextField
                    label="Date checked"
                    value={item.dateChecked ?? ''}
                    onChange={(dateChecked) => patch(item.id, { dateChecked })}
                  />
                  <TextField
                    label="Document"
                    value={item.documentReference ?? ''}
                    onChange={(documentReference) => patch(item.id, { documentReference })}
                  />
                  <TextField
                    label="Follow-up"
                    value={item.followUp ?? ''}
                    onChange={(followUp) => patch(item.id, { followUp })}
                  />
                </div>
              </article>
            ))}
          </Panel>
        );
      })}
    </div>
  );
}
