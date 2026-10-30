export const APP_CONFIG = Symbol('APP_CONFIG');

export interface DbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  serviceName: string;
  sessionTtlSeconds: number;
  admin: { username: string; password: string } | null;
  webDist: string;
  db: DbConfig;
  redis: RedisConfig;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const missing: string[] = [];

  const required = (name: string): string => {
    const value = env[name]?.trim();
    if (!value) {
      missing.push(name);
      return '';
    }
    return value;
  };

  const integer = (name: string, fallback: number): number => {
    const raw = env[name]?.trim();
    if (!raw) return fallback;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Error(`${name} 는 0 이상의 정수여야 합니다.`);
    }
    return parsed;
  };

  const adminId = env.ADMIN_ID?.trim();
  const adminPassword = env.ADMIN_PASSWORD;

  const config: AppConfig = {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: integer('PORT', 3000),
    serviceName: env.SERVICE_NAME?.trim() || 'MrShort',
    sessionTtlSeconds: integer('SESSION_TTL_DAYS', 30) * 24 * 60 * 60,
    admin:
      adminId && adminPassword
        ? { username: adminId, password: adminPassword }
        : null,
    webDist: env.WEB_DIST?.trim() || `${process.cwd()}/web/dist`,
    db: {
      host: required('DB_HOST'),
      port: integer('DB_PORT', 5432),
      username: required('DB_USERNAME'),
      password: required('DB_PASSWORD'),
      database: required('DB_DATABASE'),
    },
    redis: {
      host: required('REDIS_HOST'),
      port: integer('REDIS_PORT', 6379),
      password: env.REDIS_PASSWORD || undefined,
      db: integer('REDIS_DB', 0),
    },
  };

  if (missing.length > 0) {
    throw new Error(`필수 환경변수가 없습니다: ${missing.join(', ')}`);
  }
  return config;
}
