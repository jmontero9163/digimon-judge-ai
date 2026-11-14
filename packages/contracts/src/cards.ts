import { z } from 'zod';
import {
  cardIdentifierSchema,
  nonEmptyStringSchema,
  ruleStatusSchema,
  sourceReferenceSchema,
} from './primitives';

export const cardEffectKindSchema = z.enum(['main', 'inherited', 'security', 'alternate', 'other']);

export const cardSummarySchema = z.strictObject({
  id: cardIdentifierSchema,
  name: nonEmptyStringSchema,
  setCode: nonEmptyStringSchema.optional(),
  imageUrl: z.url().optional(),
  status: ruleStatusSchema,
  source: sourceReferenceSchema,
});

export const cardEffectSchema = z.strictObject({
  id: nonEmptyStringSchema,
  cardId: cardIdentifierSchema,
  kind: cardEffectKindSchema,
  officialText: nonEmptyStringSchema,
  source: sourceReferenceSchema,
});

export type CardSummaryDto = z.infer<typeof cardSummarySchema>;
export type CardEffectDto = z.infer<typeof cardEffectSchema>;

export const searchCardParamsSchema = z.strictObject({
  name: nonEmptyStringSchema.optional(),
  set_id: nonEmptyStringSchema.optional(),
  rarity: nonEmptyStringSchema.optional(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
});

export type SearchCardParams = z.infer<typeof searchCardParamsSchema>;

export const cardListItemSchema = z.strictObject({
  id: cardIdentifierSchema,
  name: nonEmptyStringSchema,
  name_en: z.string().trim().optional(),
  name_ja: z.string().trim().optional(),
  rarity: z.string().optional(),
  card_type: z.string().optional(),
  level: z.number().int().optional(),
  dp: z.number().int().optional(),
  set: z
    .object({
      code: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  image_url: z.string().url().optional(),
});

export type CardListItemDto = z.infer<typeof cardListItemSchema>;

export const cardDetailSchema = z.strictObject({
  id: cardIdentifierSchema,
  name: nonEmptyStringSchema,
  name_en: z.string().trim().optional(),
  name_ja: z.string().trim().optional(),
  rarity: z.string().optional(),
  card_type: z.string().optional(),
  level: z.number().int().optional(),
  dp: z.number().int().optional(),
  set: z
    .object({
      code: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  official_text: z.string(),
  source_id: z.string(),
  source_version_id: z.string().optional(),
  images: z
    .array(
      z.object({
        id: z.string(),
        url: z.string().url(),
        type: z.enum(['original', 'alternate', 'promotional', 'other']),
      }),
    )
    .default([]),
  created_at: z.number().int(),
  updated_at: z.number().int(),
});

export type CardDetailDto = z.infer<typeof cardDetailSchema>;

export const externalCardQuerySchema = z.strictObject({
  query: z.string().trim().min(2).max(64),
});

export const externalAttributionSchema = z.strictObject({
  name: nonEmptyStringSchema,
  url: z.url(),
});

export const externalCardSchema = z.strictObject({
  id: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  type: nonEmptyStringSchema.optional(),
  color: nonEmptyStringSchema.optional(),
  color2: nonEmptyStringSchema.optional(),
  level: z.number().int().optional(),
  dp: z.number().int().optional(),
  play_cost: z.number().int().optional(),
  evolution_cost: z.number().int().optional(),
  form: nonEmptyStringSchema.optional(),
  attribute: nonEmptyStringSchema.optional(),
  rarity: nonEmptyStringSchema.optional(),
  digi_type: nonEmptyStringSchema.optional(),
  main_effect: z.string().optional(),
  source_effect: z.string().optional(),
  alt_effect: z.string().optional(),
  set_name: z.array(nonEmptyStringSchema).optional(),
  series: nonEmptyStringSchema.optional(),
});

export const externalCardSearchResponseSchema = z.strictObject({
  cards: z.array(externalCardSchema),
  attribution: externalAttributionSchema,
});

export type ExternalCardDto = z.infer<typeof externalCardSchema>;
export type ExternalCardSearchResponse = z.infer<typeof externalCardSearchResponseSchema>;
export type ExternalCardQuery = z.infer<typeof externalCardQuerySchema>;
