"use server";

import { signPhotoUrls, signSingleUrl } from "@/utils/storage-helper";

/**
 * Server Action to sign multiple photo URLs.
 * Useful for client components that need to display photos from private buckets.
 */
export async function getSignedUrlsAction(photos: any[]) {
  try {
    return await signPhotoUrls(photos);
  } catch (error) {
    console.error('Failed to sign URLs in action:', error);
    return photos;
  }
}

/**
 * Server Action to sign a single URL (e.g. cover_url).
 */
export async function getSignedUrlAction(url: string | null | undefined) {
  try {
    return await signSingleUrl(url);
  } catch (error) {
    console.error('Failed to sign URL in action:', error);
    return url || null;
  }
}
