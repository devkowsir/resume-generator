import { RequestHandler } from 'express';
import { AuthService } from '../services/auth';
import { TLoginData, TSignupData } from '../types';

export class AuthController {
  public authService = new AuthService();

  public signup: RequestHandler = async (req, res, next) => {
    try {
      const newUser: TSignupData = req.body;
      const { user } = await this.authService.signup(newUser);
      res.status(201).json({ message: 'Signup successful.', user });
    } catch (error) {
      next(error);
    }
  };

  public login: RequestHandler = async (req, res, next) => {
    try {
      const credentials: TLoginData = req.body;
      const { user, authCookie } = await this.authService.login(credentials);
      res.setHeader('Set-Cookie', [authCookie]);
      res.status(200).json({ message: 'Login successful.', user });
    } catch (error) {
      next(error);
    }
  };

  public logout: RequestHandler = (req, res, next) => {
    try {
      const { authCookie } = this.authService.logout();
      res.setHeader('Set-Cookie', [authCookie]);
      res.status(200).json({ message: 'Logout successful.' });
    } catch (error) {
      next(error);
    }
  };
}
