
// import {inject} from '@loopback/core';
// import {juggler} from '@loopback/repository';

// const config = {
//   name: 'pgdb',
//   connector: 'postgresql',
//   url: '',
//   host: 'localhost',
//   port: 5432,
//   user: 'sinny777',
//   password: '1SatnamW',
//   database: 'auth',
//   min: 5,
//   max: 200,
//   idleTimeoutMillis: 60000,
//   ssl: false
// };

// export class DbDataSource extends juggler.DataSource {
//   static dataSourceName = 'pgdb';
//   static readonly defaultConfig = config;

//   constructor(
//     @inject('datasources.config.pgdb', {optional: true})
//     dsConfig: object = config,
//   ) {
//     super(dsConfig);
//   }
// }


import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import * as fs from 'fs';

const config = { };

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
// @lifeCycleObserver('datasource')
export class DbDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'pgdb';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.pgdb', {optional: true})
    dsConfig: object = config,
  ) {

    const privateKey = process.env.DB_SSL_CA || '';
    const sslCA = privateKey.replace(/\\n/gm, '\n');

    dsConfig = {
      name: 'admin',
      connector: process.env.DB_CONNECTOR,
      url: process.env.DB_URL,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      'debug': true,
      ssl: {
        sslmode: 'verify-all',
        rejectUnauthorized: true,
        // ca: fs.readFileSync(`./src/config/keys/secrets/hyper-dbaas-postgres.pem`).toString(),
        ca: sslCA
      }
    };

    console.log('dsConfig: >> ', dsConfig);

    super(dsConfig);
  }
}

