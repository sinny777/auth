// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {TokenService, UserIdentityService, UserService} from '@loopback/authentication';
import {BindingKey} from '@loopback/core';
import {Profile as PassportProfile} from 'passport';
import {Credentials, User} from '../models';
import {PasswordHasher} from './hash.password';
import {LoggerService} from './logger.service';
import { TokenServiceI } from './types';

export namespace UserServiceBindings {
  export const PASSPORT_USER_IDENTITY_SERVICE = BindingKey.create<
    UserIdentityService<PassportProfile, User>
  >('services.passport.identity');
}

export namespace LoggerBindings {
  export const LOGGER = BindingKey.create<LoggerService>('services.logger');
}

export namespace TokenServiceBindings {
  export const TENANT_ID = BindingKey.create<string | undefined>(
    'tenantId',
  );
  export const TOKEN_SECRET = BindingKey.create<string | undefined>(
    'authentication.jwt.secret',
  );
  export const JWT_PRIVATE_KEY = BindingKey.create<string | undefined>(
    'authentication.jwt.privateKey',
  );
  export const JWT_PUBLIC_KEY = BindingKey.create<string | undefined>(
    'authentication.jwt.publicKey',
  );
  export const TOKEN_ISSUER = BindingKey.create<string | undefined>(
    'authentication.jwt.issuer',
  );
  export const TOKEN_AUDIENCE = BindingKey.create<string | undefined>(
    'authentication.jwt.audience',
  );
  export const TOKEN_ALGORITHM = BindingKey.create<string | undefined>(
    'authentication.jwt.algorithm',
  );
  export const TOKEN_EXPIRES_IN = BindingKey.create<string | undefined>(
    'authentication.jwt.expiresIn',
  );
  export const REFRESH_TOKEN_EXPIRES_IN = BindingKey.create<string | undefined>(
    'authentication.jwt.refreshExpiresIn',
  );
  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'services.jwt.service',
  );
  export const REFRESH_TOKEN_SERVICE = BindingKey.create<TokenServiceI>(
    'services.jwt.refreshService',
  );
}

export namespace PasswordHasherBindings {
  export const PASSWORD_HASHER = BindingKey.create<PasswordHasher>(
    'services.hasher',
  );
  export const ROUNDS = BindingKey.create<number>('services.hasher.rounds');
}

export namespace UserServiceBindings {
  export const USER_SERVICE = BindingKey.create<UserService<Credentials, User>>(
    'services.user.service',
  );
}
