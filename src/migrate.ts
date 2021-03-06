import * as dotenv from "dotenv";
import {AuthApplication} from './application';

export async function migrate(args: string[]) {

  dotenv.config();
  let env_path = process.env.NODE_ENV;
  if (env_path) {
    dotenv.config({path: env_path});
  }

  const existingSchema = args.includes('--rebuild') ? 'drop' : 'alter';
  console.log('Migrating schemas (%s existing schema)', existingSchema);
  // console.log(process.env.TENANT_ID);

  const app = new AuthApplication();
  await app.boot();
  await app.migrateSchema({existingSchema});
  

  // Connectors usually keep a pool of opened connections,
  // this keeps the process running even after all work is done.
  // We need to exit explicitly.
  process.exit(0);
}

migrate(process.argv).catch(err => {
  console.error('Cannot migrate database schema', err);
  process.exit(1);
});
