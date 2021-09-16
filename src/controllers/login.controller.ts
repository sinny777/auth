// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
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
  RequestWithSession,
  Response,
  RestBindings,
  SchemaObject
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Credentials} from '../models';
import {UserRepository} from '../repositories';
import {UserCredentialsRepository} from '../repositories/user-credentials.repository';
import {UserIdentityRepository} from '../repositories/user-identity.repository';
import {BcryptHasher, JWTService, PassportUserIdentityService, PasswordHasherBindings, TokenServiceBindings, UserServiceBindings} from '../services';

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

@api({basePath: '/auth', paths: {}})
export class UserLoginController {
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
    @inject(RestBindings.Http.RESPONSE) response: Response,
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
        tenantId: credentials.tenantId
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
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    const profile = {
      ...user.profile,
    };
    request.session.user = profile;
    // response.redirect('/auth/account');
    // return response;
    // console.log(profile);
    // return profile;
    console.log('USER: >> ', profile);
    const token = await this.jwtService.generateToken(profile);
    return token;
  }

  @get('/keys')
  async fetchAuthKeys(
    @inject(TokenServiceBindings.JWT_PUBLIC_KEY) jwtPublicKey: string
  ): Promise<string> {
    const decodeKey = jwtPublicKey.replace(/\\n/gm, '\n');
    return Promise.resolve(decodeKey);
  }

  @authenticate('session')
  @get('/whoAmI', {
    responses: USER_PROFILE_RESPONSE,
  })
  whoAmI(@inject(SecurityBindings.USER) user: UserProfile): object {
    console.log('IN AccountsController.whoAmI: >> ');
    return {
      user: user.profile,
      headers: Object.assign({}, this.req.headers),
    };
  }

  @authenticate('basic')
  @get('/basic', {
    responses: USER_PROFILE_RESPONSE,
  })
  myInfoUsingBasicAuth(@inject(SecurityBindings.USER) user: UserProfile): object {
    console.log('IN AccountsController.myInfoUsingBasicAuth: >> ');
    return {
      user: user.profile,
      headers: Object.assign({}, this.req.headers),
    };
  }

  @authenticate('jwt')
  @get('/me', {
    responses: USER_PROFILE_RESPONSE,
  })
  async myInfoUsingToken(@inject(SecurityBindings.USER) user: UserProfile): Promise<UserProfile> {
    console.log('IN AccountsController.myInfoUsingToken: >> ', user);
    const userDetails = await this.userService.findById(
      user[securityId],
      {
        include: ['profiles'],
      },
    );
    // console.log('userDetails: >> ', userDetails);
    return Promise.resolve(userDetails);
  }

  @authenticate('jwt')
  @get('/profiles')
  async getExternalProfiles(
    @inject(SecurityBindings.USER) profile: UserProfile,
  ): Promise<UserProfile> {
    const user = await this.userService.findById(
      profile[securityId],
      {
        include: ['profiles'],
      },
    );
    // console.log('USER: >> ', user);
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
    @param.path.string('accountId') accountId: string,
  ): Promise<string> {
    user.accountId = accountId;
    const newToken = this.jwtService.generateToken(user);
    return Promise.resolve(newToken);
  }


}
