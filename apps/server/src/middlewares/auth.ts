import { RequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError, verify } from 'jsonwebtoken';
import { SECRET_KEY } from '../config';
import { HttpException } from '../exceptions/http';
import { TAccessTokenData } from '../types';

export const authMiddleware: RequestHandler = (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.split('Bearer ')[1];
    if (!accessToken) return next(new HttpException(401, 'Invalid token.'));
    req.user = verify(accessToken, SECRET_KEY!) as TAccessTokenData;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(new HttpException(401, 'Token expired.'));
    } else if (error instanceof JsonWebTokenError) {
      return next(new HttpException(401, 'Wrong authentication token.'));
    }
    next(new HttpException(500, 'Something went wrong in auth middleware.'));
  }
};
