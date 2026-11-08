import { Hono } from 'hono';
import type { AccessVerifier } from '../middleware/auth';
import type { AppContext } from '../env';
import { createAdminRoutes } from './admin';
import { healthRoutes } from './health';
import { createNotImplementedRoutes } from './not-implemented';

export interface ApiRouteDependencies {
  adminVerifier?: AccessVerifier;
}

export function createApiRoutes(dependencies: ApiRouteDependencies = {}): Hono<AppContext> {
  const routes = new Hono<AppContext>();

  routes.route('/health', healthRoutes);
  routes.route('/cards', createNotImplementedRoutes('cartas'));
  routes.route('/rules', createNotImplementedRoutes('reglas y palabras clave'));
  routes.route('/judge', createNotImplementedRoutes('resolucion de interacciones'));
  routes.route('/decks', createNotImplementedRoutes('mazos'));
  routes.route('/history', createNotImplementedRoutes('historial de cambios'));
  routes.route('/admin', createAdminRoutes(dependencies.adminVerifier));

  return routes;
}
