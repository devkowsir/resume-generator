import { config } from 'dotenv';

config();

// prettier-ignore
export const {
PORT,
POSTGRES_URL,
SECRET_KEY,
ORIGIN,
CREDENTIALS,
NODE_ENV,
GOOGLE_CLIENT_ID,
GOOGLE_CLIENT_SECRET,
REDIRECT_URI,
GMAIL,
PASSWORD,
} = process.env;
