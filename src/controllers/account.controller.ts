import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
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
import {Account, Role} from '../models';
import {AccountsService} from '../services/account.service';

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
    console.log('IN AccountController.createAccount: >> ', account);
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
    @param.filter(Account) filter?: Filter<Account>,
  ): Promise<Account[]> {
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
    @param.where(Account) where?: Where<Account>,
  ): Promise<Count> {
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
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.accountsService.deleteById(id);
  }


  @authenticate('jwt')
  @post('/{accountId}/role')
  async createRole(
    @param.path.string('accountId') accountId: typeof Account.prototype.id,
    @requestBody() role: Role,
  ): Promise<Role> {
    if (accountId) {
      const account = await this.accountsService.findById(accountId);
      if (account) {
        return this.accountsService.createRole(accountId, role);
      } else {
        throw new HttpErrors.BadRequest('Account not found..' + accountId);
      }

    } else {
      throw new HttpErrors.BadRequest('Account missing..');
    }

  }

}
