import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import type { AppContext } from './env';
import { errorResponse } from './lib/errors';
import type { AccessVerifier } from './middleware/auth';
import { createApiRoutes } from './routes';

export interface AppDependencies {
  adminVerifier?: AccessVerifier;
}

export function createApp(dependencies: AppDependencies = {}): Hono<AppContext> {
  const app = new Hono<AppContext>();

  app.use('*', requestId());
  app.use('*', secureHeaders());
  app.use('*', logger());

  app.route('/api/v1', createApiRoutes(dependencies));

  app.notFound((c) => errorResponse(c, 'not_found', 'La ruta solicitada no existe.', 404));

  app.onError((error, c) => {
    console.error('Unhandled API error', error);
    return errorResponse(c, 'internal_error', 'Error interno del servidor.', 500);
  });

  return app;
}
