import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/src/services/firebaseClient';

interface UploadOrderArtworkInput {
  uri: string;
  salesUserId: string;
  fileName?: string | null;
  mimeType?: string | null;
}

interface UploadOrderArtworkResult {
  url: string;
  path: string;
}

function safeFileName(fileName?: string | null) {
  const fallback = `card-artwork-${Date.now()}.jpg`;
  return (fileName || fallback).replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function uploadOrderArtwork(input: UploadOrderArtworkInput): Promise<UploadOrderArtworkResult> {
  const response = await fetch(input.uri);
  if (!response.ok) {
    throw new Error('Unable to read selected artwork.');
  }

  const blob = await response.blob();
  const name = safeFileName(input.fileName);
  const path = `order-artwork/${input.salesUserId}/${Date.now()}-${name}`;
  const artworkRef = ref(storage, path);

  await uploadBytes(artworkRef, blob, {
    contentType: input.mimeType || blob.type || 'image/jpeg',
  });

  const url = await getDownloadURL(artworkRef);
  return { url, path };
}
