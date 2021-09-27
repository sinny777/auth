import { UserProfile } from "@loopback/security";

export type Credentials = {
  email: string;
  password: string;
  name: string;
};

export type RefreshTokenReq = {
  tenantId: string;
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
  OTHER = 'OTHER'
}
