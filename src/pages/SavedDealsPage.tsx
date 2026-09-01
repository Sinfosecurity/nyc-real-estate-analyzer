import { useNavigate } from 'react-router-dom';
import { PageHeader, Panel } from '../components/ui';
import { analyzeDeal } from '../calculations/analyze';
import { useDeal } from '../hooks/useDeal';
import { calculateGuidedProgress, firstIncompleteStep, GUIDE_STEPS } from '../ux/progress';
import { money } from '../utils/format';

export function SavedDealsPage() {
  const navigate = useNavigate();
  const { deals, load, duplicate, remove, exportJson, createNew } = useDeal();

  return (
    <div className="stack">
      <PageHeader eyebrow="Your files" title="Saved deals">
        <p className="muted">Deals stay in this browser until you export them.</p>
        <div className="btn-row">
          <button
            type="button"
            onClick={() => {
              createNew();
              navigate('/guide/property');
            }}
          >
            + Analyze New Property
          </button>
        </div>
      </PageHeader>
      <Panel title="All deals">
        {deals.length === 0 ? (
          <p className="empty-note">No deals saved yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Deal</th>
                  <th className="num">Asking</th>
                  <th className="num">NOI</th>
                  <th className="num">Cash flow</th>
                  <th className="num">Max offer</th>
                  <th>Class</th>
                  <th>Progress</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((item) => {
                  const analysis = analyzeDeal(item);
                  const progress = calculateGuidedProgress(item, analysis);
                  const resume =
                    GUIDE_STEPS.find((s) => s.id === firstIncompleteStep(progress))?.path ?? '/guide/analysis';
                  return (
                    <tr key={item.id}>
                      <td>{item.property.address || '—'}</td>
                      <td>{item.name}</td>
                      <td className="num">{money(item.loan.purchasePrice)}</td>
                      <td className="num">{money(analysis.noi)}</td>
                      <td className="num">{money(analysis.cashFlowAnnual)}</td>
                      <td className="num">{money(analysis.maxOffer.conservative)}</td>
                      <td>{analysis.health.signal}</td>
                      <td>{progress.overall}%</td>
                      <td>{item.updatedAt.slice(0, 10)}</td>
                      <td>
                        <div className="btn-row">
                          <button
                            type="button"
                            onClick={() => {
                              load(item.id);
                              navigate(resume);
                            }}
                          >
                            Continue
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                              load(item.id);
                              duplicate();
                            }}
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                              load(item.id);
                              navigate('/comparison');
                            }}
                          >
                            Compare
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                              load(item.id);
                              exportJson();
                            }}
                          >
                            Export
                          </button>
                          <button type="button" className="danger" onClick={() => remove(item.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
