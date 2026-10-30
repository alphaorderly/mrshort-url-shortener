import { QueryFailedError } from 'typeorm';

const UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  return (
    (error.driverError as { code?: string } | undefined)?.code ===
    UNIQUE_VIOLATION
  );
}
