import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner, PageHeader, Panel } from '../components/ui';
import { useDeal } from '../hooks/useDeal';
import { analyzeDeal } from '../calculations/analyze';
import { calculateGuidedProgress, firstIncompleteStep, GUIDE_STEPS } from '../ux/progress';
import { money } from '../utils/format';

export function HomePage() {
  const navigate = useNavigate();
  const {
    deals,
    createNew,
    load,
    startExample,
    onboardingSeen,
    setOnboardingSeen,
    setExperienceMode,
  } = useDeal();
  const [onboarding, setOnboarding] = useState(!onboardingSeen);

  const recent = [...deals]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);

  return (
    <div className="stack home-screen">
      {onboarding ? (
        <div className="onboard-overlay" role="dialog" aria-labelledby="onboard-title">
          <div className="onboard-card">
            <Onboarding
              onSkip={() => {
                setOnboardingSeen(true);
                setOnboarding(false);
              }}
              onStart={() => {
                setOnboardingSeen(true);
                setOnboarding(false);
                setExperienceMode('guided');
                createNew();
                navigate('/guide/property');
              }}
            />
          </div>
        </div>
      ) : null}

      <PageHeader eyebrow="NYC property investment assistant" title="Analyze a NYC Property">
        <p className="lede">
          Enter a property and we'll guide you through the income, expenses, financing, public
          records, risks, valuation and maximum offer.
        </p>
      </PageHeader>
      <BetaStorageNotice />

      <div className="home-actions">
        <button
          type="button"
          className="btn-xl"
          onClick={() => {
            setExperienceMode('guided');
            createNew();
            navigate('/guide/property');
          }}
        >
          + Analyze New Property
        </button>
        <button type="button" className="secondary btn-xl" onClick={() => navigate('/deals')}>
          Open Saved Deal
        </button>
      </div>
      <div className="btn-row">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setExperienceMode('guided');
            startExample();
            navigate('/guide/property');
          }}
        >
          Try Example Property
        </button>
        <button type="button" className="ghost" onClick={() => navigate('/learn')}>
          Learn How This Works
        </button>
      </div>

      {recent.length > 0 ? (
        <Panel title="Recent deals">
          <ul className="deal-card-list">
            {recent.map((item) => {
              const analysis = analyzeDeal(item);
              const progress = calculateGuidedProgress(item, analysis);
              const resume = GUIDE_STEPS.find((s) => s.id === firstIncompleteStep(progress))?.path ?? '/guide/analysis';
              return (
                <li key={item.id} className="deal-mini">
                  <div>
                    <strong>{item.property.address || item.name}</strong>
                    <p className="small muted">
                      {item.name} · Asking {money(item.loan.purchasePrice)} · {analysis.health.signal} ·{' '}
                      {progress.overall}% · Updated {item.updatedAt.slice(0, 10)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      load(item.id);
                      navigate(resume);
                    }}
                  >
                    Continue Analysis
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : (
        <Banner tone="info">
          No saved deals yet. Start with a new property or try the labeled synthetic example.
        </Banner>
      )}
    </div>
  );
}

const NOTICE_KEY = 'nyc-deal-analyzer.beta-notice';

function BetaStorageNotice() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(NOTICE_KEY) !== 'dismissed';
    } catch {
      return true;
    }
  });
  if (!open) return null;
  return (
    <Banner tone="info">
      Beta testing: Deal data is currently stored in this browser unless otherwise indicated.
      <button
        type="button"
        className="text-btn"
        style={{ marginLeft: 10 }}
        onClick={() => {
          localStorage.setItem(NOTICE_KEY, 'dismissed');
          setOpen(false);
        }}
      >
        Dismiss
      </button>
    </Banner>
  );
}

function Onboarding({ onSkip, onStart }: { onSkip: () => void; onStart: () => void }) {
  const [page, setPage] = useState(0);
  const slides = [
    {
      title: 'Find a Property',
      body: 'Enter a NYC address or create a manual property. We will try public records, then tell you what still needs verification.',
    },
    {
      title: 'Build the Real Income',
      body: 'Separate verified rent from potential or unverified income. Unverified basement or extra units stay out of the conservative case.',
    },
    {
      title: 'Test the Numbers',
      body: 'We calculate financing, cash flow, DSCR, cap rate, and returns from the same engine used by the advanced underwriting desk.',
    },
    {
      title: 'Make an Informed Offer',
      body: 'Compare asking price against what the property’s income and your investment targets support. This is a screening tool, not a buy recommendation.',
    },
  ];
  const slide = slides[page];

  return (
    <>
      <p className="eyebrow">Welcome</p>
      <h2 id="onboard-title">{slide.title}</h2>
      <p>{slide.body}</p>
      <p className="small muted">
        {page + 1} of {slides.length}
      </p>
      <div className="btn-row">
        {page < slides.length - 1 ? (
          <button type="button" onClick={() => setPage((n) => n + 1)}>
            Next
          </button>
        ) : (
          <button type="button" onClick={onStart}>
            Analyze My First Property
          </button>
        )}
        <button type="button" className="ghost" onClick={onSkip}>
          Skip Introduction
        </button>
      </div>
    </>
  );
}
