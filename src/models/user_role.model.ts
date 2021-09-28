// Copyright IBM Corp. 2021. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {belongsTo, Entity, model, property} from '@loopback/repository';
import { Role, User } from '.';


@model()
export class UserRole extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true
  })
  id: number;

  @belongsTo(() => User)
  userId: string;

  @belongsTo(() => Role)
  roleId?: number; 

  constructor(data?: Partial<UserRole>) {
    super(data);
  }
  
}

