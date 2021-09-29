import { UserProfile } from "@loopback/security";

export type Credentials = {
  accessType: AccessType;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type RefreshTokenReq = {
  tenantId: string;
  accountId: string;
  userId: string;
  refreshToken: string;
};

export type Tokens = {
  user: UserProfile;
  token: string;
  refreshToken: string;
};

export enum AccountType {
  MANUFACTURER = 'MANUFACTURER',
  FAMILY = 'FAMILY',
  DEPARTMENT = 'DEPARTMENT',
  DEFAULT = 'DEFAULT',
  GEO = 'GEO',
  VIRTUAL = 'VIRTUAL',
  GROUP = 'GROUP',
  OTHER = 'OTHER'
}

export enum AccessType {
  online = 'online',
  offline = 'offline'
}
