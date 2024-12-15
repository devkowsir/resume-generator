import { drizzle } from 'drizzle-orm/node-postgres';
import { POSTGRES_URL } from '../../config';
import * as schema from './schema';

export const pg = drizzle(POSTGRES_URL!, { schema });
