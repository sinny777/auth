import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  get, Request,
  RequestBodyObject, response,
  ResponseObject, RestBindings
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';


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

/**
 * A simple controller to bounce back http requests
 */
export class AccountsController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) { }

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
  @get('/me', {
    responses: USER_PROFILE_RESPONSE,
  })
  myInfo(@inject(SecurityBindings.USER) user: UserProfile): object {
    console.log('IN AccountsController.myInfo: >> ');
    return {
      user: user.profile,
      headers: Object.assign({}, this.req.headers),
    };
  }

  @authenticate('jwt')
  @get('/users/me', {
    responses: USER_PROFILE_RESPONSE,
  })
  myInfoFromToken(@inject(SecurityBindings.USER) user: UserProfile): Promise<UserProfile> {
    console.log('IN AccountsController.myInfoFromToken: >> ', user);
    // return {
    //   user: user.profile,
    //   headers: Object.assign({}, this.req.headers),
    // };
    return Promise.resolve(user);
  }


}


