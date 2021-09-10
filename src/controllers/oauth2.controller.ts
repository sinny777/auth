// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  get,



  param, RequestWithSession, Response, RestBindings
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {oAuth2InterceptExpressMiddleware} from '../authentication-interceptors/types';
import {JWTService, TokenServiceBindings} from '../services';

/**
 * Login controller for third party oauth provider
 *
 * This controller demonstrates using passport strategies both as express middleware and as an independent strategy
 *
 * The method loginToThirdParty uses the @authenticate decorator to plugin passport strategies independently
 * The method thirdPartyCallBack uses the passport strategies as express middleware
 */
export class Oauth2Controller {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE) public jwtService: JWTService,
  ) { }

  @authenticate('oauth2')
  @get('/auth/thirdparty/{provider}')
  /**
   * This method uses the @authenticate decorator to plugin passport strategies independently
   *
   * Endpoint: '/auth/thirdparty/{provider}'
   *          an endpoint for api clients to login via a third party app, redirects to third party app
   */
  loginToThirdParty(
    @param.path.string('provider') provider: string,
    @param.query.string('urlAfterLogin') urlAfterLogin: string,
    @inject(AuthenticationBindings.AUTHENTICATION_REDIRECT_URL)
    redirectUrl: string,
    @inject(AuthenticationBindings.AUTHENTICATION_REDIRECT_STATUS)
    status: number,
    @inject(RestBindings.Http.RESPONSE)
    response: Response,
  ) {
    response.statusCode = status || 302;
    response.setHeader('Location', redirectUrl);
    // response.setHeader('urlAfterLogin', urlAfterLogin);
    response.end();
    return response;
  }

  @oAuth2InterceptExpressMiddleware()
  @get('/auth/thirdparty/{provider}/callback')
  /**
   * This method uses the passport strategies as express middleware
   *
   * Endpoint: '/auth/thirdparty/{provider}/callback'
   *          an endpoint which serves as a oauth2 callback for the thirdparty app
   *          this endpoint sets the user profile in the session
   */
  async thirdPartyCallBack(
    @param.path.string('provider') provider: string,
    @inject(SecurityBindings.USER) user: UserProfile,
    @inject(RestBindings.Http.REQUEST) request: RequestWithSession,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {

    console.log("USER : >> ", user);
    const token = await this.jwtService.generateToken(user.profile);
    console.log("TOKEN : >> ", token);
    const profile = {
      ...user.profile,
      token: token
    };
    request.session.user = profile;
    console.log('urlAfterLogin: >> ', request.headers.referer);
    response.redirect('/auth/account');
    return response;
  }
}
