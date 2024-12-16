import { RequestHandler } from 'express';
import { AuthService } from '../services/auth';
import { TSignupData } from '../types';

export class AuthController {
  public authService = new AuthService();

  public signup: RequestHandler = async (req, res, next) => {
    try {
      const newUser: TSignupData = req.body;
      const { user, cookie } = await this.authService.signup(newUser);
      res.setHeader('Set-Cookie', [cookie]);
      res.status(201).json({ message: 'Signup successful.', user });
    } catch (error) {
      next(error);
    }
  };
}
