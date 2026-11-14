import type { Context } from 'hono';
import type { ApiErrorResponse } from '@digimon/contracts';
import type { AppContext } from '../env';

type ErrorCode = ApiErrorResponse['error']['code'];
type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 501 | 502 | 503 | 504;

export function errorResponse(
  c: Context<AppContext>,
  code: ErrorCode,
  message: string,
  status: ErrorStatus,
  details?: unknown,
) {
  const requestId = c.get('requestId');
  const payload: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
    ...(requestId ? { requestId } : {}),
  };

  return c.json(payload, status);
}
