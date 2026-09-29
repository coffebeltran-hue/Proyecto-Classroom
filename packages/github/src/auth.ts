import { Octokit } from 'octokit';

export interface GitHubAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface GitHubUserIdentity {
  id: bigint;
  login: string;
  avatarUrl: string | null;
}

export interface GitHubAuthorizationInput {
  state: string;
  challenge: string;
}

export interface GitHubCodeExchangeInput {
  code: string;
  verifier: string;
}

function requireHttpsOrLoopback(value: string): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('GITHUB_AUTH_CONFIGURATION_INVALID');
  }

  const loopback =
    url.protocol === 'http:' &&
    (url.hostname === '127.0.0.1' || url.hostname === 'localhost');

  if (url.protocol !== 'https:' && !loopback) {
    throw new Error('GITHUB_AUTH_CONFIGURATION_INVALID');
  }

  return url;
}

export function createGitHubAuth(config: GitHubAuthConfig) {
  const clientId = config.clientId.trim();
  const clientSecret = config.clientSecret.trim();
  const callbackUrl = requireHttpsOrLoopback(config.callbackUrl).href;

  if (!clientId || !clientSecret) {
    throw new Error('GITHUB_AUTH_CONFIGURATION_INVALID');
  }

  return Object.freeze({
    createAuthorizationUrl(input: GitHubAuthorizationInput): string {
      if (!input.state || !input.challenge) {
        throw new Error('GITHUB_AUTH_REQUEST_INVALID');
      }

      const url = new URL('https://github.com/login/oauth/authorize');

      url.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        state: input.state,
        code_challenge: input.challenge,
        code_challenge_method: 'S256',
      }).toString();

      return url.href;
    },

    async exchangeCode(
      input: GitHubCodeExchangeInput,
    ): Promise<GitHubUserIdentity> {
      if (!input.code || !input.verifier) {
        throw new Error('GITHUB_AUTH_REQUEST_INVALID');
      }

      const response = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(15_000),
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: callbackUrl,
            code: input.code,
            code_verifier: input.verifier,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('GITHUB_AUTH_EXCHANGE_FAILED');
      }

      const grant = (await response.json()) as {
        access_token?: unknown;
        error?: unknown;
      };

      if (
        grant.error ||
        typeof grant.access_token !== 'string' ||
        !grant.access_token
      ) {
        throw new Error('GITHUB_AUTH_EXCHANGE_FAILED');
      }

      /*
       * Provider token deliberately remains local to this function.
       * It is used only to establish the GitHub identity.
       */
      const client = new Octokit({
        auth: grant.access_token,
        retry: { enabled: false },
        throttle: { enabled: false },
        log: {
          debug() {},
          info() {},
          warn() {},
          error() {},
        },
      });

      try {
        const { data: user } = await client.request('GET /user');

        if (
          !Number.isSafeInteger(user.id) ||
          user.id <= 0 ||
          typeof user.login !== 'string' ||
          !user.login
        ) {
          throw new Error('GITHUB_AUTH_USER_INVALID');
        }

        return {
          id: BigInt(user.id),
          login: user.login,
          avatarUrl:
            typeof user.avatar_url === 'string' ? user.avatar_url : null,
        };
      } finally {
        /*
         * No access token is returned, persisted or attached to the
         * resulting VMAT identity.
         */
        grant.access_token = undefined;
      }
    },
  });
}