import { GUEST_DEMO_QR_CODES } from '@/src/constants/guestDemo';

const SLUG_PATTERN = /(?:biocloud\.app\/c\/|\/public\/)([a-z0-9-]+)/i;

export function parseScanPayloadToSlug(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(SLUG_PATTERN);
  if (urlMatch?.[1]) return urlMatch[1].toLowerCase();

  const demo = GUEST_DEMO_QR_CODES.find(
    (item) => item.payload === trimmed || item.slug === trimmed.toLowerCase()
  );
  if (demo) return demo.slug;

  if (/^[a-z0-9-]{3,40}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  return null;
}
