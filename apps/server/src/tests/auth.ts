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

const signupUrl = `${ServerUrl}/signup`;
const loginUrl = `${ServerUrl}/login`;

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
    it('Valid Input', async () => {
      const { response } = await fetchHelper.post(signupUrl, getUser());
      expect(response.status).toBe(201);
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
        invalidBodies.map((body) => fetchHelper.post(signupUrl, body)),
      );
      responses.forEach(({ response }) => expect(response.status).toBe(400));
    });
    it('Duplicate User', async () => {
      const user = getUser();
      await fetchHelper.post(signupUrl, user);
      const { response } = await fetchHelper.post(signupUrl, user);
      expect(response.status).toBe(409);
    });
  });

  describe('[POST] /login', () => {
    it('Valid Input', async () => {
      const user = getUser();
      await fetchHelper.post(signupUrl, user);
      const { response, data } = await fetchHelper.post(loginUrl, user);
      expect(response.status).toBe(200);
      expect(data).toBeDefined();
      const cookieSetter = response.headers.get('Set-Cookie');
      expect(cookieSetter).toBeDefined();
      expect(cookieSetter?.startsWith('Authorization')).toBe(true);
    });
    it('Invalid Inputs', async () => {
      const validUser = getUser();
      const invalidBodies: Partial<TSignupData>[] = [
        {},
        { ...validUser, email: 'not-valid-email' },
        { ...validUser, password: '' },
      ];
      const responses = await Promise.all(
        invalidBodies.map((body) => fetchHelper.post(loginUrl, body)),
      );
      responses.forEach(({ response }) => expect(response.status).toBe(400));
    });
    it('Invalid Credentials', async () => {
      const user = getUser();
      await fetchHelper.post(signupUrl, user);
      const { response } = await fetchHelper.post(loginUrl, {
        ...user,
        password: 'wrong-password',
      });
      expect(response.status).toBe(401);
    });
  });
});
