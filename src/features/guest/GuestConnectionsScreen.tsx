import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { GUEST_DEMO_CONNECTIONS } from '@/src/constants/guestDemo';
import { iosDesign } from '@/src/design-system/ios';
import { GuestHintBanner, guestUi } from '@/src/features/guest/GuestScreenUi';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';

export function GuestConnectionsScreen() {
  const { requireAccount } = useRequireAccount();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader title="Connections" subtitle="Sample recent taps & scans" />

        <GuestHintBanner>
          <AppText style={styles.hintBody}>
            Demo connections only — sign in to save your real scan history and contacts.
          </AppText>
        </GuestHintBanner>

        {GUEST_DEMO_CONNECTIONS.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(`/public/${item.slug}`)} style={styles.row}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>{item.name[0]}</AppText>
            </View>
            <View style={styles.copy}>
              <AppText style={styles.name}>{item.name}</AppText>
              <AppText style={styles.subtitle}>{item.subtitle}</AppText>
            </View>
            <AppText style={styles.when}>{item.when}</AppText>
            <AppIcon name="ChevronRight" size={16} color={guestUi.muted} />
          </Pressable>
        ))}

        <Pressable
          onPress={() =>
            requireAccount(undefined, {
              message: 'Create an account to save contacts and sync your connection history.',
            })
          }
          style={styles.saveRow}
        >
          <AppIcon name="UserPlus" size={20} color={guestUi.accent} />
          <AppText style={styles.saveLabel}>Save connection</AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  scroll: {
    padding: iosDesign.spacing.md,
    gap: iosDesign.spacing.sm,
    paddingBottom: iosDesign.spacing.xxl,
  },
  hintBody: { fontSize: 12, fontWeight: '500', color: guestUi.muted, lineHeight: 17 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.md,
    backgroundColor: guestUi.surface,
    borderRadius: guestUi.radiusMd,
    padding: iosDesign.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    ...guestUi.shadow,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: guestUi.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  copy: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: guestUi.text },
  subtitle: { fontSize: 12, fontWeight: '500', color: guestUi.muted },
  when: { fontSize: 11, fontWeight: '600', color: guestUi.muted },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.sm,
    marginTop: iosDesign.spacing.sm,
    backgroundColor: guestUi.accentSoft,
    borderRadius: guestUi.radiusMd,
    padding: iosDesign.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(48,209,88,0.25)',
  },
  saveLabel: { fontSize: 15, fontWeight: '700', color: guestUi.text },
});
