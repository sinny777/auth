// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  HasManyRepositoryFactory, repository
} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Account, AccountRelations, Role} from '../models';
import {RoleRepository} from './role.repository';

export class AccountRepository extends DefaultCrudRepository<
  Account,
  typeof Account.prototype.id,
  AccountRelations
> {
  public readonly roles: HasManyRepositoryFactory<
    Role,
    typeof Account.prototype.id
  >;

  constructor(
    @inject('datasources.pgdb') dataSource: DbDataSource,
    @repository.getter('RoleRepository')
    protected rolesGetter: Getter<RoleRepository>
  ) {
    super(Account, dataSource);
    this.roles = this.createHasManyRepositoryFactoryFor(
      'roles',
      rolesGetter,
    );
    this.registerInclusionResolver('roles', this.roles.inclusionResolver);

  }
}
