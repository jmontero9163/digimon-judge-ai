import {
  cardDetailSchema,
  cardListItemSchema,
  externalCardSearchResponseSchema,
  healthResponseSchema,
} from '@digimon/contracts';
import type {
  ApiErrorResponse,
  CardDetailDto,
  CardListItemDto,
  ExternalCardSearchResponse,
} from '@digimon/contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export const EXTERNAL_CARD_SOURCE_URL = 'https://digimoncard.io/api-documentation/';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

async function parseError(response: Response): Promise<ApiError> {
  const fallback = new ApiError(`La API respondió con estado ${response.status}.`, response.status);

  try {
    const payload = (await response.json()) as Partial<ApiErrorResponse>;
    return new ApiError(
      payload.error?.message ?? fallback.message,
      response.status,
      payload.error?.code,
      payload.requestId,
    );
  } catch {
    return fallback;
  }
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return healthResponseSchema.parse(await response.json());
}

export interface CardSearchParams {
  q?: string;
  page?: number;
  perPage?: number;
  setId?: string;
  rarity?: string;
}

export interface CardListMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  next: number | null;
  prev: number | null;
}

export interface CardListResponse {
  cards: CardListItemDto[];
  meta: CardListMeta;
}

function parseMeta(raw: unknown, fallbackPage: number, fallbackPerPage: number): CardListMeta {
  const value = (raw ?? {}) as Partial<CardListMeta>;
  const page = Number(value.page ?? fallbackPage) || fallbackPage;
  const perPage = Number(value.per_page ?? fallbackPerPage) || fallbackPerPage;
  return {
    total: Number(value.total ?? 0) || 0,
    page,
    per_page: perPage,
    total_pages: Math.max(1, Number(value.total_pages ?? 1) || 1),
    next: typeof value.next === 'number' ? value.next : null,
    prev: typeof value.prev === 'number' ? value.prev : null,
  };
}

export async function fetchCards(params: CardSearchParams = {}): Promise<CardListResponse> {
  const search = new URLSearchParams();
  if (params.q) search.set('name', params.q);
  if (params.setId) search.set('set_id', params.setId);
  if (params.rarity) search.set('rarity', params.rarity);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  if (params.perPage) search.set('per_page', String(params.perPage));

  const query = search.toString();
  const response = await fetch(`${API_BASE_URL}/cards${query ? `?${query}` : ''}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as { cards?: unknown; meta?: unknown };
  const cards = cardListItemSchema.array().parse(payload.cards ?? []);
  const meta = parseMeta(payload.meta, params.page ?? 1, params.perPage ?? 20);

  return { cards, meta };
}

export async function fetchCard(id: string): Promise<CardDetailDto> {
  const response = await fetch(`${API_BASE_URL}/cards/${encodeURIComponent(id)}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return cardDetailSchema.parse(await response.json());
}

export async function fetchExternalCards(query: string): Promise<ExternalCardSearchResponse> {
  const search = new URLSearchParams({ query });

  const response = await fetch(`${API_BASE_URL}/cards/external?${search.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return externalCardSearchResponseSchema.parse(await response.json());
}
