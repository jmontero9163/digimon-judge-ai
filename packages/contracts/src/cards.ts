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
