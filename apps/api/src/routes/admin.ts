import { Hono } from 'hono';
import type { AccessVerifier } from '../middleware/auth';
import { requireAdmin } from '../middleware/auth';
import type { AppContext } from '../env';
import { errorResponse } from '../lib/errors';

export function createAdminRoutes(verifier?: AccessVerifier): Hono<AppContext> {
  const routes = new Hono<AppContext>();

  routes.use('*', requireAdmin({ verifier }));
  routes.all('*', (c) =>
    errorResponse(
      c,
      'not_implemented',
      'La administracion estara disponible en una etapa posterior.',
      501,
    ),
  );

  return routes;
}
