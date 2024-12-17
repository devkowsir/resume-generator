import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { CREDENTIALS, NODE_ENV, ORIGIN, PORT } from './config';
import { errorMiddleware } from './middlewares/error';
import { TRoute } from './types';

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: TRoute[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3000;

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log('Server started on port', this.port);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(
      cors({
        origin: [ORIGIN!],
        credentials: CREDENTIALS == 'true',
      }),
    );
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeRoutes(routes: TRoute[]) {
    routes.forEach((route) => {
      this.app.use('/', route.router);
    });
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default App;
