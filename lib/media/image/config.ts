/**
 * Server-only image provider configuration.
 * Never import from client components.
 * Never use NEXT_PUBLIC_* for credentials.
 */

export const DEFAULT_CLOUDFLARE_IMAGE_MODEL =
  "@cf/black-forest-labs/flux-1-schnell";

/** FLUX.1 schnell prompt hard limit. */
export const IMAGE_PROMPT_MAX_LENGTH = 2048;

export function getCloudflareAccountId(): string | null {
  const value = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  return value || null;
}

export function getCloudflareApiToken(): string | null {
  const value = process.env.CLOUDFLARE_API_TOKEN?.trim();
  return value || null;
}

export function getCloudflareImageModel(): string {
  const fromEnv = process.env.CLOUDFLARE_IMAGE_MODEL?.trim();
  return fromEnv || DEFAULT_CLOUDFLARE_IMAGE_MODEL;
}

export function isImageProviderConfigured(): boolean {
  return Boolean(getCloudflareAccountId() && getCloudflareApiToken());
}

export function assertImageProviderConfigured(): {
  accountId: string;
  apiToken: string;
  model: string;
} {
  const accountId = getCloudflareAccountId();
  const apiToken = getCloudflareApiToken();

  if (!accountId || !apiToken) {
    throw new Error(
      "Image generation is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN on the server.",
    );
  }

  return {
    accountId,
    apiToken,
    model: getCloudflareImageModel(),
  };
}
