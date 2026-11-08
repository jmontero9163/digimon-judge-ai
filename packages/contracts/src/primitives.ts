import { CARD_IDENTIFIER_PATTERN, RULE_STATUSES, SOURCE_KINDS } from '@digimon/domain';
import { z } from 'zod';

export const ruleStatusSchema = z.enum(RULE_STATUSES);
export const sourceKindSchema = z.enum(SOURCE_KINDS);
export const cardIdentifierSchema = z.string().trim().regex(CARD_IDENTIFIER_PATTERN);
export const timestampSchema = z.iso.datetime();
export const nonEmptyStringSchema = z.string().trim().min(1);

export const sourceReferenceSchema = z.strictObject({
  sourceId: nonEmptyStringSchema,
  sourceKind: sourceKindSchema.optional(),
  title: nonEmptyStringSchema.optional(),
  url: z.url().optional(),
  verifiedAt: timestampSchema.optional(),
  version: nonEmptyStringSchema.optional(),
});

export const citedSourceSchema = sourceReferenceSchema.extend({
  excerpt: nonEmptyStringSchema.optional(),
});

export const paginationSchema = z.strictObject({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().min(0).optional(),
});
