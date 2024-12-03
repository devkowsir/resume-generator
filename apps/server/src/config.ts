import { config } from 'dotenv';

config();

// prettier-ignore
export const {
PORT,
POSTGRES_URL,
SECRET_KEY,
ORIGIN,
CREDENTIALS,
NODE_ENV
} = process.env;
