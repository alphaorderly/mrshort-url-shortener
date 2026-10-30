export interface AppConfig {
  serviceName: string;
}

export interface SessionUser {
  id: number;
  username: string;
}

export interface LinkView {
  id: number;
  code: string;
  originalUrl: string;
  hasPassword: boolean;
  expiresAt: string | null;
  expired: boolean;
  createdAt: string;
  clickCount: number;
}

export interface LinkStats {
  link: LinkView;
  total: number;
  last7: number;
  last30: number;
  daily: { date: string; count: number }[];
  recent: string[];
}

export interface CreateLinkInput {
  url: string;
  expiresAt?: string;
  password?: string;
  code?: string;
}

export interface Invite {
  token: string;
  expiresAt: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** 입력 항목별 오류 메시지 (검증 실패 시) */
    readonly fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let onUnauthorized: (() => void) | undefined;

/** 로그인이 필요한 요청이 401 을 받으면 호출된다. 세션이 만료됐을 때 로그인 화면으로 보내는 데 쓴다. */
export function setUnauthorizedHandler(handler: (() => void) | undefined): void {
  onUnauthorized = handler;
}

const HANGUL = /[가-힣]/;

function friendlyMessage(status: number, message: unknown): string {
  if (typeof message === 'string' && HANGUL.test(message)) return message;
  if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도하세요.';
  if (status === 403) return '이 요청은 허용되지 않습니다.';
  if (status === 404) return '요청한 항목을 찾을 수 없습니다.';
  if (status >= 500) return '서버에 문제가 생겼습니다. 잠시 후 다시 시도하세요.';
  return '요청을 처리하지 못했습니다. 입력한 내용을 확인하세요.';
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: { ignoreUnauthorized?: boolean } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, '서버에 연결할 수 없습니다. 네트워크를 확인하고 다시 시도하세요.');
  }

  if (response.ok) {
    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  }

  const payload = (await response.json().catch(() => null)) as {
    message?: unknown;
    errors?: Record<string, string[]>;
  } | null;

  if (response.status === 401 && !options.ignoreUnauthorized) onUnauthorized?.();

  throw new ApiError(
    response.status,
    friendlyMessage(response.status, payload?.message),
    payload?.errors ?? {},
  );
}

const enc = encodeURIComponent;

export const api = {
  config: () => request<AppConfig>('GET', '/api/config'),

  /** 로그인하지 않았으면 null */
  me: async (): Promise<SessionUser | null> =>
    (await request<{ user: SessionUser | null }>('GET', '/api/auth/me')).user,
  login: (username: string, password: string) =>
    request<SessionUser>('POST', '/api/auth/login', { username, password }, { ignoreUnauthorized: true }),
  logout: () => request<void>('POST', '/api/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('POST', '/api/auth/password', { currentPassword, newPassword }),

  links: () => request<LinkView[]>('GET', '/api/links'),
  createLink: (input: CreateLinkInput) => request<LinkView>('POST', '/api/links', input),
  deleteLink: (code: string) => request<void>('DELETE', `/api/links/${enc(code)}`),
  linkStats: (code: string) => request<LinkStats>('GET', `/api/links/${enc(code)}/stats`),
  unlock: (code: string, password: string) =>
    request<{ url: string }>('POST', `/api/links/${enc(code)}/unlock`, { password }),

  createInvite: () => request<Invite>('POST', '/api/invites'),
  /** 초대 링크가 아직 유효한지 확인한다. */
  checkInvite: async (token: string): Promise<boolean> => {
    try {
      await request<void>('GET', `/api/invites/${enc(token)}`);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return false;
      throw error;
    }
  },
  register: (input: { token: string; username: string; password: string }) =>
    request<SessionUser>('POST', '/api/register', input, { ignoreUnauthorized: true }),
};
