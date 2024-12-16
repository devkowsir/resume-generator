import { Router } from 'express';
import { AuthController } from '../controllers/auth';
import { validationMiddleware } from '../middlewares/validation';
import { loginSchema, signupSchema } from '../schemas/auth';

export class AuthRoute {
  public path = '/';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}signup`,
      validationMiddleware(signupSchema, 'body'),
      this.authController.signup,
    );

    this.router.post(
      `${this.path}login`,
      validationMiddleware(loginSchema, 'body'),
      this.authController.login,
    );
  }
}
