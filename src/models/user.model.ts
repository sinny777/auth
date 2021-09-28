// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Entity, hasMany, hasOne, model, property} from '@loopback/repository';
import { AccessType, Role, RoleWithRelations, UserRole } from '.';
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
  })
  defaultAccountId: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: Object.values(AccessType),
    },
    default: AccessType.online
  })
  accessType: AccessType | AccessType.online;

  @property({
    type: 'string',
    required: true,
  })
  firstName: string;

  @property({
    type: 'string'
  })
  lastName: string;

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

  @hasOne(() => UserCredentials)
  credentials?: UserCredentials;

  @hasMany(() => UserIdentity)
  profiles?: UserIdentity[];

  @hasMany(() => Role, 
    {
      through: 
      {
        model: () => UserRole,
        keyFrom: 'userId',
        keyTo: 'roleId',
      }
    })
  roles?: Role[];

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  profiles: UserIdentity;
  credentials: UserCredentials;
  roles: RoleWithRelations;
  
}

export type UserWithRelations = User & UserRelations;
