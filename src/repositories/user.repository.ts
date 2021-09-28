// Copyright IBM Corp. 2020. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  HasManyRepositoryFactory,

  HasManyThroughRepositoryFactory,

  HasOneRepositoryFactory, repository
} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Role, User, UserCredentials, UserIdentity, UserRole} from '../models';
import { RoleRepository } from './role.repository';
import {UserCredentialsRepository} from './user-credentials.repository';
import {UserIdentityRepository} from './user-identity.repository';
import { UserRolesRepository } from './user-role.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id
> {
  public readonly profiles: HasManyRepositoryFactory<
    UserIdentity,
    typeof User.prototype.id
  >;

  public readonly credentials: HasOneRepositoryFactory<
    UserCredentials,
    typeof User.prototype.id
  >;

  public readonly roles: HasManyThroughRepositoryFactory<
    Role,
    typeof Role.prototype.id,
    UserRole,
    typeof User.prototype.id
  >;

  constructor(
    @inject('datasources.pgdb') dataSource: DbDataSource,
    @repository.getter('UserIdentityRepository')
    protected profilesGetter: Getter<UserIdentityRepository>,
    @repository.getter('UserCredentialsRepository')
    protected credentialsGetter: Getter<UserCredentialsRepository>,
    @repository.getter('RoleRepository')
    roleRepositoryGetter: Getter<RoleRepository>,
    @repository.getter('UserRolesRepository')
    userRolesRepositoryGetter: Getter<UserRolesRepository>
  ) {
    super(User, dataSource);
    this.profiles = this.createHasManyRepositoryFactoryFor(
      'profiles',
      profilesGetter,
    );
    this.registerInclusionResolver('profiles', this.profiles.inclusionResolver);

    this.credentials = this.createHasOneRepositoryFactoryFor(
      'credentials',
      credentialsGetter,
    );
    this.registerInclusionResolver('credentials', this.credentials.inclusionResolver,
    );

    this.roles = this.createHasManyThroughRepositoryFactoryFor(
      'roles',
      roleRepositoryGetter,
      userRolesRepositoryGetter,
    );
    this.registerInclusionResolver('roles', this.roles.inclusionResolver);
  }
}
