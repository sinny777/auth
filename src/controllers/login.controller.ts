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
  RequestWithSession, ResponseObject, RestBindings,
  SchemaObject
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {AccessType, Credentials, RefreshTokenReq} from '../models';
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

const RefreshTokenSchema: SchemaObject = {
  type: 'object',
  required: ['tenantId', 'userId', 'token'],
  properties: {
    tenantId: {
      type: 'string',
    },
    userId: {
      type: 'string',
    },
    refreshToken: {
      type: 'string',
    },
  },
};

const USER_PROFILE_RESPONSE: ResponseObject = {
  '200': {
    description: 'User profile',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          title: 'userProfile',
          properties: {
            user: { type: 'object' },
          },
        },
      },
    },
  },
  description: 'User profile'
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
    } catch (err: any) {
      if (err.code !== 'ENTITY_NOT_FOUND') {
        throw err;
      }
    }
    if (!userCredentials) {
      const user = await this.userRepository.create({
        email: credentials.email,
        username: credentials.email,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        accessType: credentials.accessType || AccessType.online,
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
    @param.path.string('tenantId') tenantId: string,
  ) {

    this.loggerService.logger.debug('IN LoginController.login method');
    if (tenantId !== user.tenantId) {
      throw new HttpErrors.BadRequest('Invalid Tenant: >> ' + tenantId);
    }

    const profile = {
      ...user.profile,
    };
    // request.session.user = profile;
    delete profile.credentials;
    // this.loggerService.logger.debug('USER: >> ', profile);
    const token = await this.jwtService.generateToken(profile);
    const refreshToken = await this.jwtService.generateRefreshToken(profile);
    const tokensData = {
      user: profile,
      token: token,
      refreshToken: refreshToken
    }
    // profile.verificationToken = token;
    return tokensData;
  }

  @get('/keys')
  async fetchAuthKeys(
    @inject(TokenServiceBindings.JWT_PUBLIC_KEY) jwtPublicKey: string,
    @param.path.string('tenantId') tenantId: string,
  ): Promise<string> {
    const decodeKey = jwtPublicKey.replace(/\\n/gm, '\n');
    return Promise.resolve(decodeKey);
  }

  @authenticate('basic')
  @get('/basic', {
    responses: {
      '200': {
        description: 'User profile',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              title: 'userProfile',
              properties: {
                user: { type: 'object' },
              },
            },
          },
        },
      }
    },
  })
  myInfoUsingBasicAuth(
    @inject(SecurityBindings.USER) user: UserProfile,
    @param.path.string('tenantId') tenantId: string,
  ): object {
    this.loggerService.logger.debug('IN LoginController.myInfoUsingBasicAuth: >> ');
    return {
      user: user.profile,
      headers: Object.assign({}, this.req.headers),
    };
  }

  @authenticate('jwt')
  @get('/me', {
    responses: {
      '200': {
        description: 'User profile',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              title: 'userProfile',
              properties: {
                user: { type: 'object' },
              },
            },
          },
        },
      }
    },
  })
  async myInfoUsingToken(
    @inject(SecurityBindings.USER) user: UserProfile,
    @param.path.string('tenantId') tenantId: string,
  ): Promise<UserProfile> {
    this.loggerService.logger.debug('IN LoginController.myInfoUsingToken: >> ');
    if (tenantId !== user.tenantId) {
      throw new HttpErrors.BadRequest('Invalid Tenant: >> ' + tenantId);
    }

    const userDetails = await this.userService.findById(
      user[securityId],
      {
        include: ['profiles', 'roles'],
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
    // this.loggerService.logger.debug('USER: >> ', user);
    return Promise.resolve(user.profiles);
  }

  @authenticate('jwt')
  @get('/accounts')
  async getMyAccounts(
    @inject(SecurityBindings.USER) profile: UserProfile,
    @param.path.string('tenantId') tenantId: string,
  ): Promise<UserProfile> {
    if (tenantId !== profile.tenantId) {
      throw new HttpErrors.BadRequest('Invalid Tenant: >> ' + tenantId);
    }
    const accounts = await this.userService.findUserAccounts(
      profile[securityId]
    );
    // this.loggerService.logger.debug('USER: >> ', user);
    return Promise.resolve(accounts);
  }

  /**
   * TODO: enable roles and authorization, add admin role authorization to this endpoint
   */
  @authenticate('jwt')
  @del('/clear')
  async clear(
    @param.path.string('tenantId') tenantId: string,
  ) {
    await this.userCredentialsRepository.deleteAll();
    await this.userIdentityRepository.deleteAll();
    await this.userRepository.deleteAll();
  }

  @post('/token/refresh')
  async refreshToken(
    @requestBody({
      description: 'Refresh Token',
      required: true,
      content: {
        'application/json': {schema: RefreshTokenSchema},
      },
    })
    refreshTokenReq: RefreshTokenReq,
    @param.path.string('tenantId') tenantId: string,
  ) {

    this.loggerService.logger.debug('IN LoginController.refreshToken method');
    if (tenantId !== refreshTokenReq.tenantId) {
      throw new HttpErrors.BadRequest('Invalid Tenant: >> ' + tenantId);
    }
    let userProfile: UserProfile = await this.jwtService.verifyToken(refreshTokenReq.refreshToken);
    if(userProfile){
      if(refreshTokenReq['accountId']){

      }


      const token = await this.jwtService.generateToken(userProfile);
      const refreshToken = await this.jwtService.generateRefreshToken(userProfile);
      const tokensData = {
        user: userProfile,
        token: token,
        refreshToken: refreshToken
      }
      return Promise.resolve(tokensData);
    }else{
      throw new HttpErrors.Unauthorized('Token Expired: >> ');
    }
    
  }

  @authenticate('jwt')
  @post('/token/exchange')
  async exchangeToken(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.string('tenantId') tenantId: string
  ): Promise<any> {
    if (tenantId !== userProfile.tenantId) {
      throw new HttpErrors.BadRequest('Invalid Tenant: >> ' + tenantId);
    }
   
    if(userProfile){
        const token = await this.jwtService.generateToken(userProfile);
        const refreshToken = await this.jwtService.generateRefreshToken(userProfile);
        const tokensData = {
          user: userProfile,
          token: token,
          refreshToken: refreshToken
        }
      return Promise.resolve(tokensData);
    }else{
      Promise.reject("Invalid Details !");
    }
  }


}
