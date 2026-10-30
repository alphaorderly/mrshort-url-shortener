import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { loadConfig } from '../config/app.config';
import { buildDataSourceOptions } from './typeorm.config';

// typeorm CLI(`yarn migration:run`)용 진입점
try {
  process.loadEnvFile('.env');
} catch {
  // .env 가 없으면 이미 주입된 환경변수를 그대로 쓴다.
}

export default new DataSource(buildDataSourceOptions(loadConfig().db));
