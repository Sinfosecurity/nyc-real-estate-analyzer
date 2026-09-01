import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDeal } from '../hooks/useDeal';
import { calculateGuidedProgress, firstIncompleteStep, GUIDE_STEPS } from '../ux/progress';
import { money } from '../utils/format';
import { SignalStamp } from './ui';

const GUIDED_LINKS = [
  ['/', 'Home'],
  ['/guide/property', 'Current deal'],
  ['/learn', 'Learn'],
  ['/deals', 'Saved deals'],
] as const;

const ADVANCED_LINKS = [
  ['/', 'Home'],
  ['/guide/analysis', 'Guided analysis'],
  ['/desk', 'Dashboard'],
  ['/property', 'Property'],
  ['/rent-roll', 'Rent Roll'],
  ['/income', 'Income'],
  ['/expenses', 'Expenses'],
  ['/financing', 'Financing'],
  ['/returns', 'Returns'],
  ['/valuation', 'Valuation / Offer'],
  ['/scenarios', 'Scenarios'],
  ['/stress', 'Stress Test'],
  ['/renovation', 'Renovation'],
  ['/refinance', 'Refinance'],
  ['/comps', 'Comps'],
  ['/due-diligence', 'Due Diligence'],
  ['/risks', 'Risks'],
  ['/documents', 'Documents'],
  ['/history', 'History'],
  ['/comparison', 'Comparison'],
  ['/reports', 'Reports'],
  ['/learn', 'Learning'],
  ['/settings', 'Settings'],
] as const;

export function AppShell() {
  const {
    deal,
    analysis,
    save,
    exportJson,
    experienceMode,
    setExperienceMode,
    saveFlash,
  } = useDeal();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const progress = calculateGuidedProgress(deal, analysis);
  const resume = GUIDE_STEPS.find((s) => s.id === firstIncompleteStep(progress))?.path ?? '/guide/analysis';
  const links = experienceMode === 'guided' ? GUIDED_LINKS : ADVANCED_LINKS;
  const showDealBar = location.pathname !== '/';

  return (
    <div className="app-frame">
      {open ? (
        <div
          className="overlay"
          onClick={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' || event.key === 'Enter') setOpen(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="Close navigation"
        />
      ) : null}
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Primary">
        <div>
          <p className="brand-kicker">NYC investor assistant</p>
          <h2 className="brand-title">
            Deal Analyzer <span className="beta-pill">Beta</span>
          </h2>
        </div>
        <nav id="app-nav" className="nav-list" onClick={() => setOpen(false)}>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>
        {experienceMode === 'guided' ? (
          <div className="nav-group">
            <p className="brand-kicker">Advanced underwriting</p>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setExperienceMode('advanced');
                navigate('/property');
                setOpen(false);
              }}
            >
              Open advanced desk
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setExperienceMode('guided');
              navigate('/guide/analysis');
              setOpen(false);
            }}
          >
            Guided investor mode
          </button>
        )}
        <div className="sidebar-foot">
          <p className="save-flash" aria-live="polite">
            {saveFlash === 'saving' ? 'Saving…' : saveFlash === 'saved' ? '✓ Saved' : 'Auto-saves as you type'}
          </p>
          <button type="button" onClick={save}>Save</button>
          <button type="button" className="secondary" onClick={exportJson}>Export JSON</button>
        </div>
      </aside>
      <div className="app-main">
        <div className="topbar">
          <div>
            <button
              type="button"
              className="menu-toggle secondary"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="app-nav"
            >
              Menu
            </button>
            <p className="eyebrow">{experienceMode === 'guided' ? 'Guided investor mode' : 'Advanced underwriting'}</p>
            <h1>{deal.property.address || deal.name || 'Untitled property'}</h1>
          </div>
          <SignalStamp signal={analysis.health.signal} />
        </div>
        {showDealBar ? (
          <div className="deal-bar no-print">
            <div>
              <strong>{deal.property.address || 'Address not entered'}</strong>
              <span>
                {[deal.property.borough, deal.property.zip].filter(Boolean).join(', ')} · Asking{' '}
                {money(deal.loan.purchasePrice)} · {analysis.health.signal} · {progress.overall}%
              </span>
            </div>
            <div className="btn-row">
              <button type="button" onClick={() => navigate(resume)}>
                Continue analysis
              </button>
              <button type="button" className="secondary" onClick={save}>
                Save
              </button>
              <button type="button" className="secondary" onClick={() => navigate('/reports')}>
                Report
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setExperienceMode(experienceMode === 'guided' ? 'advanced' : 'guided');
                  navigate(experienceMode === 'guided' ? '/property' : '/guide/analysis');
                }}
              >
                {experienceMode === 'guided' ? 'Advanced' : 'Guided'}
              </button>
            </div>
          </div>
        ) : null}
        <Outlet />
      </div>
    </div>
  );
}
