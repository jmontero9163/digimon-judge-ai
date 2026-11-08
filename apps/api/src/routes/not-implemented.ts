import { Hono } from 'hono';
import type { AppContext } from '../env';
import { errorResponse } from '../lib/errors';

export function createNotImplementedRoutes(moduleName: string): Hono<AppContext> {
  const routes = new Hono<AppContext>();

  routes.all('*', (c) =>
    errorResponse(
      c,
      'not_implemented',
      `El modulo de ${moduleName} todavia no esta implementado en la Etapa 1.`,
      501,
    ),
  );

  return routes;
}
