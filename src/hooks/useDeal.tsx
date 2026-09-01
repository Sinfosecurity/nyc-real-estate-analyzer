import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { analyzeDeal } from '../calculations/analyze';
import { createBlankDeal, createSyntheticExampleDeal } from '../constants/defaults';
import type { Deal, DealAnalysis } from '../models';
import {
  ensureSeedDeal,
  getActiveDealId,
  localDealRepository,
  setActiveDealId,
} from '../storage/localRepository';
import { createId } from '../utils/id';

export type ExperienceMode = 'guided' | 'advanced';

interface UiPrefs {
  showCalculations: boolean;
  experienceMode: ExperienceMode;
  onboardingSeen: boolean;
}

const PREFS_KEY = 'nyc-deal-analyzer.v2.prefs';

function readPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { showCalculations: false, experienceMode: 'guided', onboardingSeen: false };
    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      showCalculations: Boolean(parsed.showCalculations),
      experienceMode: parsed.experienceMode === 'advanced' ? 'advanced' : 'guided',
      onboardingSeen: Boolean(parsed.onboardingSeen),
    };
  } catch {
    return { showCalculations: false, experienceMode: 'guided', onboardingSeen: false };
  }
}

export type SaveFlash = 'idle' | 'saving' | 'saved';

interface DealContextValue {
  deal: Deal;
  analysis: DealAnalysis;
  deals: Deal[];
  showCalculations: boolean;
  setShowCalculations: (value: boolean) => void;
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => void;
  onboardingSeen: boolean;
  setOnboardingSeen: (value: boolean) => void;
  saveFlash: SaveFlash;
  updateDeal: (updater: (deal: Deal) => Deal) => void;
  save: () => void;
  createNew: () => Deal;
  duplicate: () => void;
  remove: (id?: string) => void;
  rename: (name: string) => void;
  load: (id: string) => void;
  resetExample: () => void;
  startExample: () => Deal;
  exportJson: () => void;
  importJsonText: (json: string) => void;
}

const DealContext = createContext<DealContextValue | null>(null);

export function DealProvider({ children }: { children: ReactNode }) {
  const [deal, setDeal] = useState<Deal>(() => ensureSeedDeal());
  const [deals, setDeals] = useState<Deal[]>(() => localDealRepository.list());
  const [prefs, setPrefs] = useState<UiPrefs>(() => readPrefs());
  const [saveFlash, setSaveFlash] = useState<SaveFlash>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writePrefs = useCallback((next: UiPrefs) => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    setPrefs(next);
  }, []);

  const persist = useCallback((next: Deal) => {
    setSaveFlash('saving');
    const saved = localDealRepository.save(next);
    setActiveDealId(saved.id);
    setDeals(localDealRepository.list());
    setSaveFlash('saved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveFlash('idle'), 2200);
    return saved;
  }, []);

  const updateDeal = useCallback(
    (updater: (current: Deal) => Deal) => {
      setDeal((current) => persist(updater(current)));
    },
    [persist],
  );

  const analysis = useMemo(() => analyzeDeal(deal), [deal]);

  const setShowCalculations = useCallback(
    (value: boolean) => writePrefs({ ...prefs, showCalculations: value }),
    [prefs, writePrefs],
  );

  const setExperienceMode = useCallback(
    (experienceMode: ExperienceMode) => writePrefs({ ...prefs, experienceMode }),
    [prefs, writePrefs],
  );

  const setOnboardingSeen = useCallback(
    (onboardingSeen: boolean) => writePrefs({ ...prefs, onboardingSeen }),
    [prefs, writePrefs],
  );

  const value = useMemo<DealContextValue>(
    () => ({
      deal,
      analysis,
      deals,
      showCalculations: prefs.showCalculations,
      setShowCalculations,
      experienceMode: prefs.experienceMode,
      setExperienceMode,
      onboardingSeen: prefs.onboardingSeen,
      setOnboardingSeen,
      saveFlash,
      updateDeal,
      save: () => {
        persist(deal);
      },
      createNew: () => {
        const created = persist(createBlankDeal({ id: createId('deal') }));
        setDeal(created);
        return created;
      },
      duplicate: () => {
        const copy = localDealRepository.duplicate(deal.id);
        if (copy) {
          setActiveDealId(copy.id);
          setDeal(copy);
          setDeals(localDealRepository.list());
        }
      },
      remove: (id) => {
        const target = id ?? deal.id;
        localDealRepository.delete(target);
        const remaining = localDealRepository.list();
        setDeals(remaining);
        if (remaining.length === 0) {
          const seeded = persist(createBlankDeal());
          setDeal(seeded);
        } else if (target === deal.id) {
          setDeal(remaining[0]);
          setActiveDealId(remaining[0].id);
        }
      },
      rename: (name) => {
        updateDeal((current) => ({ ...current, name }));
      },
      load: (id) => {
        const found = localDealRepository.get(id);
        if (found) {
          setDeal(found);
          setActiveDealId(found.id);
        }
      },
      resetExample: () => {
        const reset = createSyntheticExampleDeal({
          id: getActiveDealId() ?? createId('deal'),
        });
        setDeal(persist(reset));
      },
      startExample: () => {
        const created = persist(createSyntheticExampleDeal({ id: createId('deal') }));
        setDeal(created);
        return created;
      },
      exportJson: () => {
        const json = JSON.stringify({ version: deal.schemaVersion ?? 3, deal }, null, 2);
        localStorage.setItem('nyc-deal-analyzer.last-export', new Date().toISOString());
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${deal.name.replace(/[^\w]+/g, '-') || 'deal'}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      importJsonText: (json) => {
        const imported = localDealRepository.importJson(json);
        setDeal(imported);
        setActiveDealId(imported.id);
        setDeals(localDealRepository.list());
      },
    }),
    [
      analysis,
      deal,
      deals,
      persist,
      prefs.experienceMode,
      prefs.onboardingSeen,
      prefs.showCalculations,
      saveFlash,
      setExperienceMode,
      setOnboardingSeen,
      setShowCalculations,
      updateDeal,
    ],
  );

  return <DealContext.Provider value={value}>{children}</DealContext.Provider>;
}

export function useDeal(): DealContextValue {
  const ctx = useContext(DealContext);
  if (!ctx) throw new Error('useDeal must be used within DealProvider');
  return ctx;
}
