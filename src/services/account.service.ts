import {bind, /* inject, */ BindingScope, inject} from '@loopback/core';
import {Filter, repository, Where} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {LoggerBindings} from '.';
import {Account, Role} from '../models';
import {AccountRepository, UserRepository} from '../repositories';
import {LoggerService} from './logger.service';


@bind({scope: BindingScope.TRANSIENT})
export class AccountsService {

  @inject(LoggerBindings.LOGGER)
  private loggerService: LoggerService;

  constructor(
    @inject(SecurityBindings.USER) private currentUserProfile: UserProfile,
    @repository(AccountRepository)
    public accountRepository: AccountRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) { }

  async create(account: Account): Promise<Account> {
    this.loggerService.logger.debug('IN AccountsService.create: >>>> %o', account);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    const createdAccount: Account = await this.accountRepository.create(account);
    const createdRoles: Role[] = await this.addDefaultRoles(createdAccount.getId());
    createdRoles.forEach(async role => {
      if(role.name == 'admin'){
        // this.loggerService.logger.debug('userId: >>>> %o, Role: %o', this.currentUserProfile[securityId], role);
        await this.userRepository.roles(this.currentUserProfile[securityId]).link(role.id);
        // this.loggerService.logger.debug('Role Assigned to User: >>>> %o', role.id);
      }
    });

    if(!this.currentUserProfile.defaultAccountId){
      this.currentUserProfile.defaultAccountId = createdAccount.id;
      await this.userRepository.updateById(this.currentUserProfile[securityId], this.currentUserProfile);
    }
    
    return Promise.resolve(createdAccount);

  }

  async count(where?: Where<Account>): Promise<any> {
    this.loggerService.logger.debug('IN AccountsService.count: >>>> %o', where);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `account`,
      );
    }

    return this.accountRepository.count(where);

  }

  async find(filter?: Filter<Account>): Promise<any> {
    this.loggerService.logger.debug('IN AccountsService.find: >>>> %o', filter);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.find(filter);

  }

  async updateAll(account: Account, where?: Where<Account>): Promise<any> {
    this.loggerService.logger.debug('IN AccountsService.updateAll: >>>> %o', account);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.updateAll(account, where);

  }

  async findById(id: string, filter?: Filter<Account>): Promise<Account> {
    this.loggerService.logger.debug('IN AccountsService.findById: >>>> %o', filter);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.findById(id, filter);

  }

  async updateById(id: string, account: Account): Promise<any> {
    this.loggerService.logger.debug('IN AccountsService.updateById: >>>> %o', account);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.updateById(id, account);

  }

  async replaceById(id: string, account: Account): Promise<any> {
    this.loggerService.logger.debug('IN AccountsService.replaceById: >>>> %o', account);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.replaceById(id, account);

  }

  async deleteById(id: string): Promise<any> {
    this.loggerService.logger.debug('IN AccountsService.deleteById, id: %o', id);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    await this.userRepository.roles(this.currentUserProfile[securityId]).unlinkAll();
    await this.deleteRoles(id, {"accountId": id});
    return this.accountRepository.deleteById(id);

  }

  async addRole(accountId: string, role: Role): Promise<Role> {
    this.loggerService.logger.debug('IN AccountsService.createRole: %o', role);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.roles(accountId).create(role);

  }

  async addRoles(accountId: string, roles: Role[]): Promise<Role[]> {
    this.loggerService.logger.debug('IN AccountsService.createRoles: %o', roles);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    let createdRoles: Role[] = [];
    for (const role of roles) {
      role.accountId = accountId;
      const roleCreated = await this.accountRepository.roles(accountId).create(role);
      createdRoles.push(roleCreated);
    }
    return Promise.resolve(createdRoles);

  }

  async findRole(accountId: string, filter?: Filter<Role>): Promise<any> {
    this.loggerService.logger.debug('IN AccountsService.findRole, filter: %o', filter);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.roles(accountId).find(filter);

  }


  async updateAllRoles(accountId: string, role: Role, where?: Where<Role>): Promise<any> {
    this.loggerService.logger.debug('IN AccountsService.updateAllRoles, where: %o', where);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.roles(accountId).patch(role, where);

  }

  async deleteRoles(accountId: string, where?: Where<Role>): Promise<any> {
    this.loggerService.logger.debug('IN AccountsService.deleteRoles, where: %o', where);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.roles(accountId).delete(where);

  }

  async assignRoleToUser(userId: string, roleId: number){
    this.loggerService.logger.debug('IN AccountsService.assignRoleToUser, userId: %o, roleId: %o', userId, roleId);
    let user = await this.userRepository.findById(userId);
    if(user){
      await this.userRepository.roles(userId).link(roleId);
    }
    
  }

  private async addDefaultRoles(accountId: string): Promise<Role[]>{
    const defaultRoles: any[] = [
      {
        "name": "admin"
      },
      {
        "name": "member"
      },
      {
        "name": "guest"
      }
    ]

    return await this.addRoles(accountId, defaultRoles);
  }


}
