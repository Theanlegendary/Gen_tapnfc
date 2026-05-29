import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { getPublicBioPageBySlug } from '@/src/services/firestoreService';
import { BioPage } from '@/src/types/models';
import { bioThemeOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';

interface Props { slug: string }

function getThemeStyle(t: BioPage['theme']) {
  return bioThemeOptions.find((o) => o.value === t) ?? bioThemeOptions[0];
}

function SocialButton({ icon, label, url, bg }: { icon: React.ComponentProps<typeof AppIcon>['name']; label: string; url: string; bg: string }) {
  return (
    <Pressable style={[styles.socialBtn, { backgroundColor: bg }]} onPress={() => Linking.openURL(url)}>
      <AppIcon name={icon} size={20} color="#fff" />
      <AppText variant="body" style={styles.socialLabel}>{label}</AppText>
    </Pressable>
  );
}

export function PublicBioScreen({ slug }: Props) {
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const [bioPage, setBioPage] = useState<BioPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contactPreviewed, setContactPreviewed] = useState(false);
  const heroFloat = useRef(new Animated.Value(0)).current;
  const savePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getPublicBioPageBySlug(slug).then(setBioPage).finally(() => setIsLoading(false));
  }, [slug]);

  useEffect(() => {
    const heroLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heroFloat, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const saveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(savePulse, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(savePulse, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    heroLoop.start();
    saveLoop.start();
    return () => {
      heroLoop.stop();
      saveLoop.stop();
    };
  }, [heroFloat, savePulse]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <AppText variant="body" tone="muted">Loading…</AppText>
      </SafeAreaView>
    );
  }

  if (!bioPage) {
    return (
      <SafeAreaView style={styles.center}>
        <AppText variant="h2">Page not found</AppText>
        <AppText variant="body" tone="muted">This bio page does not exist yet.</AppText>
      </SafeAreaView>
    );
  }

  const themeStyle = getThemeStyle(bioPage.theme);
  const profileUrl = `https://biocloud.app/c/${bioPage.slug}`;

  async function handleShare() {
    await Share.share({ message: `${bioPage!.displayName} — ${profileUrl}`, url: profileUrl });
  }

  function handleSaveContactPreview() {
    setContactPreviewed(true);
  }

  async function handleSaveContact() {
    if (isGuest) {
      requireAccount(undefined, {
        message: 'Create an account to save contacts to your device and history.',
      });
      return;
    }

    // vCard format
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${bioPage!.displayName}`,
      bioPage!.tagline ? `TITLE:${bioPage!.tagline}` : '',
      bioPage!.whatsapp ? `TEL;TYPE=CELL:${bioPage!.whatsapp}` : '',
      bioPage!.email ? `EMAIL:${bioPage!.email}` : '',
      `URL:${profileUrl}`,
      'END:VCARD',
    ].filter(Boolean).join('\n');

    await Share.share({ message: vcard, title: `${bioPage!.displayName} Contact` });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeStyle.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Share button top right */}
        <View style={styles.topBar}>
          <View />
          <Pressable onPress={handleShare} style={styles.shareBtn}>
            <AppIcon name="Share" size={18} color={themeStyle.accent} />
          </Pressable>
        </View>

        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatarWrap,
            {
              transform: [
                {
                  translateY: heroFloat.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.avatarGlow, { backgroundColor: `${themeStyle.accent}20` }]} />
          <View style={[styles.avatar, { backgroundColor: themeStyle.accent }]}>
            <AppText style={[styles.avatarText, { color: themeStyle.bg }]}>
              {(bioPage.displayName ?? 'U')[0].toUpperCase()}
            </AppText>
          </View>
        </Animated.View>

        {/* Name + tagline */}
        <AppText style={[styles.name, { color: themeStyle.text }]}>{bioPage.displayName}</AppText>
        {bioPage.tagline ? (
          <AppText style={[styles.tagline, { color: themeStyle.text + 'AA' }]}>{bioPage.tagline}</AppText>
        ) : null}

        {/* Save to Contacts */}
        <Animated.View
          style={{
            transform: [
              {
                scale: savePulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.018],
                }),
              },
            ],
          }}
        >
          <Pressable
            style={[styles.saveContactBtn, { backgroundColor: themeStyle.accent, shadowColor: themeStyle.accent }]}
            onPress={isGuest ? handleSaveContactPreview : handleSaveContact}
          >
            <AppIcon name="User" size={18} color="#fff" />
            <AppText style={styles.saveContactText}>
              {isGuest ? 'Preview Add to Contact' : 'Save to Contacts'}
            </AppText>
          </Pressable>
        </Animated.View>
        {contactPreviewed && isGuest ? (
          <View style={styles.previewBox}>
            <AppText variant="caption" tone="muted" style={styles.previewNote}>
              Preview: {bioPage.displayName}
              {bioPage.whatsapp ? ` · ${bioPage.whatsapp}` : ''}
              {bioPage.telegram ? ` · Telegram ${bioPage.telegram}` : ''}
            </AppText>
            <Pressable onPress={handleSaveContact}>
              <AppText variant="caption" weight="bold" style={[styles.previewNote, { color: themeStyle.accent }]}>
                Save for real →
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {/* Social links */}
        <View style={styles.socials}>
          {bioPage.whatsapp ? (
            <SocialButton icon="Phone" label={`WhatsApp · ${bioPage.whatsapp}`} url={`https://wa.me/${bioPage.whatsapp.replace(/\D/g, '')}`} bg="#25D366" />
          ) : null}
          {bioPage.instagram ? (
            <SocialButton icon="User" label={`Instagram · ${bioPage.instagram}`} url={`https://instagram.com/${bioPage.instagram.replace('@', '')}`} bg="#E1306C" />
          ) : null}
          {bioPage.telegram ? (
            <SocialButton icon="Phone" label={`Telegram · ${bioPage.telegram}`} url={`https://t.me/${bioPage.telegram.replace('@', '')}`} bg="#0088CC" />
          ) : null}
          {bioPage.email ? (
            <SocialButton icon="ChevronRight" label={`Email · ${bioPage.email}`} url={`mailto:${bioPage.email}`} bg="#6E8A95" />
          ) : null}
          {bioPage.customLinks?.map((link) => (
            <SocialButton key={link.url} icon="ChevronRight" label={link.label} url={link.url} bg={themeStyle.accent} />
          ))}
        </View>

        {/* Footer */}
        <AppText style={styles.footer}>Powered by SITEHUB</AppText>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  scroll: { padding: theme.spacing.lg, paddingBottom: 72, alignItems: 'center', gap: theme.spacing.lg },
  topBar: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shareBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.surfaceGlass, alignItems: 'center', justifyContent: 'center', ...theme.shadows.control },
  avatarWrap: { marginTop: theme.spacing.md, alignItems: 'center', justifyContent: 'center' },
  avatarGlow: { position: 'absolute', width: 148, height: 148, borderRadius: 74 },
  avatar: { width: 116, height: 116, borderRadius: 58, alignItems: 'center', justifyContent: 'center', ...theme.shadows.floating },
  avatarText: { fontSize: 46, fontWeight: '700' },
  name: { fontSize: 34, lineHeight: 40, fontWeight: '700', textAlign: 'center' },
  tagline: { fontSize: 16, lineHeight: 22, textAlign: 'center', marginTop: -theme.spacing.sm },
  saveContactBtn: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md, borderRadius: theme.radius.pill },
  saveContactText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  socials: { width: '100%', gap: theme.spacing.sm },
  socialBtn: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radius.lg, ...theme.shadows.control },
  socialLabel: { color: '#fff', fontWeight: '600', flex: 1 },
  footer: { fontSize: 11, color: 'rgba(0,0,0,0.3)', marginTop: theme.spacing.md },
  previewBox: { gap: theme.spacing.xs, alignItems: 'center' },
  previewNote: { textAlign: 'center' },
});
