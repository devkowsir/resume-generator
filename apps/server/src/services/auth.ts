import { compare, hash } from 'bcrypt';
import { and, eq } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';
import { NODE_ENV, SECRET_KEY } from '../config';
import { pg } from '../databases';
import { authentications, TUserData, users } from '../databases/postgres/schema';
import { HttpException } from '../exceptions/http';
import { TAccessTokenData, TGoogleUserData, TLoginData, TRefreshTokenData, TSignupData } from '../types';

export class AuthService {
  public signup = async (newUser: TSignupData) => {
    const [existingUser] = await pg.select().from(users).where(eq(users.email, newUser.email));
    if (existingUser) throw new HttpException(409, `This email ${newUser.email} already has associated user.`);
    const passwordHash = await hash(newUser.password, 10);
    let createdUser: TUserData | null = null;
    await pg.transaction(async (tx) => {
      [createdUser] = await tx.insert(users).values({ name: newUser.name, email: newUser.email }).returning();
      await tx.insert(authentications).values({ provider: 'email', userId: createdUser.id, passwordHash });
    });
    if (!createdUser) throw new HttpException(500, 'Something went wrong!');
    return AuthService.getTokenAndCookie(createdUser);
  };

  public login = async (credentials: TLoginData) => {
    const [{ users: user, authentications: authentication }] = await pg
      .select()
      .from(users)
      .where(eq(users.email, credentials.email))
      .innerJoin(authentications, eq(users.id, authentications.userId));
    if (!user || !authentication) throw new HttpException(401, `User not found with email ${credentials.email}`);
    if (!authentication.passwordHash) throw new HttpException(401, `This account cannot be accesed using password.`);
    const isValidPassword = await compare(credentials.password, authentication.passwordHash);
    if (!isValidPassword) throw new HttpException(401, `Invalid credentials.`);
    return AuthService.getTokenAndCookie(user);
  };

  public googleCallback = async (googleUserData: TGoogleUserData) => {
    let [{ users: user }] = await pg
      .select()
      .from(authentications)
      .where(and(eq(authentications.provider, 'google'), eq(authentications.providerId, googleUserData.id)))
      .innerJoin(users, eq(authentications.userId, users.id));
    if (!user) {
      await pg.transaction(async (tx) => {
        [user] = await tx.insert(users).values({ name: googleUserData.name, email: googleUserData.email }).returning();
        await tx.insert(authentications).values({ provider: 'google', userId: user.id, providerId: googleUserData.id });
      });
    } else if (user.name !== googleUserData.name || user.photo !== googleUserData.photo) {
      [user] = await pg
        .update(users)
        .set({ name: googleUserData.name, photo: googleUserData.photo })
        .where(eq(users.email, googleUserData.email))
        .returning();
    }
    return AuthService.getTokenAndCookie(user);
  };

  public logout = () => {
    return { cookie: `Authorization=; Max-Age=0`, accessToken: null };
  };

  public static createRefreshToken = (userData: TRefreshTokenData & { id: number | string }, maxAge: number) => {
    // sanitize unnecessary data.
    const tokenData: TRefreshTokenData = {
      email: userData.email,
    };
    return sign(tokenData, SECRET_KEY!, {
      expiresIn: maxAge,
      subject: `${userData.id}`,
    });
  };

  public static createAccessToken = (userData: TAccessTokenData & { id: number | string }) => {
    // sanitize unnecessary data.
    const tokenData: TAccessTokenData = {
      email: userData.email,
      name: userData.name,
      photo: userData.photo,
    };
    return sign(tokenData, SECRET_KEY!, {
      expiresIn: 60 * 60,
      subject: `${userData.id}`,
    });
  };

  public static createCookie = (token: string, expiresIn: number): string => {
    return `Authorization=${token}; HttpOnly; Max-Age=${expiresIn}${NODE_ENV == 'production' ? '; Secure' : ''}`;
  };

  public static getTokenAndCookie = (user: TUserData) => {
    const refreshTokenAge = 60 * 60 * 24 * 30;
    const refreshToken = AuthService.createRefreshToken(user, refreshTokenAge);
    const cookie = AuthService.createCookie(refreshToken, refreshTokenAge);
    const accessToken = AuthService.createAccessToken(user);
    return { cookie, accessToken };
  };
}
