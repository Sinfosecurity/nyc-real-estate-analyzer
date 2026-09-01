import type { Deal, DealRepository } from '../models';
import { createBlankDeal } from '../constants/defaults';
import { createId } from '../utils/id';
import { CURRENT_SCHEMA_VERSION, migrateDeal, validateImportJson } from './migrate';

const STORAGE_KEY = 'nyc-deal-analyzer.v2.deals';
const ACTIVE_KEY = 'nyc-deal-analyzer.v2.active';
const QUARANTINE_KEY = 'nyc-deal-analyzer.quarantine';

interface PersistedShape {
  version: number;
  deals: unknown[];
}

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

function quarantine(payload: unknown): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(
      QUARANTINE_KEY,
      JSON.stringify({ savedAt: new Date().toISOString(), payload }),
    );
  } catch {
    /* ignore quota */
  }
}

function readAll(): Deal[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedShape;
    if (!parsed || !Array.isArray(parsed.deals)) {
      quarantine(parsed);
      return [];
    }
    return parsed.deals.map((item) => migrateDeal(item));
  } catch {
    return [];
  }
}

function writeAll(deals: Deal[]): void {
  if (!canUseStorage()) return;
  const payload: PersistedShape = { version: CURRENT_SCHEMA_VERSION, deals };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export const localDealRepository: DealRepository = {
  list() {
    return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  get(id) {
    return readAll().find((deal) => deal.id === id) ?? null;
  },

  save(deal) {
    const deals = readAll();
    const next: Deal = migrateDeal({ ...deal, updatedAt: new Date().toISOString() });
    const index = deals.findIndex((item) => item.id === next.id);
    if (index >= 0) deals[index] = next;
    else deals.push(next);
    writeAll(deals);
    return next;
  },

  delete(id) {
    writeAll(readAll().filter((deal) => deal.id !== id));
    if (canUseStorage() && localStorage.getItem(ACTIVE_KEY) === id) {
      localStorage.removeItem(ACTIVE_KEY);
    }
  },

  duplicate(id) {
    const source = this.get(id);
    if (!source) return null;
    const copy: Deal = {
      ...structuredClone(source),
      id: createId('deal'),
      name: `${source.name} (copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.save(copy);
  },

  rename(id, name) {
    const deal = this.get(id);
    if (!deal) return null;
    return this.save({ ...deal, name });
  },

  exportJson(id) {
    const deal = this.get(id);
    if (!deal) return null;
    return JSON.stringify({ version: CURRENT_SCHEMA_VERSION, deal }, null, 2);
  },

  importJson(json) {
    const parsed = validateImportJson(json) as { deal?: unknown; version?: number };
    const incoming = parsed.deal ?? parsed;
    const deal = migrateDeal(incoming);
    deal.id = createId('deal');
    deal.createdAt = new Date().toISOString();
    deal.updatedAt = new Date().toISOString();
    deal.name = deal.name ? `${deal.name} (imported)` : 'Imported deal';
    return this.save(deal);
  },
};

export function getActiveDealId(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveDealId(id: string): void {
  if (!canUseStorage()) return;
  localStorage.setItem(ACTIVE_KEY, id);
}

export function ensureSeedDeal(): Deal {
  const existing = localDealRepository.list();
  if (existing.length > 0) {
    const active = getActiveDealId();
    return existing.find((deal) => deal.id === active) ?? existing[0];
  }
  const seeded = createBlankDeal();
  localDealRepository.save(seeded);
  setActiveDealId(seeded.id);
  return seeded;
}

export function exportBackupReminderDue(lastExport?: string): boolean {
  if (!lastExport) return true;
  const then = new Date(lastExport).getTime();
  if (!Number.isFinite(then)) return true;
  return Date.now() - then > 7 * 24 * 60 * 60 * 1000;
}
