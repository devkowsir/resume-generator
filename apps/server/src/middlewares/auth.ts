import { and, eq } from 'drizzle-orm';
import { RequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError, verify } from 'jsonwebtoken';
import { SECRET_KEY } from '../config';
import { pg } from '../databases';
import { usersTable } from '../databases/postgres/schema';
import { HttpException } from '../exceptions/http';
import { TTokenData } from '../types';

export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const token =
      req.cookies['Authorization'] ||
      (req.header('Authorization')
        ? req.header('Authorization')?.split('Bearer ')[1]
        : null);

    if (!token) {
      return next(new HttpException(401, 'Authentication token missing.'));
    }

    const tokenData = verify(token, SECRET_KEY!) as TTokenData;
    const findUser = await pg
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.email, tokenData.email),
          eq(usersTable.id, tokenData.id),
        ),
      );
    if (!findUser.length) {
      return next(new HttpException(401, 'Wrong authentication token.'));
    }

    req.user = findUser[0];
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(new HttpException(401, 'Authorization token expired.'));
    } else if (error instanceof JsonWebTokenError) {
      return next(new HttpException(401, 'Wrong authentication token.'));
    }
    next(new HttpException(500, 'Something went wrong in auth middleware.'));
  }
};
