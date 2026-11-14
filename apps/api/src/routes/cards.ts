import { Hono } from 'hono';
import {
  cardDetailSchema,
  externalCardQuerySchema,
  externalCardSearchResponseSchema,
} from '@digimon/contracts';
import type { AppContext } from '../env';
import { searchExternalCards, EXTERNAL_CARD_ATTRIBUTION } from '../lib/digimoncard';
import { errorResponse } from '../lib/errors';

interface CardListRow {
  id: string;
  name: string;
  name_en: string | null;
  rarity: string | null;
  card_type: string | null;
  level: number | null;
  dp: number | null;
  image_url: string | null;
  set_code: string | null;
  set_name: string | null;
}

interface CardDetailRow extends CardListRow {
  official_text: string | null;
  source_id: string;
  source_version_id: string | null;
  created_at: number;
  updated_at: number;
}

interface CardImageRow {
  id: string;
  url: string;
  type: 'original' | 'alternate' | 'promotional' | 'other';
}

interface CountRow {
  total: number;
}

const idPattern = /^[A-Z][A-Z0-9]*-[A-Z0-9]{2,4}$/i;

export const createCardRoutes = (): Hono<AppContext> => {
  const routes = new Hono<AppContext>();

  routes.get('/', async (c) => {
    if (typeof c.env.DB.prepare !== 'function') {
      return c.json({ error: { code: 'not_implemented', message: 'Etapa no autorizada' } }, 501);
    }

    const name = c.req.query('name')?.trim();
    const setId = c.req.query('set_id')?.trim();
    const rarity = c.req.query('rarity')?.trim();
    const page = Math.max(1, Number(c.req.query('page') ?? 1) || 1);
    const perPage = Math.min(100, Math.max(1, Number(c.req.query('per_page') ?? 20) || 20));

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (name) {
      conditions.push('(LOWER(cards.name) LIKE LOWER(?) OR LOWER(cards.id) LIKE LOWER(?))');
      params.push(`%${name}%`, `%${name}%`);
    }
    if (setId) {
      conditions.push('cards.set_id = ?');
      params.push(setId);
    }
    if (rarity) {
      conditions.push('cards.rarity = ?');
      params.push(rarity);
    }

    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * perPage;

    const countResult = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM cards${where}`)
      .bind(...params)
      .all<CountRow>();
    const total = Number(countResult.results[0]?.total ?? 0);

    const listResult = await c.env.DB.prepare(
      `SELECT cards.id, cards.name, cards.name_en, cards.rarity, cards.card_type, cards.level, cards.dp, cards.image_url, card_sets.code AS set_code, card_sets.name AS set_name
       FROM cards
       LEFT JOIN card_sets ON cards.set_id = card_sets.id${where}
       ORDER BY cards.created_at DESC, cards.id ASC
       LIMIT ? OFFSET ?`,
    )
      .bind(...params, perPage, offset)
      .all<CardListRow>();

    const cards = (listResult.results ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      ...(row.name_en ? { name_en: row.name_en } : {}),
      ...(row.rarity ? { rarity: row.rarity } : {}),
      ...(row.card_type ? { card_type: row.card_type } : {}),
      ...(row.level !== null ? { level: Number(row.level) } : {}),
      ...(row.dp !== null ? { dp: Number(row.dp) } : {}),
      ...(row.image_url ? { image_url: row.image_url } : {}),
      ...(row.set_code || row.set_name
        ? {
            set: {
              ...(row.set_code ? { code: row.set_code } : {}),
              ...(row.set_name ? { name: row.set_name } : {}),
            },
          }
        : {}),
    }));

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return c.json({
      cards,
      meta: {
        total,
        page,
        per_page: perPage,
        total_pages: totalPages,
        next: page < totalPages ? page + 1 : null,
        prev: page > 1 ? page - 1 : null,
      },
    });
  });

  routes.get('/external', async (c) => {
    const parsed = externalCardQuerySchema.safeParse({
      query: (c.req.query('query') ?? '').trim(),
    });

    if (!parsed.success) {
      return errorResponse(
        c,
        'bad_request',
        'La consulta externa debe tener entre 2 y 64 caracteres.',
        400,
      );
    }

    const result = await searchExternalCards(parsed.data.query);

    if (!result.ok) {
      if (result.reason === 'rate_limited') {
        return errorResponse(
          c,
          'external_rate_limited',
          'La fuente externa alcanzó su límite de solicitudes. Intenta más tarde.',
          429,
        );
      }
      if (result.reason === 'timeout') {
        return errorResponse(
          c,
          'external_timeout',
          'La fuente externa no respondió a tiempo.',
          504,
        );
      }
      return errorResponse(
        c,
        'external_unavailable',
        'No se pudo consultar la fuente externa.',
        502,
      );
    }

    return c.json(
      externalCardSearchResponseSchema.parse({
        cards: result.cards,
        attribution: EXTERNAL_CARD_ATTRIBUTION,
      }),
    );
  });

  routes.get('/:id', async (c) => {
    if (typeof c.env.DB.prepare !== 'function') {
      return c.json({ error: { code: 'not_implemented', message: 'Etapa no autorizada' } }, 501);
    }

    const id = (c.req.param('id') ?? '').trim();

    if (!idPattern.test(id)) {
      return c.json({ error: { code: 'bad_request', message: 'ID de carta inválido' } }, 400);
    }

    const cardResult = await c.env.DB.prepare(
      `SELECT cards.id, cards.name, cards.name_en, cards.rarity, cards.card_type, cards.level, cards.dp, cards.image_url, cards.official_text, cards.source_id, cards.source_version_id, cards.created_at, cards.updated_at, card_sets.code AS set_code, card_sets.name AS set_name
       FROM cards
       LEFT JOIN card_sets ON cards.set_id = card_sets.id
       WHERE cards.id = ?`,
    )
      .bind(id)
      .all<CardDetailRow>();

    const row = cardResult.results[0];

    if (!row) {
      return c.json({ error: { code: 'not_found', message: 'Carta no encontrada' } }, 404);
    }

    const imagesResult = await c.env.DB.prepare(
      `SELECT id, url, type FROM card_images WHERE card_id = ? ORDER BY created_at ASC, id ASC`,
    )
      .bind(id)
      .all<CardImageRow>();

    const images = (imagesResult.results ?? []).map((image) => ({
      id: image.id,
      url: image.url,
      type: image.type,
    }));

    if (images.length === 0 && row.image_url) {
      images.push({ id: row.id, url: row.image_url, type: 'original' });
    }

    const parsed = cardDetailSchema.safeParse({
      id: row.id,
      name: row.name,
      ...(row.name_en ? { name_en: row.name_en } : {}),
      ...(row.rarity ? { rarity: row.rarity } : {}),
      ...(row.card_type ? { card_type: row.card_type } : {}),
      ...(row.level !== null ? { level: Number(row.level) } : {}),
      ...(row.dp !== null ? { dp: Number(row.dp) } : {}),
      ...(row.set_code || row.set_name
        ? {
            set: {
              ...(row.set_code ? { code: row.set_code } : {}),
              ...(row.set_name ? { name: row.set_name } : {}),
            },
          }
        : {}),
      official_text: row.official_text ?? '',
      source_id: row.source_id,
      ...(row.source_version_id ? { source_version_id: row.source_version_id } : {}),
      images,
      created_at: Number(row.created_at),
      updated_at: Number(row.updated_at),
    });

    if (!parsed.success) {
      return c.json(
        { error: { code: 'internal_error', message: 'Respuesta de carta inválida' } },
        500,
      );
    }

    return c.json(parsed.data);
  });

  return routes;
};
