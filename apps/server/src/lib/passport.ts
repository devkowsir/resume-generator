import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI } from '../config';
import { TGoogleUserData } from '../types';

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
      callbackURL: REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      const userData: TGoogleUserData = {
        id: profile.id,
        name: profile._json.name!,
        email: profile._json.email!,
        photo: profile._json.picture!,
      };
      done(null, userData);
    },
  ),
);

export { passport };
