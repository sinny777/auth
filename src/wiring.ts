// Copyright IBM Corp. 2021. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  Application,
  Constructor,
  createBindingFromClass,
  Provider
} from '@loopback/core';
import {ExpressRequestHandler, toInterceptor} from '@loopback/rest';
import passport from 'passport';
import {
  CustomOauth2Interceptor,
  GoogleOauthInterceptor,
  SessionAuth,
  TwitterOauthInterceptor
} from './authentication-interceptors';
import {
  BasicStrategy,
  GoogleOauth2Authentication,
  JWTStrategy,
  LocalAuthStrategy,
  Oauth2AuthStrategy,
  SessionStrategy,
  TwitterOauthAuthentication
} from './authentication-strategies';
import {
  CustomOauth2,
  CustomOauth2ExpressMiddleware,
  GoogleOauth,
  GoogleOauth2ExpressMiddleware,
  TwitterOauth,
  TwitterOauthExpressMiddleware
} from './authentication-strategy-providers';
import {BcryptHasher, JWTService, PassportUserIdentityService, PasswordHasherBindings, TokenServiceBindings, UserServiceBindings} from './services';

export function setupBindings(app: Application) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  passport.serializeUser(function (user: any, done) {
    done(null, user);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  passport.deserializeUser(function (user: any, done) {
    done(null, user);
  });

  // passport strategies
  const passportStrategies: Record<string, Constructor<unknown>> = {
    googleStrategy: GoogleOauth,
    twitterStrategy: TwitterOauth,
    oauth2Strategy: CustomOauth2,
  };
  for (const key in passportStrategies) {
    app.add(createBindingFromClass(passportStrategies[key], {key}));
  }

  // passport express middleware
  const middlewareMap: Record<
    string,
    Constructor<Provider<ExpressRequestHandler>>
  > = {
    googleStrategyMiddleware: GoogleOauth2ExpressMiddleware,
    twitterStrategyMiddleware: TwitterOauthExpressMiddleware,
    oauth2StrategyMiddleware: CustomOauth2ExpressMiddleware,
  };
  for (const key in middlewareMap) {
    app.add(createBindingFromClass(middlewareMap[key], {key}));
  }

  // LoopBack 4 style authentication strategies
  const strategies: Constructor<unknown>[] = [
    LocalAuthStrategy,
    GoogleOauth2Authentication,
    TwitterOauthAuthentication,
    Oauth2AuthStrategy,
    SessionStrategy,
    BasicStrategy,
    JWTStrategy
  ];
  for (const s of strategies) {
    app.add(createBindingFromClass(s));
  }

  // Express style middleware interceptors
  app.bind('passport-init-mw').to(toInterceptor(passport.initialize()));
  app.bind('passport-session-mw').to(toInterceptor(passport.session()));
  app.bind('passport-google').toProvider(GoogleOauthInterceptor);
  app.bind('passport-twitter').toProvider(TwitterOauthInterceptor);
  app.bind('passport-oauth2').toProvider(CustomOauth2Interceptor);
  app.bind('set-session-user').toProvider(SessionAuth);

  app
    .bind(UserServiceBindings.PASSPORT_USER_IDENTITY_SERVICE)
    .toClass(PassportUserIdentityService);

  app.bind(PasswordHasherBindings.PASSWORD_HASHER).toClass(BcryptHasher);
  app.bind(PasswordHasherBindings.ROUNDS).to(10)
  // app.bind(UserServiceBindings.USER_SERVICE).toClass(MyUserService);
  app.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);
  app.bind(TokenServiceBindings.TOKEN_SECRET).to(process.env.TOKEN_SECRET);
  app.bind(TokenServiceBindings.TOKEN_ISSUER).to(process.env.TOKEN_ISSUER);
  app.bind(TokenServiceBindings.TOKEN_AUDIENCE).to(process.env.TOKEN_AUDIENCE);
  app.bind(TokenServiceBindings.TOKEN_ALGORITHM).to(process.env.TOKEN_ALGORITHM);
  app.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(process.env.TOKEN_EXPIRES_IN);
  app.bind(TokenServiceBindings.JWT_PRIVATE_KEY).to(process.env.JWT_PRIVATE_KEY);
  app.bind(TokenServiceBindings.JWT_PUBLIC_KEY).to(process.env.JWT_PUBLIC_KEY);

}
