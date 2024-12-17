import { compare, hash } from 'bcrypt';
import { eq } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';
import { NODE_ENV, SECRET_KEY } from '../config';
import { pg } from '../databases';
import { usersTable } from '../databases/postgres/schema';
import { HttpException } from '../exceptions/http';
import { TLoginData, TSignupData, TTokenData } from '../types';

export class AuthService {
  public signup = async (newUser: TSignupData) => {
    const findUser = await pg
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, newUser.email));

    if (findUser.length) {
      throw new HttpException(
        409,
        `This email ${newUser.email} alredy has associated user.`,
      );
    }

    const hashedPassword = await hash(newUser.password, 10);
    const createdUser = await pg
      .insert(usersTable)
      .values({
        name: newUser.name,
        email: newUser.email,
        password: hashedPassword,
      })
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        photo: usersTable.photo,
      });
    const user = createdUser[0];

    return { user };
  };

  public login = async (credentials: TLoginData) => {
    const findUser = await pg
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, credentials.email));
    const user = findUser[0];

    if (!user) throw new HttpException(401, `Invalid credentials.`);

    const isValidPassword = await compare(
      credentials.password,
      user.password ?? '',
    );
    if (!isValidPassword) throw new HttpException(401, `Invalid credentials.`);

    const maxAge = 60 * 60;
    const authToken = AuthService.createToken(user, maxAge);
    const authCookie = AuthService.createCookie(authToken, maxAge);

    return { authCookie, user };
  };

  public static createToken = (userData: TTokenData, maxAge: number) => {
    // sanitize unnecessary data.
    const tokenData: TTokenData = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      photo: userData.photo,
    };
    return sign(tokenData, SECRET_KEY!, { expiresIn: maxAge });
  };

  public static createCookie = (token: string, expiresIn: number): string => {
    return `Authorization=${token}; HttpOnly; Max-Age=${expiresIn}${NODE_ENV == 'production' ? '; Secure' : ''}`;
  };
}
