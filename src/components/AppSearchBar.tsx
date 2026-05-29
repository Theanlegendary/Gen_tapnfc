import { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { RoleThemeKey, theme } from '@/src/constants/theme';
import { useAppTheme } from '@/src/hooks/useAppTheme';

export interface AppSearchBarProps extends Omit<TextInputProps, 'role' | 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: () => void;
  onClear?: () => void;
  loading?: boolean;
  role?: RoleThemeKey;
  embedded?: boolean;
}

export type AppSearchBarHandle = {
  focus: () => void;
};

export const AppSearchBar = forwardRef<AppSearchBarHandle, AppSearchBarProps>(function AppSearchBar(
  {
    value,
    onChangeText,
    onSearch,
    onClear,
    loading = false,
    role = 'admin',
    placeholder = 'Search...',
    embedded = false,
    ...textInputProps
  },
  ref
) {
  const { colors } = useAppTheme();
  void role;
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const handleSubmit = () => {
    onSearch?.();
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();
    inputRef.current?.focus();
  };

  const showClear = value.length > 0 && !loading;

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
      <View style={[styles.field, { backgroundColor: colors.surfaceSoft }]}>
        <AppIcon name="Search" size={16} color={colors.textMuted} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          selectionColor={theme.colors.charcoal}
          returnKeyType="search"
          enablesReturnKeyAutomatically
          onSubmitEditing={handleSubmit}
          style={[styles.input, { color: colors.textPrimary }]}
          accessibilityLabel={placeholder}
          {...textInputProps}
        />
        {showClear ? (
          <Pressable onPress={handleClear} hitSlop={8} style={styles.clearBtn}>
            <AppIcon name="X" size={14} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Search"
        style={({ pressed }) => [
          styles.searchBtn,
          pressed && !loading && styles.searchBtnPressed,
          loading && styles.searchBtnDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.textInverse} />
        ) : (
          <AppIcon name="Search" size={15} color={theme.colors.textInverse} />
        )}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  wrapEmbedded: {
    marginHorizontal: 0,
    marginBottom: 0,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderRadius: 12,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.xs,
    minHeight: 40,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 9,
    includeFontPadding: false,
  },
  clearBtn: {
    padding: 6,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.charcoal,
    opacity: 0.92,
  },
  searchBtnPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
  searchBtnDisabled: {
    opacity: 0.55,
  },
});
