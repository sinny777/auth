// Copyright IBM Corp. 2021. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
// import {LoggingBindings, WinstonLogger} from '@loopback/logging';
import {repository} from '@loopback/repository';
import {
  api,
  del,
  get,
  HttpErrors,
  param,
  post, Request,
  requestBody,
  RequestBodyObject,
  RequestWithSession, RestBindings,
  SchemaObject
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Credentials} from '../models';
import {UserRepository} from '../repositories';
import {UserCredentialsRepository} from '../repositories/user-credentials.repository';
import {UserIdentityRepository} from '../repositories/user-identity.repository';
import {BcryptHasher, JWTService, LoggerBindings, PassportUserIdentityService, PasswordHasherBindings, TokenServiceBindings, UserServiceBindings} from '../services';
import {LoggerService} from '../services/logger.service';


const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};

const USER_PROFILE_RESPONSE: RequestBodyObject = {
  description: 'Session user profile',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'sessionUserProfile',
        properties: {
          user: {type: 'object'},
        },
      },
    },
  },
};

@api({basePath: '/{tenantId}/auth/', paths: {}})
export class UserLoginController {

  @inject(LoggerBindings.LOGGER)
  private loggerService: LoggerService;

  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(UserCredentialsRepository)
    public userCredentialsRepository: UserCredentialsRepository,
    @repository(UserIdentityRepository)
    public userIdentityRepository: UserIdentityRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public hasher: BcryptHasher,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: JWTService,
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject(UserServiceBindings.PASSPORT_USER_IDENTITY_SERVICE) private userService: PassportUserIdentityService,
  ) { }

  @post('/signup')
  async signup(
    @requestBody({
      description: 'signup user locally',
      required: true,
      content: {
        'application/json': {schema: CredentialsSchema},
      },
    })
    credentials: Credentials,
    @param.path.string('tenantId') tenantId: string,
  ) {
    let userCredentials;
    try {
      userCredentials = await this.userCredentialsRepository.findById(
        credentials.email,
      );
    } catch (err) {
      if (err.code !== 'ENTITY_NOT_FOUND') {
        throw err;
      }
    }
    if (!userCredentials) {
      const user = await this.userRepository.create({
        email: credentials.email,
        username: credentials.email,
        name: credentials.name,
        tenantId: tenantId
      });
      userCredentials = await this.userCredentialsRepository.create({
        id: credentials.email,
        password: await this.hasher.hashPassword(credentials.password),
        userId: user.id,
      });
      return userCredentials;
    } else {
      throw new HttpErrors.BadRequest(
        `User Exists, ${credentials.email} is already registered`,
      );
    }
  }

  @authenticate('local')
  @post('/login')
  async login(
    @requestBody({
      description: 'login to create a user session',
      required: true,
      content: {
        'application/json': {schema: CredentialsSchema},
      },
    })
    credentials: Credentials,
    @inject(SecurityBindings.USER) user: UserProfile,
    @inject(RestBindings.Http.REQUEST) request: RequestWithSession,
    @param.path.string('tenantId') tenantId: string,
  ) {

    this.loggerService.logger.info('IN LoginController.login method');
    if (tenantId !== user.tenantId) {
      throw new HttpErrors.BadRequest('Invalid Tenant: >> ' + tenantId);
    }

    const profile = {
      ...user.profile,
    };
    // request.session.user = profile;
    delete profile.credentials;
    // this.loggerService.logger.info('USER: >> ', profile);
    const token = await this.jwtService.generateToken(profile);
    profile.verificationToken = token;
    return profile;
  }

  @get('/keys')
  async fetchAuthKeys(
    @inject(TokenServiceBindings.JWT_PUBLIC_KEY) jwtPublicKey: string,
    @param.path.string('tenantId') tenantId: string,
  ): Promise<string> {
    const decodeKey = jwtPublicKey.replace(/\\n/gm, '\n');
    return Promise.resolve(decodeKey);
  }

  @authenticate('session')
  @get('/whoAmI', {
    responses: USER_PROFILE_RESPONSE,
  })
  whoAmI(
    @inject(SecurityBindings.USER) user: UserProfile,
    @param.path.string('tenantId') tenantId: string,
  ): object {
    this.loggerService.logger.info('IN LoginController.whoAmI: >> ');
    return {
      user: user.profile,
      headers: Object.assign({}, this.req.headers),
    };
  }

  @authenticate('basic')
  @get('/basic', {
    responses: USER_PROFILE_RESPONSE,
  })
  myInfoUsingBasicAuth(
    @inject(SecurityBindings.USER) user: UserProfile,
    @param.path.string('tenantId') tenantId: string,
  ): object {
    this.loggerService.logger.info('IN LoginController.myInfoUsingBasicAuth: >> ');
    return {
      user: user.profile,
      headers: Object.assign({}, this.req.headers),
    };
  }

  @authenticate('jwt')
  @get('/me', {
    responses: USER_PROFILE_RESPONSE,
  })
  async myInfoUsingToken(
    @inject(SecurityBindings.USER) user: UserProfile,
    @param.path.string('tenantId') tenantId: string,
  ): Promise<UserProfile> {
    this.loggerService.logger.info('IN LoginController.myInfoUsingToken: >> ');
    if (tenantId !== user.tenantId) {
      throw new HttpErrors.BadRequest('Invalid Tenant: >> ' + tenantId);
    }

    const userDetails = await this.userService.findById(
      user[securityId],
      {
        include: ['profiles'],
      },
    );

    return Promise.resolve(userDetails);
  }

  @authenticate('jwt')
  @get('/profiles')
  async getExternalProfiles(
    @inject(SecurityBindings.USER) profile: UserProfile,
    @param.path.string('tenantId') tenantId: string,
  ): Promise<UserProfile> {
    if (tenantId !== profile.tenantId) {
      throw new HttpErrors.BadRequest('Invalid Tenant: >> ' + tenantId);
    }
    const user = await this.userService.findById(
      profile[securityId],
      {
        include: ['profiles'],
      },
    );
    // this.loggerService.logger.info('USER: >> ', user);
    return Promise.resolve(user.profiles);
  }

  /**
   * TODO: enable roles and authorization, add admin role authorization to this endpoint
   */
  @authenticate('basic')
  @del('/clear')
  async clear() {
    await this.userCredentialsRepository.deleteAll();
    await this.userIdentityRepository.deleteAll();
    await this.userRepository.deleteAll();
  }

  @authenticate('jwt')
  @get('/{accountId}/exchange')
  async exchangeToken(
    @inject(SecurityBindings.USER) user: UserProfile,
    @param.path.string('tenantId') tenantId: string,
    @param.path.string('accountId') accountId: string,
  ): Promise<string> {
    if (tenantId !== user.tenantId) {
      throw new HttpErrors.BadRequest('Invalid Tenant: >> ' + tenantId);
    }
    user.accountId = accountId;
    const newToken = this.jwtService.generateToken(user);
    return Promise.resolve(newToken);
  }


}
