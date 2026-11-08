import { healthResponseSchema } from '@digimon/contracts';
import type { ApiErrorResponse } from '@digimon/contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

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
