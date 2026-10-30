import { DataSourceOptions } from 'typeorm';
import { DbConfig } from '../config/app.config';
import { Click } from '../links/click.entity';
import { Link } from '../links/link.entity';
import { User } from '../users/user.entity';
import { migrations } from './migrations';

export function buildDataSourceOptions(db: DbConfig): DataSourceOptions {
  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.database,
    entities: [User, Link, Click],
    migrations,
    synchronize: false,
  };
}
