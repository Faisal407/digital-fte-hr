/**
 * Secrets management utility
 * Never hardcode API keys - use this wrapper
 */

const secretsCache = new Map<string, { value: string; expiresAt: number }>();

export async function getSecret(secretName: string): Promise<string> {
  // Check cache (5 minute TTL)
  const cached = secretsCache.get(secretName);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // Try environment variable first
  const envValue = process.env[secretName];
  if (envValue) {
    return envValue;
  }

  // In production, fetch from AWS Secrets Manager
  if (process.env.NODE_ENV === "production") {
    try {
      const { SecretsManagerClient, GetSecretValueCommand } = await import(
        "@aws-sdk/client-secrets-manager"
      );

      const client = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await client.send(command);

      const secretValue = response.SecretString || response.SecretBinary;
      if (!secretValue) {
        throw new Error(`Secret ${secretName} is empty`);
      }

      // Cache the secret (5 minute TTL)
      secretsCache.set(secretName, {
        value: secretValue,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      return secretValue;
    } catch (error) {
      throw new Error(`Failed to fetch secret ${secretName}: ${error}`);
    }
  }

  throw new Error(`Secret ${secretName} not found in environment or AWS Secrets Manager`);
}

export function clearSecretsCache(): void {
  secretsCache.clear();
}

export async function getSecretAsJson<T>(secretName: string): Promise<T> {
  const secretValue = await getSecret(secretName);
  return JSON.parse(secretValue);
}
