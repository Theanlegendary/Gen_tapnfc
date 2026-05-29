import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppIcon } from '@/src/components/AppIcon';
import { AppInput } from '@/src/components/AppInput';
import { AppText } from '@/src/components/AppText';
import { AppAvatar } from '@/src/components/AppAvatar';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useBioPage } from '@/src/hooks/useBioPage';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { uploadProfilePhoto } from '@/src/services/profilePhotoService';

function SectionHeader({ icon, title }: { icon: React.ComponentProps<typeof AppIcon>['name']; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppIcon name={icon} size={18} color={theme.colors.primary} />
      <AppText variant="caption" tone="muted" style={styles.sectionLabel}>{title}</AppText>
    </View>
  );
}

export function EditBioScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { requireAccount } = useRequireAccount();
  const { bioPage, saveBioPage } = useBioPage(user?.id ?? '');

  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tagline, setTagline] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!bioPage) return;
    setSlug(bioPage.slug);
    setDisplayName(bioPage.displayName);
    setTagline(bioPage.tagline ?? '');
    setWhatsapp(bioPage.whatsapp ?? '');
    setInstagram(bioPage.instagram ?? '');
    setTelegram(bioPage.telegram ?? '');
    setEmail(bioPage.email ?? '');
    setPhotoUrl(bioPage.photoUrl);
  }, [bioPage]);

  async function pickImage(fromCamera: boolean) {
    if (!requireAccount(undefined, { message: 'Create an account to upload a profile photo.' })) {
      return;
    }
    if (!user?.id) return;

    try {
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Camera permission is required to take a profile photo.');
          return;
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Photo library access is required to choose a profile photo.');
          return;
        }
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setIsUploadingPhoto(true);
      try {
        const response = await uploadProfilePhoto({
          uri: asset.uri,
          userId: user.id,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
        });
        setPhotoUrl(response.url);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to upload profile photo.';
        Alert.alert('Upload failed', message);
      } finally {
        setIsUploadingPhoto(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open image picker.';
      Alert.alert('Image error', message);
    }
  }

  async function handleSave() {
    if (!requireAccount(undefined, { message: 'Create an account to save your bio profile.' })) {
      return;
    }
    if (!displayName.trim()) {
      Alert.alert('Required', 'Display name is required.');
      return;
    }
    if (slug.trim() && !/^[a-z0-9-]{3,40}$/i.test(slug.trim())) {
      Alert.alert('Invalid slug', 'Use 3-40 letters, numbers, or hyphens.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    setIsSaving(true);
    try {
      await saveBioPage({
        slug: slug.trim().toLowerCase() || (user?.id ?? ''),
        displayName: displayName.trim(),
        tagline: tagline.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        instagram: instagram.trim() || undefined,
        telegram: telegram.trim() || undefined,
        email: email.trim() || undefined,
        customLinks: bioPage?.customLinks ?? [],
        theme: bioPage?.theme ?? 'vibrant_pink',
        photoUrl: photoUrl,
      });
      Alert.alert('Saved ✅', 'Your bio page has been updated.');
    } catch (err) {
      Alert.alert('Save failed', (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#9DECF9', '#CBF7EC', '#FFF4D8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="ChevronLeft" size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <AppText variant="h2">Edit Bio</AppText>
          <Pressable onPress={() => bioPage && router.push(`/public/${bioPage.slug}`)} style={styles.previewBtn}>
            <AppText variant="caption" style={styles.previewText}>Preview</AppText>
          </Pressable>
        </View>

        {/* Profile */}
        <AppCard>
          <SectionHeader icon="User" title="PROFILE" />
          <View style={styles.avatarRow}>
            <AppAvatar
              name={displayName || user?.displayName || 'User'}
              role="sales"
              size={72}
              source={photoUrl ? { uri: photoUrl } : undefined}
            />
            <View style={styles.avatarActions}>
              <Pressable
                style={styles.avatarButton}
                onPress={() => void pickImage(false)}
                disabled={isUploadingPhoto}
              >
                <AppIcon name="Image" size={16} color={theme.colors.primary} />
                <AppText variant="caption" weight="bold" style={styles.avatarButtonText}>
                  {isUploadingPhoto ? 'Uploading…' : 'Choose photo'}
                </AppText>
              </Pressable>
              <Pressable
                style={styles.avatarButtonSecondary}
                onPress={() => void pickImage(true)}
                disabled={isUploadingPhoto}
              >
                <AppIcon name="ScanLine" size={16} color={theme.colors.textPrimary} />
                <AppText variant="caption" weight="bold" style={styles.avatarSecondaryText}>
                  Take photo
                </AppText>
              </Pressable>
            </View>
          </View>
          <View style={styles.fields}>
            <AppInput label="Display name *" value={displayName} onChangeText={setDisplayName} placeholder="Sok Dara" autoCapitalize="words" />
            <AppInput label="Tagline" value={tagline} onChangeText={setTagline} placeholder="Coffee · Code · Khmer poetry" />
            <AppInput label="URL slug" value={slug} onChangeText={setSlug} placeholder="sokdara" autoCapitalize="none" />
          </View>
        </AppCard>

        {/* Social links */}
        <AppCard>
          <SectionHeader icon="Phone" title="SOCIAL LINKS" />
          <View style={styles.fields}>
            <AppInput label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} placeholder="+855 12 345 678" keyboardType="phone-pad" />
            <AppInput label="Instagram" value={instagram} onChangeText={setInstagram} placeholder="@sokdara" autoCapitalize="none" />
            <AppInput label="Telegram" value={telegram} onChangeText={setTelegram} placeholder="@sokdara_pp" autoCapitalize="none" />
            <AppInput label="Email" value={email} onChangeText={setEmail} placeholder="sok@dara.bio" keyboardType="email-address" autoCapitalize="none" />
          </View>
        </AppCard>

        {isGuest ? (
          <AppText variant="caption" tone="muted" style={styles.guestHint}>
            Guest preview — sign up to save changes.
          </AppText>
        ) : null}
        <AppButton label="Save Bio Page" loading={isSaving} onPress={handleSave} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: theme.spacing.lg, paddingBottom: 120, gap: theme.spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xs },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  previewBtn: { paddingHorizontal: theme.spacing.sm, paddingVertical: 6, borderRadius: theme.radius.pill, backgroundColor: theme.colors.primary },
  previewText: { color: '#fff', fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.sm },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0, fontSize: 10 },
  fields: { gap: theme.spacing.sm },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  avatarActions: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  avatarButtonText: {
    color: theme.colors.primary,
  },
  avatarButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  avatarSecondaryText: {
    color: theme.colors.textPrimary,
  },
  guestHint: {
    textAlign: 'center',
  },
});
