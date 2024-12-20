import { Router } from 'express';
import { AuthController } from '../controllers/auth';
import { authMiddleware } from '../middlewares/auth';
import { validationMiddleware } from '../middlewares/validation';
import { loginSchema, signupSchema } from '../schemas/auth';

export class AuthRoute {
  public path = '/auth';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`/signup`, validationMiddleware(signupSchema, 'body'), this.authController.signup);

    this.router.post(`/login`, validationMiddleware(loginSchema, 'body'), this.authController.login);

    this.router.get(`/logout`, authMiddleware, this.authController.logout);
  }
}
