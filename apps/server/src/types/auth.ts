import { z } from 'zod';
import { loginSchema, signupSchema } from '../schemas/auth';

export type TTokenData = {
  id: number;
  name: string;
  email: string;
  photo: string | null;
};

export type TSignupData = z.infer<typeof signupSchema>;
export type TLoginData = z.infer<typeof loginSchema>;
