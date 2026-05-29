import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { formatDualPrice } from '@/src/constants/cardProducts';

type Props = {
  priceUsd: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  mutedColor?: string;
  showPerUnit?: boolean;
};

export function CardProductPrice({
  priceUsd,
  size = 'md',
  color = '#0F172A',
  mutedColor = '#64748B',
  showPerUnit = false,
}: Props) {
  const mainStyle = size === 'lg' ? styles.lg : size === 'sm' ? styles.sm : styles.md;
  return (
    <View>
      <AppText style={[mainStyle, { color }]}>{formatDualPrice(priceUsd)}</AppText>
      {showPerUnit ? (
        <AppText style={[styles.perUnit, { color: mutedColor }]}>per card</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sm: { fontSize: 13, fontWeight: '700' },
  md: { fontSize: 16, fontWeight: '800' },
  lg: { fontSize: 22, fontWeight: '800' },
  perUnit: { fontSize: 11, fontWeight: '500', marginTop: 2 },
});
