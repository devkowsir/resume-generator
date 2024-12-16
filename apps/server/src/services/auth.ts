import { hash } from 'bcrypt';
import { eq } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';
import { SECRET_KEY } from '../config';
import { pg } from '../databases';
import { usersTable } from '../databases/postgres/schema';
import { HttpException } from '../exceptions/http';
import { TSignupData, TTokenData } from '../types';

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

    const { expiresIn, token } = this.createToken(createdUser[0]);
    const cookie = this.createCookie(token, expiresIn);

    return { cookie, user: createdUser[0] };
  };

  public createToken(userData: TTokenData) {
    const secretKey: string = SECRET_KEY!;
    const expiresIn: number = 60 * 60;

    return { expiresIn, token: sign(userData, secretKey, { expiresIn }) };
  }

  public createCookie(token: string, expiresIn: number): string {
    return `Authorization=${token}; HttpOnly; Max-Age=${expiresIn};`;
  }
}
