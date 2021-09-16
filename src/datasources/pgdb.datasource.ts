
import {inject} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'pgdb',
  connector: 'postgresql',
  url: '',
  host: 'localhost',
  port: 5432,
  user: 'sinny777',
  password: '1SatnamW',
  database: 'auth',
  min: 5,
  max: 200,
  idleTimeoutMillis: 60000,
  ssl: false
};

export class DbDataSource extends juggler.DataSource {
  static dataSourceName = 'pgdb';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.pgdb', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
