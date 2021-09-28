// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {UserIdentityService} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {Filter, repository, Where} from '@loopback/repository';
import { UserProfile } from '@loopback/security';
import {Profile as PassportProfile} from 'passport';
import {JWTService, LoggerBindings, TokenServiceBindings} from '.';
import {User} from '../models';
import {AccountRepository, UserRepository} from '../repositories';
import {UserIdentityRepository} from '../repositories/user-identity.repository';
import { AccountsService } from './account.service';
import {LoggerService} from './logger.service';

/**
 * User service to accept a 'passport' user profile and save it locally
 */
export class PassportUserIdentityService
  implements UserIdentityService<PassportProfile, User>
{

  @inject(LoggerBindings.LOGGER)
  private loggerService: LoggerService;

  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(UserIdentityRepository)
    public userIdentityRepository: UserIdentityRepository,
    @repository(AccountRepository)
    public accountRepository: AccountRepository,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: JWTService
  ) { }

  /**
   * find a linked local user for an external profile
   * create a local user if not created yet.
   * @param email
   * @param profile
   * @param token
   */
  async findOrCreateUser(profile: PassportProfile): Promise<User> {
    if (!profile.emails || !profile.emails.length) {
      throw new Error('email-id is required in returned profile to login');
    }

    const email = profile.emails[0].value;

    const users: User[] = await this.userRepository.find({
      where: {
        email: email,
      },
    });
    let user: User;
    if (!users || !users.length) {
      const firstName = profile.name?.givenName
        ? profile.name.givenName
        : profile.displayName;
      const lastName = profile.name?.familyName
      user = await this.userRepository.create({
        email: email,
        firstName: firstName || JSON.stringify(profile.name),
        lastName: lastName,
        username: email,
      });
    } else {
      user = users[0];
    }
    user = await this.linkExternalProfile(user.id, profile);
    return Promise.resolve(user);
  }

  /**
   * link external profile with local user
   * @param userId
   * @param userIdentity
   */
  async linkExternalProfile(
    userId: string,
    userIdentity: PassportProfile,
  ): Promise<User> {
    let profile;
    try {
      profile = await this.userIdentityRepository.findById(userIdentity.id);
    } catch (err) {
      this.loggerService.logger.error(err);
      // no need to throw an error if entity is not found
      if (!(err.code === 'ENTITY_NOT_FOUND')) {
        throw err;
      }
    }

    if (!profile) {
      await this.createUser(userId, userIdentity);
    } else {
      await this.userIdentityRepository.updateById(userIdentity.id, {
        profile: {
          emails: userIdentity.emails,
        },
        created: new Date(),
      });
    }
    if (!userId) this.loggerService.logger.debug('user id is empty');
    return this.userRepository.findById(userId, {
      include: ['profiles'],
    });
  }

  /**
   * create a copy of the external profile
   * @param userId
   * @param userIdentity
   */
  async createUser(
    userId: string,
    userIdentity: PassportProfile,
  ): Promise<void> {
    await this.userIdentityRepository.create({
      id: userIdentity.id,
      provider: userIdentity.provider,
      authScheme: userIdentity.provider,
      userId: userId,
      profile: {
        emails: userIdentity.emails,
      },
      created: new Date(),
    });
  }

  async find(filter?: Filter<User>): Promise<any> {
    this.loggerService.logger.debug('IN UserService.find: >>>> %o', filter);
    return this.userRepository.find(filter);
  }

  async updateAll(user: User, where?: Where<User>): Promise<any> {
    this.loggerService.logger.debug('IN UserService.updateAll: >>>> %o', user);
    return this.userRepository.updateAll(user, where);
  }

  async findById(id: string, filter?: Filter<User>): Promise<any> {
    this.loggerService.logger.debug('IN UserService.findById: >>>> %o %o %o', id, ', filter: ', filter);
    return this.userRepository.findById(id, filter);
  }

  async updateById(id: string, user: User): Promise<any> {
    this.loggerService.logger.debug('IN UserService.updateById: >>>> ', id, ', user: ', user);
    return this.userRepository.updateById(id, user);
  }

  async replaceById(id: string, user: User): Promise<any> {
    this.loggerService.logger.debug('IN UserService.replaceById: >>>> ', id, ', user: ', user);
    return this.userRepository.replaceById(id, user);
  }

  async deleteById(id: string): Promise<any> {
    this.loggerService.logger.debug('IN UserService.deleteById: >>>> ', id);
    return this.userRepository.deleteById(id);
  }

  async findUserAccounts(userId: string): Promise<any> {
    this.loggerService.logger.debug('IN UserService.findUserAccounts: >>>> ', userId);
    const userRoles = await this.userRepository.roles(userId).find();
    let userAccountIds: string[] = [];
    for (const role of userRoles) {
      userAccountIds.push(role.accountId);
    }

    return this.accountRepository.find({
      where: {
        "id": {"inq": userAccountIds}
      }
    });

  }

  async refreshToken(userProfile: UserProfile, payload: any): Promise<any> {
    this.loggerService.logger.debug('IN UserService.refreshToken: >>>> ', payload);
    // this.jwtService.verifyToken
    if(userProfile){
      const token = await this.jwtService.generateToken(userProfile);
      const refreshToken = await this.jwtService.generateRefreshToken(userProfile);
      const tokensData = {
        user: userProfile,
        token: token,
        refreshToken: refreshToken
      }
    return Promise.resolve(tokensData);
  }

  }

}
