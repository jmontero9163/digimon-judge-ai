import { externalCardSchema } from '@digimon/contracts';
import type { ExternalCardDto } from '@digimon/contracts';

const API_URL = 'https://digimoncard.io/api-public/search';
const SERIES = 'Digimon Card Game';
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 50;
const MIN_REQUEST_INTERVAL_MS = 700;
const REQUEST_TIMEOUT_MS = 8000;
const MAX_RESULTS = 20;
const CARD_ID_PATTERN = /^[A-Z][A-Z0-9]*-[A-Z0-9]{2,4}$/i;

export const EXTERNAL_CARD_ATTRIBUTION = {
  name: 'DigimonCard.io',
  url: 'https://digimoncard.io/api-documentation/',
} as const;

export type ExternalSearchFailureReason = 'rate_limited' | 'timeout' | 'unavailable';

export type ExternalSearchResult =
  { ok: true; cards: ExternalCardDto[] } | { ok: false; reason: ExternalSearchFailureReason };

interface CacheEntry {
  expiresAt: number;
  result: ExternalSearchResult;
}

const cache = new Map<string, CacheEntry>();
let lastRequestStartedAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

export function resetExternalSearchStateForTests(): void {
  cache.clear();
  lastRequestStartedAt = 0;
  requestQueue = Promise.resolve();
}

function readCache(key: string): ExternalSearchResult | undefined {
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry.result;
}

function writeCache(key: string, result: ExternalSearchResult): void {
  cache.delete(key);
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) {
      cache.delete(oldest.value);
    }
  }
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result });
}

function scheduleExternalRequest<T>(task: () => Promise<T>): Promise<T> {
  const run = requestQueue.then(async () => {
    const waitMs = Math.max(0, lastRequestStartedAt + MIN_REQUEST_INTERVAL_MS - Date.now());
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    lastRequestStartedAt = Date.now();
    return task();
  });
  requestQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function searchExternalCards(term: string): Promise<ExternalSearchResult> {
  const trimmed = term.trim();
  const mode = CARD_ID_PATTERN.test(trimmed) ? 'id' : 'name';
  const cacheKey = `${mode}:${trimmed.toLowerCase()}`;

  const cached = readCache(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await scheduleExternalRequest(() => requestExternalCards(trimmed, mode));
  if (result.ok) {
    writeCache(cacheKey, result);
  }
  return result;
}

async function requestExternalCards(
  term: string,
  mode: 'id' | 'name',
): Promise<ExternalSearchResult> {
  const url = new URL(API_URL);
  url.searchParams.set(mode === 'id' ? 'card' : 'n', mode === 'id' ? term.toUpperCase() : term);
  url.searchParams.set('series', SERIES);
  url.searchParams.set('limit', String(MAX_RESULTS));

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DigimonJudgeAI-api/0.1 (+https://digimoncard.io/api-documentation/)',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    return { ok: false, reason: isTimeoutError(error) ? 'timeout' : 'unavailable' };
  }

  if (response.status === 429) {
    return { ok: false, reason: 'rate_limited' };
  }
  if (response.status === 400) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
    return isNoCardsFoundPayload(payload)
      ? { ok: true, cards: [] }
      : { ok: false, reason: 'unavailable' };
  }
  if (!response.ok) {
    return { ok: false, reason: 'unavailable' };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  if (!Array.isArray(payload)) {
    return { ok: false, reason: 'unavailable' };
  }

  const cards: ExternalCardDto[] = [];
  for (const item of payload) {
    const mapped = mapExternalCard(item);
    if (!mapped) {
      continue;
    }
    const parsed = externalCardSchema.safeParse(mapped);
    if (parsed.success) {
      cards.push(parsed.data);
    }
    if (cards.length >= MAX_RESULTS) {
      break;
    }
  }

  return { ok: true, cards };
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function isNoCardsFoundPayload(payload: unknown): boolean {
  const record = asRecord(payload);
  const message = optionalString(record?.error);
  return message?.toLowerCase().startsWith('no cards found') ?? false;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function optionalInteger(value: unknown): number | undefined {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim().length > 0
        ? Number(value)
        : Number.NaN;
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : undefined;
}

function optionalStringList(value: unknown): string[] | undefined {
  if (typeof value === 'string') {
    const single = optionalString(value);
    return single ? [single] : undefined;
  }
  if (!Array.isArray(value)) {
    return undefined;
  }
  const list = value
    .map((item) => optionalString(item))
    .filter((item): item is string => item !== undefined);
  return list.length > 0 ? list : undefined;
}

function mapExternalCard(value: unknown): Record<string, unknown> | undefined {
  const card = asRecord(value);
  if (!card) {
    return undefined;
  }

  const id = optionalString(card.id);
  const name = optionalString(card.name);
  if (!id || !name) {
    return undefined;
  }

  const type = optionalString(card.type);
  const color = optionalString(card.color);
  const color2 = optionalString(card.color2);
  const level = optionalInteger(card.level);
  const dp = optionalInteger(card.dp);
  const playCost = optionalInteger(card.play_cost);
  const evolutionCost = optionalInteger(card.evolution_cost);
  const form = optionalString(card.form);
  const attribute = optionalString(card.attribute);
  const rarity = optionalString(card.rarity);
  const digiType = optionalString(card.digi_type);
  const mainEffect = typeof card.main_effect === 'string' ? card.main_effect : undefined;
  const sourceEffect = typeof card.source_effect === 'string' ? card.source_effect : undefined;
  const altEffect = typeof card.alt_effect === 'string' ? card.alt_effect : undefined;
  const setName = optionalStringList(card.set_name);
  const series = optionalString(card.series);

  return {
    id,
    name,
    ...(type ? { type } : {}),
    ...(color ? { color } : {}),
    ...(color2 ? { color2 } : {}),
    ...(level !== undefined ? { level } : {}),
    ...(dp !== undefined ? { dp } : {}),
    ...(playCost !== undefined ? { play_cost: playCost } : {}),
    ...(evolutionCost !== undefined ? { evolution_cost: evolutionCost } : {}),
    ...(form ? { form } : {}),
    ...(attribute ? { attribute } : {}),
    ...(rarity ? { rarity } : {}),
    ...(digiType ? { digi_type: digiType } : {}),
    ...(mainEffect !== undefined ? { main_effect: mainEffect } : {}),
    ...(sourceEffect !== undefined ? { source_effect: sourceEffect } : {}),
    ...(altEffect !== undefined ? { alt_effect: altEffect } : {}),
    ...(setName ? { set_name: setName } : {}),
    ...(series ? { series } : {}),
  };
}
