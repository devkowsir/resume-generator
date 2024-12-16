import { z } from 'zod';
import { signupSchema } from '../schemas/auth';

export type TTokenData = {
  id: number;
  name: string;
  email: string;
  photo: string | null;
};

export type TSignupData = z.infer<typeof signupSchema>;
