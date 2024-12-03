import { drizzle } from 'drizzle-orm/node-postgres';
import { POSTGRES_URL } from '../../config';

export const pg = drizzle(POSTGRES_URL!);
