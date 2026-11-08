import { z } from 'zod';
import {
  citedSourceSchema,
  nonEmptyStringSchema,
  ruleStatusSchema,
  timestampSchema,
} from './primitives';

export const deterministicJudgementSchema = z.strictObject({
  kind: z.literal('deterministic'),
  status: ruleStatusSchema,
  answer: nonEmptyStringSchema,
  citations: z.array(citedSourceSchema).min(1),
  ruleIds: z.array(nonEmptyStringSchema).min(1),
});

export const aiGeneratedJudgementSchema = z.strictObject({
  kind: z.literal('ai_generated'),
  status: z.literal('generated'),
  answer: nonEmptyStringSchema,
  citations: z.array(citedSourceSchema).min(1),
  model: nonEmptyStringSchema,
  promptVersion: nonEmptyStringSchema,
  disclaimer: nonEmptyStringSchema,
  generatedAt: timestampSchema,
});

export const insufficientInformationJudgementSchema = z.strictObject({
  kind: z.literal('insufficient_information'),
  status: z.literal('pending'),
  answer: nonEmptyStringSchema,
  missingInformation: z.array(nonEmptyStringSchema).min(1),
  citations: z.array(citedSourceSchema).default([]),
});

export const judgementResultSchema = z.discriminatedUnion('kind', [
  deterministicJudgementSchema,
  aiGeneratedJudgementSchema,
  insufficientInformationJudgementSchema,
]);

export const judgementRequestSchema = z.strictObject({
  question: nonEmptyStringSchema.max(4000),
  cardIds: z.array(nonEmptyStringSchema).max(50).optional(),
  ruleIds: z.array(nonEmptyStringSchema).max(50).optional(),
});

export const aiAnswerRequestSchema = judgementRequestSchema;

export type JudgementResultDto = z.infer<typeof judgementResultSchema>;
export type JudgementRequestDto = z.infer<typeof judgementRequestSchema>;
