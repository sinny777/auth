// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Entity, hasMany, model, property} from '@loopback/repository';
import {Role} from './role.model';

@model()
export class Account extends Entity {
  @property({
    type: 'string',
    id: true,
    defaultFn: "uuid"
  })
  id: string;

  // @property({
  //   type: 'string',
  //   required: true,
  //   jsonSchema: {
  //     enum: Object.values(AccountType),
  //   },
  //   default: AccountType.DEFAULT
  // })
  // type: AccountType;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true
  })
  tenantId?: string;

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
