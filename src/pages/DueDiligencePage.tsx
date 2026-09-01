import { SelectField, TextField } from '../components/fields';
import { Banner, PageHeader, Panel } from '../components/ui';
import { DUE_DILIGENCE_CATEGORY_LABELS } from '../constants/dueDiligence';
import { useDeal } from '../hooks/useDeal';
import type { DueDiligenceCategory, DueDiligenceItem, DueDiligenceStatus } from '../models';

const STATUSES: { value: DueDiligenceStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'requested', label: 'Requested' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'issue_found', label: 'Issue Found' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'not_applicable', label: 'Not Applicable' },
];

const CATEGORIES: DueDiligenceCategory[] = [
  'legal',
  'dob',
  'hpd',
  'oath',
  'zoning',
  'title',
  'tenancy',
  'leases',
  'financial',
  'structural',
  'mechanical',
  'environmental',
  'insurance',
  'financing',
  'appraisal',
  'closing',
  'property',
  'transaction',
];

export function DueDiligencePage() {
  const { deal, analysis, updateDeal } = useDeal();

  const patch = (id: string, partial: Partial<DueDiligenceItem>) =>
    updateDeal((c) => ({
      ...c,
      dueDiligence: c.dueDiligence.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    }));

  const counts = deal.dueDiligence.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="stack">
      <PageHeader eyebrow="NYC acquisition checklist" title="Due diligence">
        <p className="muted">
          Status is user-tracked. Completing a row does not retrieve official records and does not
          certify legality.
        </p>
      </PageHeader>
      <Banner tone="info">
        Consult DOB, HPD, NYC Finance / DOF, title, and professional advisors. This checklist is a
        workplan, not a legal determination.
      </Banner>
      {(analysis.health.criticalIssues ?? []).length > 0 ? (
        <Banner tone="danger">
          Critical issues: {(analysis.health.criticalIssues ?? []).join('; ')}
        </Banner>
      ) : null}
      <Panel title="Status rollup">
        <p>
          Not started {counts.not_started ?? 0} · Pending {counts.pending ?? 0} · Verified{' '}
          {counts.verified ?? 0} · Issue found {counts.issue_found ?? 0} · N/A {counts.not_applicable ?? 0}
        </p>
      </Panel>
      {CATEGORIES.map((category) => (
        <Panel key={category} title={DUE_DILIGENCE_CATEGORY_LABELS[category]}>
          {deal.dueDiligence
            .filter((item) => item.category === category)
            .map((item) => (
              <div className="dd-item" key={item.id} style={{ marginBottom: 10 }}>
                <strong>{item.label}</strong>
                <div className="form-grid cols-2" style={{ marginTop: 8 }}>
                  <SelectField
                    label="Status"
                    value={item.status}
                    onChange={(status) => patch(item.id, { status: status as DueDiligenceStatus })}
                    options={STATUSES}
                  />
                  <SelectField
                    label="Severity"
                    value={item.severity ?? 'medium'}
                    onChange={(severity) =>
                      patch(item.id, { severity: severity as DueDiligenceItem['severity'] })
                    }
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'critical', label: 'Critical' },
                    ]}
                  />
                  <TextField label="Source" value={item.source ?? ''} onChange={(source) => patch(item.id, { source })} />
                  <TextField
                    label="Date checked"
                    value={item.dateChecked ?? ''}
                    onChange={(dateChecked) => patch(item.id, { dateChecked })}
                    placeholder="YYYY-MM-DD"
                  />
                  <TextField
                    label="Document reference"
                    value={item.documentReference ?? ''}
                    onChange={(documentReference) => patch(item.id, { documentReference })}
                  />
                  <TextField label="Owner" value={item.owner ?? ''} onChange={(owner) => patch(item.id, { owner })} />
                  <TextField
                    label="Follow-up"
                    value={item.followUp ?? ''}
                    onChange={(followUp) => patch(item.id, { followUp })}
                  />
                  <TextField label="Notes" value={item.notes} onChange={(notes) => patch(item.id, { notes })} />
                </div>
              </div>
            ))}
        </Panel>
      ))}
    </div>
  );
}
