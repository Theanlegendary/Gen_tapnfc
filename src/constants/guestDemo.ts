import type { BioPage } from '@/src/types/models';

export const GUEST_SAMPLE_PROFILE_SLUG = 'demo';

export const GUEST_DEMO_QR_CODES = [
  {
    id: 'demo-profile',
    label: 'Sample NFC identity',
    payload: `https://biocloud.app/c/${GUEST_SAMPLE_PROFILE_SLUG}`,
    slug: GUEST_SAMPLE_PROFILE_SLUG,
  },
  {
    id: 'demo-creator',
    label: 'Creator preview',
    payload: 'https://biocloud.app/c/sitehub-creator',
    slug: 'sitehub-creator',
  },
] as const;

export const GUEST_DEMO_CONNECTIONS = [
  {
    id: 'conn-1',
    name: 'Sok Dara',
    subtitle: 'Met at Tech Expo · NFC tap',
    when: '2h ago',
    slug: GUEST_SAMPLE_PROFILE_SLUG,
  },
  {
    id: 'conn-2',
    name: 'Mina Chen',
    subtitle: 'QR scan · Product launch',
    when: 'Yesterday',
    slug: 'sitehub-creator',
  },
  {
    id: 'conn-3',
    name: 'Alex Rivera',
    subtitle: 'Shared profile link',
    when: '3 days ago',
    slug: 'demo',
  },
] as const;

export const GUEST_DEMO_ORDER_ID = 'DEMO-2847';

export const GUEST_DEMO_ORDER = {
  id: GUEST_DEMO_ORDER_ID,
  productLabel: 'Wood Card',
  quantity: 2,
  total: 98,
  status: 'in_production' as const,
  placedAt: '2026-05-27T09:14:00.000Z',
  eta: '2026-06-03',
  customerName: 'Guest Preview',
  timeline: [
    { step: 'Order placed', at: 'May 27, 9:14 AM', done: true },
    { step: 'Design approved', at: 'May 27, 2:40 PM', done: true },
    { step: 'In production', at: 'May 28, 10:00 AM', done: true, active: true },
    { step: 'QA & NFC encode', at: 'Pending', done: false },
    { step: 'Shipped', at: 'Pending', done: false },
  ],
} as const;

export const GUEST_DEMO_ANALYTICS = {
  profileViews: 1284,
  nfcTaps: 342,
  qrScans: 891,
  contactSaves: 67,
  topSources: [
    { label: 'NFC tap', value: 42 },
    { label: 'QR scan', value: 35 },
    { label: 'Direct link', value: 23 },
  ],
  weeklyViews: [42, 58, 71, 63, 88, 95, 102],
} as const;

export const GUEST_PUBLIC_BIO_PAGES: Record<string, BioPage> = {
  demo: {
    id: 'guest-demo-profile',
    userId: 'guest-demo',
    slug: 'demo',
    displayName: 'Sok Dara',
    tagline: 'Founder at SITEHUB NFC identity preview',
    whatsapp: '+85512345678',
    instagram: '@sokdara.design',
    telegram: '@sokdara',
    email: 'sok.dara@example.com',
    customLinks: [
      { label: 'Portfolio', url: 'https://biocloud.app/c/demo' },
      { label: 'Book a demo', url: 'https://biocloud.app' },
    ],
    theme: 'vibrant_pink',
    updatedAt: '2026-05-26T00:00:00.000Z',
  },
  'sitehub-creator': {
    id: 'guest-demo-creator',
    userId: 'guest-demo-creator',
    slug: 'sitehub-creator',
    displayName: 'Mina Chen',
    tagline: 'Creator tools and QR launch preview',
    whatsapp: '+85598765432',
    instagram: '@sitehub.creator',
    telegram: '@sitehubcreator',
    email: 'creator@example.com',
    customLinks: [
      { label: 'Media kit', url: 'https://biocloud.app/c/sitehub-creator' },
      { label: 'Launch page', url: 'https://biocloud.app' },
    ],
    theme: 'ocean_wave',
    updatedAt: '2026-05-26T00:00:00.000Z',
  },
};
