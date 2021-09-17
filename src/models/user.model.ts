// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Entity, hasMany, hasOne, model, property} from '@loopback/repository';
// import {v4 as uuid} from 'uuid';
import {UserCredentials} from './user-credentials.model';
import {UserIdentity} from './user-identity.model';

@model()
export class User extends Entity {

  @property({
    type: 'string',
    id: true,
    defaultFn: 'uuidv4',
  })
  id: string;

  @property({
    type: 'string',
    default: process.env.TENANT_ID || 'ibm'
  })
  tenantId: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  // must keep it
  @property({
    type: 'string',
    required: true,
    index: {unique: true},
  })
  username: string;

  // must keep it
  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'boolean',
  })
  emailVerified?: boolean;

  @property({
    type: 'string',
  })
  verificationToken?: string;

  @hasOne(() => UserCredentials)
  credentials?: UserCredentials;

  @hasMany(() => UserIdentity)
  profiles?: UserIdentity[];

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
