import {bind, /* inject, */ BindingScope, inject} from '@loopback/core';
import {Filter, repository, Where} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {LoggerBindings} from '.';
import {Account, Role} from '../models';
import {AccountRepository} from '../repositories';
import {LoggerService} from './logger.service';


@bind({scope: BindingScope.TRANSIENT})
export class AccountsService {

  @inject(LoggerBindings.LOGGER)
  private loggerService: LoggerService;

  constructor(
    @inject(SecurityBindings.USER) private currentUserProfile: UserProfile,
    @repository(AccountRepository)
    public accountRepository: AccountRepository,
  ) { }

  async create(account: Account): Promise<Account> {
    this.loggerService.logger.info('IN AccountsService.create: >>>> %o', account);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.create(account);

  }

  async count(where?: Where<Account>): Promise<any> {
    this.loggerService.logger.info('IN AccountsService.count: >>>> %o', where);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `account`,
      );
    }

    return this.accountRepository.count(where);

  }

  async find(filter?: Filter<Account>): Promise<any> {
    this.loggerService.logger.info('IN AccountsService.find: >>>> %o', filter);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.find(filter);

  }

  async updateAll(account: Account, where?: Where<Account>): Promise<any> {
    this.loggerService.logger.info('IN AccountsService.updateAll: >>>> %o', account);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.updateAll(account, where);

  }

  async findById(id: string, filter?: Filter<Account>): Promise<Account> {
    this.loggerService.logger.info('IN AccountsService.findById: >>>> %o', filter);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.findById(id, filter);

  }

  async updateById(id: string, account: Account): Promise<any> {
    this.loggerService.logger.info('IN AccountsService.updateById: >>>> %o', account);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.updateById(id, account);

  }

  async replaceById(id: string, account: Account): Promise<any> {
    this.loggerService.logger.info('IN AccountsService.replaceById: >>>> %o', account);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.replaceById(id, account);

  }

  async deleteById(id: string): Promise<any> {
    this.loggerService.logger.info('IN AccountsService.deleteById, id: %o', id);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.deleteById(id);

  }

  async addRole(accountId: string, role: Role): Promise<Role> {
    this.loggerService.logger.info('IN AccountsService.createRole: %o', role);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.roles(accountId).create(role);

  }

  async findRole(accountId: string, filter?: Filter<Role>): Promise<any> {
    this.loggerService.logger.info('IN AccountsService.findRole, filter: %o', filter);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.roles(accountId).find(filter);

  }


  async updateAllRoles(accountId: string, role: Role, where?: Where<Role>): Promise<any> {
    this.loggerService.logger.info('IN AccountsService.updateAllRoles, where: %o', where);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.roles(accountId).patch(role, where);

  }

  async deleteRoles(accountId: string, where?: Where<Role>): Promise<any> {
    this.loggerService.logger.info('IN AccountsService.deleteRoles, where: %o', where);
    if (!this.currentUserProfile) {
      throw new HttpErrors.Unauthorized(
        `Unauthorized Access...`,
      );
    }

    return this.accountRepository.roles(accountId).delete(where);

  }


}
