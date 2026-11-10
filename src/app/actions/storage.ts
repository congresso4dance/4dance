"use server";
import { securelyLoadAndSignPhotos } from '@/utils/secure-photo-signing';

type PhotoInput = { id: string };

export async function getSignedUrlsAction(photos: PhotoInput[]) {
  return securelyLoadAndSignPhotos(photos.map((photo) => photo.id));
}

export async function getSignedUrlAction(photoId: string) {
  const [photo] = await securelyLoadAndSignPhotos([photoId]);
  return photo?.full_res_url ?? photo?.thumbnail_url ?? null;
}
