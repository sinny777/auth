// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Entity, hasMany, model, property} from '@loopback/repository';
import shortUUID from 'short-uuid';
import {Role} from './role.model';
import {AccountType} from './types';

@model({
  settings: {
    indexes: {
      name: {
        keys: {
          name: 1,
        },
        options: {
          unique: true,
        },
      },
    },
  },
})
export class Account extends Entity {
  @property({
    type: 'string',
    id: true,
    default: () => shortUUID().new(),
  })
  id?: string;

  @property({
    type: 'string',
    default: process.env.TENANT_ID || 'ibm'
  })
  tenantId?: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {
      enum: Object.values(AccountType),
    },
    default: AccountType.DEFAULT
  })
  type: AccountType;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @hasMany(() => Role)
  roles?: Role[];

  constructor(data?: Partial<Account>) {
    super(data);
  }
}

export interface AccountRelations {
  // describe navigational properties here
}

export type AccountWithRelations = Account & AccountRelations;
