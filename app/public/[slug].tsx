import { useLocalSearchParams } from 'expo-router';
import { PublicBioScreen } from '@/src/features/bio/PublicBioScreen';

export default function PublicBioRoute() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  return <PublicBioScreen slug={slug} />;
}

