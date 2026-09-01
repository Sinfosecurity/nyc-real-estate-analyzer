import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NextActionCard, ProgressRail } from '../../components/guided/chrome';
import { useDeal } from '../../hooks/useDeal';
import { nextBestAction } from '../../ux/narrative';
import { calculateGuidedProgress, GUIDE_STEPS, type GuideStepId } from '../../ux/progress';

export function GuideLayout() {
  const { deal, analysis } = useDeal();
  const location = useLocation();
  const navigate = useNavigate();
  const progress = calculateGuidedProgress(deal, analysis);
  const current = (GUIDE_STEPS.find((s) => location.pathname.startsWith(s.path))?.id ??
    'property') as GuideStepId;
  const index = GUIDE_STEPS.findIndex((s) => s.id === current);
  const prev = index > 0 ? GUIDE_STEPS[index - 1] : null;
  const next = index < GUIDE_STEPS.length - 1 ? GUIDE_STEPS[index + 1] : null;

  if (location.pathname === '/guide') {
    return <Navigate to="/guide/property" replace />;
  }

  return (
    <div className="guide-wrap">
      <ProgressRail current={current} progress={progress} analysis={analysis} />
      <div className="guide-progress-line" aria-label="Analysis progress">
        <span>Property {progress.property}%</span>
        <span>Records {progress.records}%</span>
        <span>Income {progress.income}%</span>
        <span>Expenses {progress.expenses}%</span>
        <span>Financing {progress.financing}%</span>
        <span>Due diligence {progress.diligence}%</span>
        <strong>Overall {progress.overall}%</strong>
        <em>{progress.readyToAnalyze ? 'Ready to analyze' : 'Missing critical information'}</em>
      </div>
      <NextActionCard text={nextBestAction(deal, analysis)} />
      <Outlet />
      <div className="guide-sticky no-print">
        {prev ? (
          <button type="button" className="secondary" onClick={() => navigate(prev.path)}>
            Back
          </button>
        ) : (
          <Link className="btn secondary" to="/">
            Home
          </Link>
        )}
        {next ? (
          <button type="button" className="btn-xl" onClick={() => navigate(next.path)}>
            Continue
          </button>
        ) : (
          <Link className="btn btn-xl" to="/reports">
            Open full report
          </Link>
        )}
      </div>
    </div>
  );
}
