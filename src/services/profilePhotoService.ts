import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/src/services/firebaseClient';

interface UploadProfilePhotoInput {
  uri: string;
  userId: string;
  fileName?: string | null;
  mimeType?: string | null;
}

interface UploadProfilePhotoResult {
  url: string;
}

function safeFileName(fileName?: string | null) {
  const fallback = `profile-photo-${Date.now()}.jpg`;
  return (fileName || fallback).replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function uploadProfilePhoto(input: UploadProfilePhotoInput): Promise<UploadProfilePhotoResult> {
  const response = await fetch(input.uri);
  if (!response.ok) {
    throw new Error('Unable to read selected image.');
  }

  const blob = await response.blob();
  const name = safeFileName(input.fileName);
  const path = `profile-photos/${input.userId}/${Date.now()}-${name}`;
  const photoRef = ref(storage, path);

  await uploadBytes(photoRef, blob, {
    contentType: input.mimeType || blob.type || 'image/jpeg',
  });

  const url = await getDownloadURL(photoRef);
  return { url };
}

