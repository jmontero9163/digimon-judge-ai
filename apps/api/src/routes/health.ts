import { Hono } from 'hono';
import { healthResponseSchema } from '@digimon/contracts';
import type { AppContext } from '../env';

export const healthRoutes = new Hono<AppContext>();

healthRoutes.get('/', (c) => {
  const payload = healthResponseSchema.parse({
    status: 'ok',
    service: 'digimon-judge-ai-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });

  return c.json(payload);
});
