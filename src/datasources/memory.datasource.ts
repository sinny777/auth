
import {inject} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'memory',
  connector: 'memory',
  localStorage: '',
  file: './data/db.json',
};

export class DbDataSource extends juggler.DataSource {
  static dataSourceName = 'memory';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.memory', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
