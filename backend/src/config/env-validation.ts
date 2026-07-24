/**
 * Fail-fast validation of security-critical environment variables.
 *
 * Invoked at the very start of bootstrap so the application refuses to start
 * in an insecure state, rather than silently falling back to a weak default
 * or failing later at the first token-sign / crypto call.
 */

const KNOWN_WEAK_VALUES = [
  'default-secret-change-in-production',
  'default-jwt-secret-change-in-production',
  'default-encryption-key-change-in-production',
  'your_jwt_secret_here',
  'your_password_here',
  'changeme',
  'secret',
  'password',
];

function isWeak(value?: string): boolean {
  if (!value) return true;
  const v = value.trim();
  if (v.length < 16) return true;
  return KNOWN_WEAK_VALUES.includes(v);
}

export function validateEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const isProd = env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  // JWT_SECRET is required in EVERY environment: without it tokens cannot be
  // signed or verified safely. This converts a late runtime failure into a
  // clear failure at boot for correctly-configured deployments.
  if (!env.JWT_SECRET) {
    errors.push('JWT_SECRET is required but is not set.');
  } else if (isProd && isWeak(env.JWT_SECRET)) {
    errors.push(
      'JWT_SECRET is weak or a known default; use a strong random secret (>= 16 chars) in production.',
    );
  }

  // Secrets that should not run on defaults in production. Warn (not fail) to
  // avoid breaking existing deployments, while making the risk visible.
  if (isProd) {
    for (const name of ['DATABASE_PASSWORD', 'SESSION_SECRET', 'ENCRYPTION_KEY']) {
      if (isWeak(env[name])) {
        warnings.push(`${name} is unset or weak in production; set a strong value.`);
      }
    }
  }

  for (const w of warnings) {
    // eslint-disable-next-line no-console
    console.warn(`[env-validation] WARNING: ${w}`);
  }

  if (errors.length > 0) {
    throw new Error(
      'Insecure or incomplete environment configuration:\n  - ' + errors.join('\n  - '),
    );
  }
}
