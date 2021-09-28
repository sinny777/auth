// Copyright IBM Corp. 2021. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { DbDataSource } from '../datasources';
import { UserRole } from '../models';

export class UserRolesRepository extends DefaultCrudRepository<
    UserRole,
    typeof UserRole.prototype.id,
    UserRole
> {
    constructor(@inject('datasources.pgdb') dataSource: DbDataSource) {
        super(UserRole, dataSource);
    }
}
