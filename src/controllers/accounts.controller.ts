import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  api,
  get, Request,
  RequestBodyObject, response,
  ResponseObject, RestBindings
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {PassportUserIdentityService, UserServiceBindings} from '../services';

/**
 * OpenAPI response for ping()
 */
const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PingResponse',
        properties: {
          greeting: {type: 'string'},
          date: {type: 'string'},
          url: {type: 'string'},
          headers: {
            type: 'object',
            properties: {
              'Content-Type': {type: 'string'},
            },
            additionalProperties: true,
          },
        },
      },
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

@api({basePath: '/accounts', paths: {}})
export class AccountsController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject(UserServiceBindings.PASSPORT_USER_IDENTITY_SERVICE) private userService: PassportUserIdentityService,
  ) { }

  // Map to `GET /ping`
  @get('/ping')
  @response(200, PING_RESPONSE)
  ping(): object {
    // Reply with a greeting, the current time, the url, and request headers
    return {
      greeting: 'Hello from LoopBack',
      date: new Date(),
      url: this.req.url,
      headers: Object.assign({}, this.req.headers),
    };
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


}


