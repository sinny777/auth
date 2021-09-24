// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {ApplicationConfig} from '@loopback/core';
import {RestExplorerBindings} from '@loopback/rest-explorer';
import * as dotenv from "dotenv";
import {once} from 'events';
import http from 'http';
import * as path from 'path';
import {AuthApplication} from './application';

export {ApplicationConfig};

export class ExpressServer {
  public readonly lbApp: AuthApplication;
  private server?: http.Server;
  public url: String;

  constructor(options: ApplicationConfig = {}) {

    dotenv.config();
    let env_path = process.env.NODE_ENV;
    if (env_path) {
      dotenv.config({path: env_path});
    }

    this.lbApp = new AuthApplication(options);

    /**
     * bind the oauth2 options to lb app
     * TODO:
     *    1. allow to change client_id and client_secret after application startup
     *    2. allow to read oauth2 app registrations from a datastore
     */
    this.lbApp.bind('googleOAuth2Options').to(options.googleOptions);
    this.lbApp.bind('twitterOAuthOptions').to(options.twitterOptions);
    this.lbApp.bind('customOAuth2Options').to(options.oauth2Options);

    // Serve static files in the public folder
    // this.webApp.use(express.static(path.join(__dirname, '../public')));
    this.lbApp.static('/', path.join(__dirname, '../public'));
    this.lbApp.basePath('/api');

    this.lbApp.bind(RestExplorerBindings.CONFIG).to({
      path: '/explorer',
    });

  }

  public async boot() {
    await this.lbApp.boot();
  }

  /**
   * Start the express app and the lb4 app
   */
  public async start() {
    await this.lbApp.start();
    const port = this.lbApp.restServer.config.port ?? 3000;
    const host = this.lbApp.restServer.config.host ?? 'localhost';
    console.log(`Auth Server is running at ${host}:${port}`);
  
    await once(this.lbApp, 'listening');
    this.url = `http://${host}:${port}`;
  }

  /**
   * Stop lb4 and express apps
   */
  public async stop() {
    if (!this.server) return;
    await this.lbApp.stop();
    this.server.close();
    await once(this.server, 'close');
    this.server = undefined;
  }
}
