import { and, eq, like } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { PORT } from '../config';
import { pg } from '../databases';
import { usersTable } from '../databases/postgres/schema';
import { TSignupData } from '../types';
import { fetchHelper } from '../utils/helpers';

const ServerUrl = `http://localhost:${PORT}`;

const getUser = (): TSignupData => ({
  name: `test-user`,
  email: `test-${Math.random()}@test.com`,
  password: '123456',
});

afterAll(async () => {
  await pg
    .delete(usersTable)
    .where(
      and(
        like(usersTable.email, 'test-%@test.com'),
        eq(usersTable.name, 'test-user'),
      ),
    );
});

describe('Authentication testing.', () => {
  describe('[POST] /signup', () => {
    const url = `${ServerUrl}/signup`;
    it('Valid Input', async () => {
      const { response } = await fetchHelper.post(url, getUser());
      expect(response.status).toBe(201);
      const cookieSetter = response.headers.get('Set-Cookie');
      expect(cookieSetter).toBeDefined();
      expect(cookieSetter?.startsWith('Authorization')).toBe(true);
    });
    it('Invalid Inputs', async () => {
      const validUser = getUser();
      const invalidBodies: Partial<TSignupData>[] = [
        {},
        { ...validUser, name: '' },
        { ...validUser, email: 'not-valid-email' },
        { ...validUser, password: '' },
      ];
      const responses = await Promise.all(
        invalidBodies.map((body) => fetchHelper.post(url, body)),
      );
      responses.forEach(({ response }) => expect(response.status).toBe(400));
    });
    it('Duplicate User', async () => {
      const user = getUser();
      await fetchHelper.post(url, user);
      const { response } = await fetchHelper.post(url, user);
      expect(response.status).toBe(409);
    });
  });
});
