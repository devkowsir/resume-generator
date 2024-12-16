import { Router } from 'express';
export * from './auth';

export type TRoute = {
  path?: string;
  router: Router;
};
