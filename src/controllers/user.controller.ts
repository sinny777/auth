// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/example-passport-login
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  del,
  get,
  HttpErrors,
  post,
  requestBody,
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
import {BcryptHasher, JWTService, PasswordHasherBindings, TokenServiceBindings} from '../services';

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

  @authenticate('basic')
  @get('/profiles')
  async getExternalProfiles(
    @inject(SecurityBindings.USER) profile: UserProfile,
  ) {
    const user = await this.userRepository.findById(
      profile[securityId],
      {
        include: ['profiles'],
      },
    );
    return user.profiles;
  }
}