import { z } from 'zod';
import { nonEmptyStringSchema, paginationSchema, timestampSchema } from './primitives';

export const apiErrorCodeSchema = z.enum([
  'bad_request',
  'unauthorized',
  'forbidden',
  'not_found',
  'not_implemented',
  'admin_auth_not_configured',
  'external_rate_limited',
  'external_timeout',
  'external_unavailable',
  'internal_error',
]);

export const apiErrorSchema = z.strictObject({
  code: apiErrorCodeSchema,
  message: nonEmptyStringSchema,
  details: z.unknown().optional(),
});

export const apiErrorResponseSchema = z.strictObject({
  error: apiErrorSchema,
  requestId: z.string().optional(),
});

export const healthResponseSchema = z.strictObject({
  status: z.literal('ok'),
  service: nonEmptyStringSchema,
  version: nonEmptyStringSchema,
  timestamp: timestampSchema,
});

export const listResponseSchema = <T extends z.ZodType>(item: T) =>
  z.strictObject({
    items: z.array(item),
    pagination: paginationSchema,
  });

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
