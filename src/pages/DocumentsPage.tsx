import { SelectField, TextField } from '../components/fields';
import { Banner, PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import type { DocumentMeta } from '../models';
import { createId } from '../utils/id';

const KINDS: DocumentMeta['kind'][] = [
  'listing',
  'rent_roll',
  'lease',
  'tax_bill',
  'insurance',
  'co',
  'dob',
  'hpd',
  'inspection',
  'appraisal',
  'loan_quote',
  'contract',
  'title',
  'survey',
  'environmental',
  'renovation_estimate',
  'other',
];

export function DocumentsPage() {
  const { deal, updateDeal } = useDeal();
  const docs = deal.documents ?? [];

  const patch = (id: string, partial: Partial<DocumentMeta>) =>
    updateDeal((c) => ({
      ...c,
      documents: (c.documents ?? []).map((item) => (item.id === id ? { ...item, ...partial } : item)),
    }));

  return (
    <div className="stack">
      <PageHeader eyebrow="File index" title="Documents">
        <p className="muted">Metadata only. Files stay on your machine; nothing is uploaded.</p>
      </PageHeader>
      <Banner tone="info">Cloud storage is not implemented. This is a local checklist of what you have.</Banner>
      <Panel
        title="Document metadata"
        actions={
          <button
            type="button"
            onClick={() =>
              updateDeal((c) => ({
                ...c,
                documents: [
                  ...(c.documents ?? []),
                  {
                    id: createId('doc'),
                    kind: 'other',
                    label: '',
                    reference: '',
                    date: '',
                    notes: '',
                  },
                ],
              }))
            }
          >
            Add document
          </button>
        }
      >
        {docs.length === 0 ? <p className="empty-note">No documents indexed.</p> : null}
        {docs.map((item) => (
          <article className="income-card" key={item.id}>
            <div className="form-grid cols-2">
              <SelectField
                label="Type"
                value={item.kind}
                onChange={(kind) => patch(item.id, { kind: kind as DocumentMeta['kind'] })}
                options={KINDS.map((k) => ({ value: k, label: k.replaceAll('_', ' ') }))}
              />
              <TextField label="Label" value={item.label} onChange={(label) => patch(item.id, { label })} />
              <TextField label="Reference / filename" value={item.reference} onChange={(reference) => patch(item.id, { reference })} />
              <TextField label="Date" value={item.date} onChange={(date) => patch(item.id, { date })} />
              <TextField label="Notes" value={item.notes} onChange={(notes) => patch(item.id, { notes })} />
            </div>
            <button
              type="button"
              className="danger"
              style={{ marginTop: 8 }}
              onClick={() =>
                updateDeal((c) => ({ ...c, documents: (c.documents ?? []).filter((d) => d.id !== item.id) }))
              }
            >
              Remove
            </button>
          </article>
        ))}
      </Panel>
    </div>
  );
}
