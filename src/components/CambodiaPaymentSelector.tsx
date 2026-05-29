import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  CAMBODIA_PAYMENT_METHODS,
  type CambodiaPaymentMethodId,
} from '@/src/constants/cambodiaPayments';
import { iosDesign } from '@/src/design-system/ios';

type Props = {
  value: CambodiaPaymentMethodId | null;
  onChange: (id: CambodiaPaymentMethodId) => void;
  /** Hide COD for digital-only checkout */
  allowCashOnDelivery?: boolean;
  accentColor?: string;
  borderColor?: string;
  mutedColor?: string;
  textColor?: string;
};

export function CambodiaPaymentSelector({
  value,
  onChange,
  allowCashOnDelivery = true,
  accentColor = '#0F766E',
  borderColor = '#E2E8F0',
  mutedColor = '#64748B',
  textColor = '#0F172A',
}: Props) {
  const methods = allowCashOnDelivery
    ? CAMBODIA_PAYMENT_METHODS
    : CAMBODIA_PAYMENT_METHODS.filter((m) => m.id !== 'cash_on_delivery');

  return (
    <View style={styles.list}>
      {methods.map((method) => {
        const selected = value === method.id;
        return (
          <Pressable
            key={method.id}
            style={[
              styles.row,
              { borderColor },
              selected && { borderColor: accentColor, backgroundColor: `${accentColor}14` },
            ]}
            onPress={() => onChange(method.id)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
              <AppIcon name={method.icon} size={20} color={accentColor} />
            </View>
            <View style={styles.copy}>
              <AppText style={[styles.label, { color: textColor }]}>{method.labelEn}</AppText>
              {method.hintEn ? (
                <AppText style={[styles.hint, { color: mutedColor }]}>{method.hintEn}</AppText>
              ) : null}
            </View>
            {selected ? <AppIcon name="ShieldCheck" size={20} color={accentColor} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: iosDesign.spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.sm,
    padding: iosDesign.spacing.sm,
    borderRadius: iosDesign.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  label: { fontSize: 14, fontWeight: '700' },
  hint: { fontSize: 11, fontWeight: '500' },
});
