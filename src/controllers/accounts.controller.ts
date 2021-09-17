import {inject} from '@loopback/core';
import {
  api,
  get, Request,
  response,
  ResponseObject, RestBindings
} from '@loopback/rest';
import {LoggerBindings, PassportUserIdentityService, UserServiceBindings} from '../services';
import {LoggerService} from '../services/logger.service';

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

@api({basePath: '/accounts', paths: {}})
export class AccountsController {

  @inject(LoggerBindings.LOGGER)
  private loggerService: LoggerService;

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



}


