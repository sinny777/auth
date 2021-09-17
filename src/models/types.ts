export type Credentials = {
  email: string;
  password: string;
  name: string;
};

export enum AccountType {
  MANUFACTURER = 'MANUFACTURER',
  FAMILY = 'FAMILY',
  DEPARTMENT = 'DEPARTMENT',
  DEFAULT = 'DEFAULT',
  GEO = 'GEO',
  OTHER = 'OTHER'
}
