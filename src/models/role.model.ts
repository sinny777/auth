// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Account} from './account.model';

@model()
export class Role extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true
  })
  id: number;

  @property({
    type: 'string',
    required: true
  })
  tenantId?: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @belongsTo(() => Account)
  accountId: string;

  constructor(data?: Partial<Role>) {
    super(data);
  }
}

export interface RoleRelations {
  // describe navigational properties here
}

export type RoleWithRelations = Role & RoleRelations;
