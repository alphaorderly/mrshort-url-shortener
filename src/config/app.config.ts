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
  /** express 의 `trust proxy` 값. */
  trustProxy: boolean | number | string;
  cookieSecure: 'auto' | boolean;
  sessionTtlSeconds: number;
  /** 예전 SHA-256 해시를 검증하기 위한 솔트. 새 설치에서는 비어 있어도 된다. */
  legacyHashSalt: string;
  admin: { username: string; password: string } | null;
  allowedOrigins: string[];
  webDist: string;
  db: DbConfig;
  redis: RedisConfig;
}

function parseTrustProxy(raw: string | undefined): AppConfig['trustProxy'] {
  const value = raw?.trim();
  if (!value || value === 'false') return false;
  if (value === 'true') return true;
  if (/^\d+$/.test(value)) return Number.parseInt(value, 10);
  return value;
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

  // 예전 ID/PW 이름도 받는다. compose 가 빈 문자열로 넘겨도 비어 있지 않은 쪽을 쓴다.
  const adminId = env.ADMIN_ID?.trim() || env.ID?.trim();
  const adminPassword = env.ADMIN_PASSWORD || env.PW;

  const config: AppConfig = {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: integer('PORT', 3000),
    serviceName: env.SERVICE_NAME?.trim() || 'MrShort',
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    cookieSecure:
      env.COOKIE_SECURE === 'true'
        ? true
        : env.COOKIE_SECURE === 'false'
          ? false
          : 'auto',
    sessionTtlSeconds: integer('SESSION_TTL_DAYS', 30) * 24 * 60 * 60,
    legacyHashSalt: env.HASH_SALT ?? '',
    admin:
      adminId && adminPassword
        ? { username: adminId, password: adminPassword }
        : null,
    allowedOrigins: (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
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
