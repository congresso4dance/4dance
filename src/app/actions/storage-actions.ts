"use server";
import { securelyLoadAndSignPhotos } from '@/utils/secure-photo-signing';

type DisplayPhoto = { id: string; [key: string]: unknown };

export async function signDisplayPhotos(photos: DisplayPhoto[]): Promise<DisplayPhoto[]> {
  return securelyLoadAndSignPhotos(photos.map((photo) => photo.id));
}
