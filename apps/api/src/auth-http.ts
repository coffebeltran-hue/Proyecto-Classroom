import { randomBytes, createHash } from 'node:crypto';

export const SESSION_COOKIE = 'vmat_session';
export const OAUTH_COOKIE = 'vmat_oauth';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createOAuthSecrets() {
  const state = randomBytes(32).toString('base64url');
  const binding = randomBytes(32).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');

  const challenge = createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return {
    state,
    binding,
    verifier,
    challenge,
  };
}

export function encodeOAuthCookie(
  binding: string,
  verifier: string,
): string {
  return `${binding}.${verifier}`;
}

export function decodeOAuthCookie(
  value: string | undefined,
): { binding: string; verifier: string } | null {
  if (!value) return null;

  const parts = value.split('.');

  if (
    parts.length !== 2 ||
    !TOKEN_PATTERN.test(parts[0]!) ||
    !TOKEN_PATTERN.test(parts[1]!)
  ) {
    return null;
  }

  return {
    binding: parts[0]!,
    verifier: parts[1]!,
  };
}

export function readCookie(
  header: string | undefined,
  name: string,
): string | undefined {
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;

    const key = part.slice(0, separator).trim();
    if (key !== name) continue;

    return part.slice(separator + 1).trim();
  }

  return undefined;
}

interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  secure: boolean;
  path?: string;
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions,
): string {
  const parts = [
    `${name}=${value}`,
    `Path=${options.path ?? '/'}`,
    'HttpOnly',
    'SameSite=Lax',
  ];

  if (options.secure) {
    parts.push('Secure');
  }

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  return parts.join('; ');
}

export function clearCookie(
  name: string,
  secure: boolean,
  path = '/',
): string {
  return serializeCookie(name, '', {
    secure,
    path,
    maxAge: 0,
    expires: new Date(0),
  });
}

export function validOpaqueToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_PATTERN.test(value);
}

export function validState(value: unknown): value is string {
  return validOpaqueToken(value);
}

export function validOAuthCode(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= 512 &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

export function validOrigin(
  origin: string | undefined,
  expectedOrigin: string,
): boolean {
  return origin === expectedOrigin;
}