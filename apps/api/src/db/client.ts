import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@digimon/db/schema';
import type { AppEnv } from '../env';

export function createDb(env: AppEnv) {
  return drizzle(env.DB, { schema });
}
