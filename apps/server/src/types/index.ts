import { Router } from 'express';

export type TRoute = {
  path?: string;
  router: Router;
};
