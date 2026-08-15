import { CloudflareImageProvider } from "@/lib/media/image/cloudflare-provider";
import type { ImageProvider } from "@/lib/media/image/types";

let cachedProvider: ImageProvider | null = null;

/**
 * Returns the configured ImageProvider.
 * M08: Cloudflare Workers AI only.
 * Swap implementations here later without changing compiler/UI.
 */
export function getImageProvider(): ImageProvider {
  if (!cachedProvider) {
    cachedProvider = new CloudflareImageProvider();
  }
  return cachedProvider;
}
