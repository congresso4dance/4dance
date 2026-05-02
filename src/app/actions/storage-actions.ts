"use server";

import { signPhotoUrls } from '@/utils/storage-helper';

type DisplayPhoto = {
  id: string;
  thumbnail_url?: string | null;
  full_res_url?: string | null;
  [key: string]: unknown;
};

export async function signDisplayPhotos(photos: DisplayPhoto[]): Promise<DisplayPhoto[]> {
  if (!photos || photos.length === 0) return photos;
  return signPhotoUrls(photos);
}
