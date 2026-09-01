import { LearnLink } from '../../components/guided/chrome';
import { NumberField, TextField } from '../../components/fields';
import { Banner, FormGrid, PageHeader, Panel } from '../../components/ui';
import { useDeal } from '../../hooks/useDeal';

export function StepRecords() {
  const { deal, analysis, updateDeal } = useDeal();
  const p = deal.property;
  const conflict = analysis.sourceConflicts?.[0];

  const patch = (partial: Partial<typeof p>) =>
    updateDeal((c) => ({ ...c, property: { ...c.property, ...partial } }));

  return (
    <div className="stack">
      <PageHeader eyebrow="Step 2 of 8" title="What does NYC appear to recognize this property as?">
        <p className="muted">
          Plain English first. Public records help, but they do not certify that a unit is legal to rent.
        </p>
        <LearnLink to="/learn?topic=nyc">Learn: NYC records and legal occupancy</LearnLink>
      </PageHeader>

      <Panel title="Property records summary">
        <div className="grid-2">
          <div className="status-card">
            <p className="eyebrow">Listing / observed</p>
            <p className="metric-value">{p.observedUnitCount || p.legalUnitCount || 'Not entered'} units</p>
          </div>
          <div className="status-card">
            <p className="eyebrow">Official property data</p>
            <p className="metric-value">
              {p.officialUnitCount != null ? `${p.officialUnitCount} unit${p.officialUnitCount === 1 ? '' : 's'}` : 'Not checked'}
            </p>
          </div>
        </div>
        {conflict ? (
          <Banner tone="danger">
            <h3>Source conflict</h3>
            <p>
              The listing and available official records do not agree about the number of units. The
              analyzer will not automatically count income from additional units as legal base-case
              income until this issue is resolved.
            </p>
            <p>
              <strong>Why this matters:</strong> If a property is marketed as {conflict.listing} units
              but official records indicate {conflict.official}, the additional units may need DOB,
              Certificate of Occupancy, zoning, or legal review.
            </p>
            <div className="btn-row">
              <button type="button" className="secondary" onClick={() => patch({ notes: `${p.notes}\nMarked for attorney review: unit-count conflict.`.trim() })}>
                Mark for attorney review
              </button>
              <button type="button" className="secondary">
                Continue conservatively
              </button>
            </div>
          </Banner>
        ) : (
          <Banner tone="info">
            No unit-count conflict is currently stored. Confirm the official count yourself before
            treating extra units as legal income.
          </Banner>
        )}
        <FormGrid>
          <NumberField
            label="Observed / listing unit count"
            value={p.observedUnitCount ?? 0}
            onChange={(observedUnitCount) => patch({ observedUnitCount })}
          />
          <NumberField
            label="Your underwriting unit count"
            value={p.legalUnitCount}
            onChange={(legalUnitCount) => patch({ legalUnitCount })}
          />
        </FormGrid>
      </Panel>

      <div className="grid-2">
        <RecordCard
          title="DOB"
          status={p.lastLookupAt ? 'Public data check incomplete' : 'Check needed'}
          explain="Department of Buildings records may identify permits, violations, occupancy information and construction history."
          action="Check DOB records"
          href="https://a810-bisweb.nyc.gov/bisweb/bispi00.jsp"
        />
        <RecordCard
          title="HPD"
          status={p.hpdStatus?.includes('Unknown') ? 'No data checked yet' : 'Manual verification required'}
          explain="HPD records may contain housing-code violations and building registration information."
          action="Check HPD records"
          href="https://hpdonline.nyc.gov/hpdonline/"
        />
        <RecordCard
          title="OATH / ECB"
          status="Check needed"
          explain="OATH/ECB records can identify summonses and penalties associated with property violations."
          action="Check OATH / ECB"
          href="https://a820-ecbticketfinder.nyc.gov/"
        />
        <RecordCard
          title="Certificate of Occupancy"
          status="Not verified"
          explain="The Certificate of Occupancy can be important for confirming the legally approved use and occupancy of the building."
          action="Add / verify CO information"
          href="https://a810-bisweb.nyc.gov/bisweb/COsByAddressServlet"
        />
      </div>
      <Panel title="Your notes (user entered)">
        <FormGrid>
          <TextField
            label="Certificate of Occupancy status"
            value={p.certificateOfOccupancyStatus}
            onChange={(certificateOfOccupancyStatus) => patch({ certificateOfOccupancyStatus })}
          />
          <TextField label="DOB notes" value={p.dobStatus} onChange={(dobStatus) => patch({ dobStatus })} />
          <TextField label="HPD notes" value={p.hpdStatus} onChange={(hpdStatus) => patch({ hpdStatus })} />
        </FormGrid>
        <p className="small muted">
          These cards never show “verified” unless you recorded a verification. Sample Open Data
          lookups are not a complete building file.
        </p>
      </Panel>
    </div>
  );
}

function RecordCard({
  title,
  status,
  explain,
  action,
  href,
}: {
  title: string;
  status: string;
  explain: string;
  action: string;
  href: string;
}) {
  return (
    <section className="status-card">
      <h3>{title}</h3>
      <p className="eyebrow">{status}</p>
      <p>{explain}</p>
      <a className="btn secondary" href={href} target="_blank" rel="noreferrer">
        {action}
      </a>
    </section>
  );
}
