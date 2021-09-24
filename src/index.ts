// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {RestApplication} from '@loopback/rest';
import * as dotenv from "dotenv";
import * as path from 'path';
import {oauth2ProfileFunction} from './authentication-strategies';
import {ApplicationConfig, ExpressServer} from './server';

export * from './server';

/**
 * Prepare server config
 * @param oauth2Providers
 */
export async function serverConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oauth2Providers: any,
): Promise<ApplicationConfig> {
  let PORT = process.env.PORT || 3000;
  const config = {
    rest: {
      port: PORT,
      host: process.env.HOST,
      protocol: 'http',
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        setServersFromRequest: true,
      },
      requestBodyParser: {json: {limit: '2mb'}},
      // Use the LB4 application as a route. It should not be listening.
      // listenOnStart: false,
    },
    googleOptions: oauth2Providers['google-login'],
    twitterOptions: oauth2Providers['twitter-login'],
    oauth2Options: oauth2Providers['oauth2'],
  };

  return config;
}

/**
 * bind resources to application
 * @param server
 */
export async function setupApplication(
  lbApp: RestApplication,
  dbBackupFile?: string,
) {
  lbApp.bind('datasources.config.db').to({
    name: 'db',
    connector: 'memory',
    localStorage: '',
    file: dbBackupFile ? path.resolve(__dirname, dbBackupFile) : undefined,
  });

  lbApp
    .bind('authentication.oauth2.profile.function')
    .to(oauth2ProfileFunction);
}

/**
 * Start this application
 * @param oauth2Providers
 */
export async function startApplication(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oauth2Providers: any,
  dbBackupFile?: string,
): Promise<ExpressServer> {
  const config = await serverConfig(oauth2Providers);
  const server = new ExpressServer(config);
  await setupApplication(server.lbApp, dbBackupFile);
  await server.boot();
  await server.start();
  return server;
}

/**
 * run main() to start application with oauth config
 */
export async function main() {
  let oauth2Providers;

  dotenv.config();
  let env_path = process.env.NODE_ENV;
  if (env_path) {
    dotenv.config({path: env_path});
  }

  if (process.env.OAUTH_PROVIDERS_LOCATION) {
    oauth2Providers = require(process.env.OAUTH_PROVIDERS_LOCATION);
  } else {
    oauth2Providers = require('@loopback/mock-oauth2-provider');
  }
  // console.log(oauth2Providers);
  const server: ExpressServer = await startApplication(
    oauth2Providers,
    process.env.DB_BKP_FILE_PATH, // eg: export DB_BKP_FILE_PATH=../data/db.json
  );
  console.log(`Server is running at ${server.url}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
