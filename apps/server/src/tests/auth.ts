import { and, eq, like } from 'drizzle-orm';
import { decode, sign } from 'jsonwebtoken';
import { afterAll, describe, expect, it } from 'vitest';
import { PORT, SECRET_KEY } from '../config';
import { pg } from '../databases';
import { users } from '../databases/postgres/schema';
import { TAccessTokenData, TSignupData } from '../types';
import { fetchHelper } from '../utils/helpers';

const ServerUrl = `http://localhost:${PORT}`;

const getUser = (): TSignupData => ({
  name: `test-user`,
  email: `test-${Math.random()}@test.com`,
  password: '123456',
});

const signupUrl = `${ServerUrl}/auth/signup`;
const loginUrl = `${ServerUrl}/auth/login`;
const logoutUrl = `${ServerUrl}/auth/logout`;

const getAuthToken = (cookie: string) => cookie.replace(/.*Authorization=([^;]*);.*/, '$1');

afterAll(async () => {
  await pg.delete(users).where(and(like(users.email, 'test-%@test.com'), eq(users.name, 'test-user')));
});

describe('Authentication testing.', () => {
  describe('[POST] /signup', () => {
    it('Valid Input', async () => {
      const { response, data } = await fetchHelper.post(signupUrl, getUser());
      expect(response.status).toBe(201);
      expect(data.accessToken).toBeTypeOf('string');
      expect(getAuthToken(response.headers.get('Set-Cookie') ?? '').length).toBeGreaterThan(0);
    });
    it('Invalid Inputs', async () => {
      const validUser = getUser();
      const invalidBodies: Partial<TSignupData>[] = [
        {},
        { ...validUser, name: '' },
        { ...validUser, email: 'not-valid-email' },
        { ...validUser, password: '' },
      ];
      const responses = await Promise.all(invalidBodies.map((body) => fetchHelper.post(signupUrl, body)));
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
      expect(data.accessToken).toBeTypeOf('string');
      expect(getAuthToken(response.headers.get('Set-Cookie') ?? '').length).toBeGreaterThan(0);
    });
    it('Invalid Inputs', async () => {
      const validUser = getUser();
      const invalidUsers: Partial<TSignupData>[] = [
        {},
        { ...validUser, email: 'not-valid-email' },
        { ...validUser, password: '' },
      ];
      const responses = await Promise.all(invalidUsers.map((body) => fetchHelper.post(loginUrl, body)));
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

  describe('[GET] /logout', () => {
    it('Valid Input', async () => {
      const { data } = await fetchHelper.post(signupUrl, getUser());
      const { response, data: logoutData } = await fetchHelper.get(logoutUrl, {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      expect(response.status).toBe(200);
      expect(getAuthToken(response.headers.get('Set-Cookie') ?? '').length).toBe(0);
      expect(logoutData.accessToken).toBe(null);
    });
    it('Invalid token', async () => {
      const user = getUser();
      await fetchHelper.post(signupUrl, user);
      const { response: loginResponse } = await fetchHelper.post(loginUrl, user);
      const token = getAuthToken(loginResponse.headers.get('Set-Cookie') ?? '');
      const tokenData = decode(token!) as TAccessTokenData;
      const invalidToken = sign(tokenData, 'wrong-secret');
      const { response: logoutResponse } = await fetchHelper.get(logoutUrl, {
        headers: { Authorization: `Bearer ${invalidToken}` },
      });
      expect(logoutResponse.status).toBe(401);
    });
    it('Expired token', async () => {
      const user = getUser();
      await fetchHelper.post(signupUrl, user);
      const { response: loginResponse } = await fetchHelper.post(loginUrl, user);
      const token = getAuthToken(loginResponse.headers.get('Set-Cookie') ?? '');
      expect(token).toBeTypeOf('string');
      const expiresIn = 1;
      const expiredToken = sign(user, SECRET_KEY!, { expiresIn });
      await new Promise((res) => setTimeout(res, expiresIn * 1000));
      const { response: logoutResponse } = await fetchHelper.get(logoutUrl, {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      expect(logoutResponse.status).toBe(401);
    });
  });

  // Mannyally test the google oauth callback route.
  // Paste the following link in the browser to test.
  // In response you will get an access token in body and refresh token in cookies.
  // https://accounts.google.com/o/oauth2/v2/auth?client_id=157906123910-kvgo88dt6fuh0u3isqmj9tq8obascud4.apps.googleusercontent.com&redirect_uri=http://localhost:5000/auth/callback/google&response_type=code&scope=openid%20email%20profile&access_type=offline&state=abc
});
