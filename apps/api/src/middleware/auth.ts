import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { MiddlewareHandler } from 'hono';
import type { AppContext, AppEnv } from '../env';
import { errorResponse } from '../lib/errors';

export interface AccessIdentity {
  email?: string;
  subject?: string;
}

export interface AccessVerifier {
  verify(token: string, env: AppEnv): Promise<AccessIdentity>;
}

export class AccessConfigurationError extends Error {
  constructor(message = 'Cloudflare Access no esta configurado.') {
    super(message);
    this.name = 'AccessConfigurationError';
  }
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function normalizeTeamDomain(teamDomain: string): string {
  return teamDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function getJwks(teamDomain: string) {
  const cached = jwksCache.get(teamDomain);
  if (cached) {
    return cached;
  }

  const jwks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
  jwksCache.set(teamDomain, jwks);
  return jwks;
}

export function createAccessVerifier(): AccessVerifier {
  return {
    async verify(token, env) {
      if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
        throw new AccessConfigurationError();
      }

      const teamDomain = normalizeTeamDomain(env.ACCESS_TEAM_DOMAIN);
      const { payload } = await jwtVerify(token, getJwks(teamDomain), {
        issuer: `https://${teamDomain}`,
        audience: env.ACCESS_AUD,
      });

      return {
        email: typeof payload.email === 'string' ? payload.email : undefined,
        subject: typeof payload.sub === 'string' ? payload.sub : undefined,
      };
    },
  };
}

export function requireAdmin(
  options: { verifier?: AccessVerifier } = {},
): MiddlewareHandler<AppContext> {
  const verifier = options.verifier ?? createAccessVerifier();

  return async (c, next) => {
    c.header('Cache-Control', 'no-store, private');

    if (!c.env.ACCESS_TEAM_DOMAIN || !c.env.ACCESS_AUD) {
      return errorResponse(
        c,
        'admin_auth_not_configured',
        'La autenticacion administrativa no esta configurada.',
        503,
      );
    }

    const token = c.req.header('Cf-Access-Jwt-Assertion');
    if (!token) {
      return errorResponse(c, 'unauthorized', 'Se requiere autenticacion administrativa.', 401);
    }

    try {
      const identity = await verifier.verify(token, c.env);
      if (identity.email) {
        c.set('adminEmail', identity.email);
      }
      await next();
    } catch (error) {
      if (error instanceof AccessConfigurationError) {
        return errorResponse(
          c,
          'admin_auth_not_configured',
          'La autenticacion administrativa no esta configurada.',
          503,
        );
      }

      return errorResponse(c, 'unauthorized', 'Token administrativo invalido.', 401);
    }
  };
}
