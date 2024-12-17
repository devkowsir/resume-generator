import { and, eq, like } from 'drizzle-orm';
import { decode, sign } from 'jsonwebtoken';
import { afterAll, describe, expect, it } from 'vitest';
import { PORT, SECRET_KEY } from '../config';
import { pg } from '../databases';
import { usersTable } from '../databases/postgres/schema';
import { AuthService } from '../services/auth';
import { TSignupData, TTokenData } from '../types';
import { fetchHelper } from '../utils/helpers';

const ServerUrl = `http://localhost:${PORT}`;

const getUser = (): TSignupData => ({
  name: `test-user`,
  email: `test-${Math.random()}@test.com`,
  password: '123456',
});

const signupUrl = `${ServerUrl}/signup`;
const loginUrl = `${ServerUrl}/login`;
const logoutUrl = `${ServerUrl}/logout`;

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

  describe('[POST] /logout', () => {
    it('Valid Input', async () => {
      const user = getUser();
      await fetchHelper.post(signupUrl, user);
      const { response: loginResponse } = await fetchHelper.post(
        loginUrl,
        user,
      );
      const token = loginResponse.headers
        .get('Set-Cookie')
        ?.split(';')
        .filter((cookie) => cookie.startsWith('Authorization'))[0]
        ?.split('=')[1];
      expect(token).toBeTypeOf('string');
      const { response: logoutResponse } = await fetchHelper.get(logoutUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(logoutResponse.status).toBe(200);
    });
    it('Invalid token', async () => {
      const user = getUser();
      await fetchHelper.post(signupUrl, user);
      const { response: loginResponse } = await fetchHelper.post(
        loginUrl,
        user,
      );
      const token = loginResponse.headers
        .get('Set-Cookie')
        ?.split(';')
        .filter((cookie) => cookie.startsWith('Authorization'))[0]
        ?.split('=')[1];
      expect(token).toBeTypeOf('string');
      const tokenData = decode(token!) as TTokenData;
      const invalidToken = sign(tokenData, 'wrong-secret');
      const { response: logoutResponse } = await fetchHelper.get(logoutUrl, {
        headers: { Authorization: `Bearer ${invalidToken}` },
      });
      expect(logoutResponse.status).toBe(401);
    });
    it('Expired token', async () => {
      const user = getUser();
      await fetchHelper.post(signupUrl, user);
      const { response: loginResponse } = await fetchHelper.post(
        loginUrl,
        user,
      );
      const token = loginResponse.headers
        .get('Set-Cookie')
        ?.split(';')
        .filter((cookie) => cookie.startsWith('Authorization'))[0]
        ?.split('=')[1];
      expect(token).toBeTypeOf('string');
      const tokenData = decode(token!) as TTokenData;
      const expiresIn = 1;
      const expiredToken = AuthService.createToken(tokenData, expiresIn);
      await new Promise((res) => setTimeout(res, expiresIn * 1000));
      const { response: logoutResponse } = await fetchHelper.get(logoutUrl, {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      expect(logoutResponse.status).toBe(401);
    });
    it('Invalid token data', async () => {
      const user: TTokenData = {
        ...getUser(),
        id: Math.round(Math.random() * 1000),
        photo: null,
      };
      const token = sign(user, SECRET_KEY!, { expiresIn: '1h' });
      const { response } = await fetchHelper.get(logoutUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(401);
    });
  });
});
