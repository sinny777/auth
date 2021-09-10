// Copyright IBM Corp. 2021. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {asAuthStrategy, AuthenticationStrategy} from '@loopback/authentication';
import {StrategyAdapter} from '@loopback/authentication-passport';
import {inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors, RedirectRoute, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {BasicStrategy as Strategy} from 'passport-http';
import {User} from '../models';
import {UserRepository} from '../repositories';
import {BcryptHasher, PasswordHasherBindings} from '../services';
import {mapProfile} from './types';

/**
 * basic passport strategy
 */
@injectable(asAuthStrategy)
export class BasicStrategy implements AuthenticationStrategy {
  name = 'basic';
  passportstrategy: Strategy;
  strategy: StrategyAdapter<User>;

  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public hasher: BcryptHasher
  ) {
    /**
     * create a basic passport strategy with verify function to validate credentials
     */
    this.passportstrategy = new Strategy(this.verify.bind(this));
    /**
     * wrap the passport strategy instance with an adapter to plugin to LoopBack authentication
     */
    this.strategy = new StrategyAdapter(
      this.passportstrategy,
      this.name,
      mapProfile.bind(this),
    );
  }

  /**
   * authenticate a request
   * @param request
   */
  async authenticate(request: Request): Promise<UserProfile | RedirectRoute> {
    return this.strategy.authenticate(request);
  }

  /**
   * authenticate user with provided username and password
   *
   * @param username
   * @param password
   * @param done
   *
   * @returns User model
   */
  verify(
    username: string,
    password: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    done: (error: any, user?: any) => void,
  ): void {
    this.userRepository
      .find({
        where: {
          email: username,
        },
        include: ['profiles', 'credentials'],
      })
      .then((users: User[]) => {
        if (!users || !users.length) {
          return done(null, false);
        }
        const user = users[0];
        // if (!user.credentials || user.credentials.password !== password) {
        //   return done(null, false);
        // }
        if (user.credentials && user.credentials.password) {
          const passwordMatched = this.hasher.comparePassword(password, user.credentials?.password);
          if (!passwordMatched)
            throw new HttpErrors.Unauthorized('password is not valid');
        } else {
          throw new HttpErrors.Unauthorized('password is not valid');
        }
        // Authentication passed, return user profile
        done(null, user);
      })
      .catch(err => {
        /**
         * Error occurred in authenticating process.
         * Does not necessarily mean an unauthorized user.
         */
        done(err);
      });
  }
}
