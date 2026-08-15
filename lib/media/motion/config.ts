/**
 * Server-only motion provider configuration.
 * Never import from client components.
 * Never use NEXT_PUBLIC_* for credentials.
 *
 * M09 finding: no genuinely free image/text-to-video API is available
 * for this milestone under the absolute-free development requirement.
 * Cloudflare Workers AI video models exist but are not confirmed as
 * reliably free for video generation without paid Workers AI spend risk.
 * Hugging Face / Replicate / Fal / Runway video paths are paid or trial-credit based.
 */

export function isMotionProviderConfigured(): boolean {
  // Intentionally false until a verified free motion provider is selected.
  return false;
}

export function getMotionProviderUnavailableReason(): string {
  return "Motion architecture is complete, but no genuinely free API is currently available for this generation path.";
}
