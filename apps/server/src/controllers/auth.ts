import { RequestHandler } from 'express';
import { AuthService } from '../services/auth';
import { TGoogleUserData, TLoginData, TSignupData } from '../types';

export class AuthController {
  public authService = new AuthService();

  public signup: RequestHandler = async (req, res, next) => {
    try {
      const newUser: TSignupData = req.body;
      const { accessToken, cookie } = await this.authService.signup(newUser);
      res.setHeader('Set-Cookie', [cookie]);
      res.status(201).json({ accessToken });
    } catch (error) {
      next(error);
    }
  };

  public login: RequestHandler = async (req, res, next) => {
    try {
      const credentials: TLoginData = req.body;
      const { accessToken, cookie } = await this.authService.login(credentials);
      res.setHeader('Set-Cookie', [cookie]);
      res.status(200).json({ accessToken });
    } catch (error) {
      next(error);
    }
  };

  public googleCallback: RequestHandler = async (req, res, next) => {
    try {
      const userData = req.user as unknown as TGoogleUserData;
      const { accessToken, cookie } = await this.authService.googleCallback(userData);
      res.setHeader('Set-Cookie', [cookie]);
      res.status(200).json({ accessToken });
    } catch (error) {
      next(error);
    }
  };

  public logout: RequestHandler = (req, res, next) => {
    try {
      const { accessToken, cookie } = this.authService.logout();
      res.setHeader('Set-Cookie', [cookie]);
      res.status(200).json({ accessToken });
    } catch (error) {
      next(error);
    }
  };
}
