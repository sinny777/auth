import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere, Where
} from '@loopback/repository';
import {
  api,
  del, get,
  getModelSchemaRef, HttpErrors, param, patch, post, put, requestBody,
  response,
  ResponseObject
} from '@loopback/rest';
import {Account, Role, User} from '../models';
import {LoggerBindings} from '../services';
import {AccountsService} from '../services/account.service';
import {LoggerService} from '../services/logger.service';

const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PingResponse',
        properties: {
          greeting: {type: 'string'},
          date: {type: 'string'},
          url: {type: 'string'},
          headers: {
            type: 'object',
            properties: {
              'Content-Type': {type: 'string'},
            },
            additionalProperties: true,
          },
        },
      },
    },
  },
};

@api({basePath: '/{tenantId}/accounts', paths: {}})
export class AccountController {

  @inject(LoggerBindings.LOGGER)
  private loggerService: LoggerService;

  constructor(
    @service(AccountsService)
    private accountsService: AccountsService,
  ) { }

  @authenticate('jwt')
  @post('/')
  @response(200, {
    description: 'Account model instance',
    content: {'application/json': {schema: getModelSchemaRef(Account)}},
  })
  async create(
    @param.path.string('tenantId') tenantId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Account, {
            title: 'NewAccount',
            exclude: ['id'],
          }),
        },
      },
    })
    account: Omit<Account, 'id'>
  ): Promise<Account> {
    this.loggerService.logger.info('IN AccountController.createAccount: >> ', account);
    account.tenantId = tenantId;
    return this.accountsService.create(account);
  }

  @authenticate('jwt')
  @get('/count')
  @response(200, {
    description: 'Account model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.path.string('tenantId') tenantId: string,
    @param.where(Account) where?: Where<Account>,
  ): Promise<Count> {
    return this.accountsService.count(where);
  }

  @authenticate('jwt')
  @get('/')
  @response(200, {
    description: 'Array of Account model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Account, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.path.string('tenantId') tenantId: string,
    @param.filter(Account) filter: Filter<Account>,
  ): Promise<Account[]> {
    if (filter) {
      if (!filter['where']) {
        filter['where'] = {"tenantId": tenantId};
      }
    } else {
      filter = {
        "where": {"tenantId": tenantId}
      }
    }
    return this.accountsService.find(filter);
  }

  @authenticate('jwt')
  @patch('/')
  @response(200, {
    description: 'Account PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Account, {partial: true}),
        },
      },
    })
    account: Account,
    @param.path.string('tenantId') tenantId: string,
    @param.where(Account) where?: Where<Account>,
  ): Promise<Count> {
    if (!where) {
      where = {"tenantId": tenantId};
    }
    return this.accountsService.updateAll(account, where);
  }

  @authenticate('jwt')
  @get('/{id}')
  @response(200, {
    description: 'Account model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Account, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('tenantId') tenantId: string,
    @param.path.string('id') id: string,
    @param.filter(Account, {exclude: 'where'}) filter?: FilterExcludingWhere<Account>
  ): Promise<Account> {
    return this.accountsService.findById(id, filter);
  }

  @authenticate('jwt')
  @patch('/{id}')
  @response(204, {
    description: 'Account PATCH success',
  })
  async updateById(
    @param.path.string('tenantId') tenantId: string,
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Account, {partial: true}),
        },
      },
    })
    account: Account,
  ): Promise<void> {
    await this.accountsService.updateById(id, account);
  }

  @authenticate('jwt')
  @put('/{id}')
  @response(204, {
    description: 'Account PUT success',
  })
  async replaceById(
    @param.path.string('tenantId') tenantId: string,
    @param.path.string('id') id: string,
    @requestBody() account: Account,
  ): Promise<void> {
    await this.accountsService.replaceById(id, account);
  }

  @authenticate('jwt')
  @del('/{id}')
  @response(204, {
    description: 'Account DELETE success',
  })
  async deleteById(
    @param.path.string('tenantId') tenantId: string,
    @param.path.string('id') id: string
    ): Promise<void> {
    await this.accountsService.deleteById(id);
  }

  @authenticate('jwt')
  @post('/{accountId}/role')
  async addRole(
    @param.path.string('accountId') accountId: typeof Account.prototype.id,
    @requestBody() role: Role,
  ): Promise<Role> {
    if (accountId) {
      const account = await this.accountsService.findById(accountId);
      if (account) {
        return this.accountsService.addRole(accountId, role);
      } else {
        throw new HttpErrors.BadRequest('Account not found..' + accountId);
      }

    } else {
      throw new HttpErrors.BadRequest('Account missing..');
    }

  }

  @authenticate('jwt')
  @get('/{accountId}/role/')
  @response(200, {
    description: 'Array of Account model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Account, {includeRelations: true}),
        },
      },
    },
  })
  async findRole(
    @param.path.string('tenantId') tenantId: string,
    @param.path.string('accountId') accountId: typeof Account.prototype.id,
    @param.filter(Role) filter?: Filter<Role>,
  ): Promise<Account[]> {
    if (accountId) {
      return this.accountsService.findRole(accountId, filter);
    } else {
      throw new HttpErrors.BadRequest('Invalid AccountId: ' + accountId);
    }
  }

  @authenticate('jwt')
  @patch('/{accountId}/role/')
  @response(200, {
    description: 'Role PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAllRoles(
    @param.path.string('tenantId') tenantId: string,
    @param.path.string('accountId') accountId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Role, {partial: true}),
        },
      },
    })
    role: Role,
    @param.where(Role) where?: Where<Role>,
  ): Promise<Count> {
    return this.accountsService.updateAllRoles(accountId, role, where);
  }


  @authenticate('jwt')
  @del('/{accountId}/role/')
  @response(200, {
    description: 'Role PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async deleteRoles(
    @param.path.string('tenantId') tenantId: string,
    @param.path.string('accountId') accountId: string,
    @param.where(Role) where?: Where<Role>,
  ): Promise<Count> {
    return this.accountsService.deleteRoles(accountId, where);
  }

  @authenticate('jwt')
  @post('/{accountId}/user/{userId}/role')
  async assignRoleToUser(
    @param.path.string('tenantId') tenantId: string,
    @param.path.string('accountId') accountId: typeof Account.prototype.id,
    @param.path.string('userId') userId: typeof User.prototype.id,
    @requestBody() role: Role,
  ): Promise<any> {

    return this.accountsService.assignRoleToUser(userId, role.id);

  }

}
