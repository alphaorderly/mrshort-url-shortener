export interface SessionUser {
  id: number;
  username: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: SessionUser;
    sid?: string;
  }
}
