import { Feather } from '@expo/vector-icons';
import React, { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export function Screen({
  children,
  scroll = true,
  contentStyle,
  refreshing,
  onRefresh,
}: PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
}>) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const content = (
    <View
      style={[
        styles.screenContent,
        { paddingTop: insets.top + 22, paddingBottom: Math.max(insets.bottom, 24) + 92 },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );
  if (!scroll) return <View style={[styles.screen, { backgroundColor: colors.background }]}>{content}</View>;
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh
          ? <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor={colors.primary} />
          : undefined
      }
    >
      {content}
    </ScrollView>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  const colors = useColors();
  return <Text style={[styles.eyebrow, { color: colors.primary }]}>{children}</Text>;
}

export function PageTitle({ children, subtitle }: PropsWithChildren<{ subtitle?: string }>) {
  const colors = useColors();
  return (
    <View style={styles.titleBlock}>
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>{children}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function IconButton({
  name,
  onPress,
  color,
  size = 20,
  accessibilityLabel,
}: {
  name: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  color?: string;
  size?: number;
  accessibilityLabel: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.65 : 1 },
      ]}
    >
      <Feather name={name} size={size} color={color ?? colors.foreground} />
    </Pressable>
  );
}

export function ActionButton({
  children,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  style,
}: PropsWithChildren<{
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
  variant?: 'primary' | 'soft' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const colors = useColors();
  const backgroundColor =
    variant === 'primary' ? colors.primary : variant === 'soft' ? colors.secondary : 'transparent';
  const textColor = variant === 'primary' ? colors.primaryForeground : colors.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor, borderColor: variant === 'ghost' ? colors.border : backgroundColor, opacity: disabled ? 0.45 : pressed ? 0.78 : 1 },
        style,
      ]}
    >
      {icon ? <Feather name={icon} size={16} color={textColor} /> : null}
      <Text style={[styles.actionLabel, { color: textColor }]}>{children}</Text>
    </Pressable>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action ? <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text> : null}
    </View>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: PropsWithChildren<{ tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'blue' }>) {
  const colors = useColors();
  const palette = {
    neutral: { backgroundColor: colors.muted, color: colors.mutedForeground },
    success: { backgroundColor: '#dff1e5', color: '#33714d' },
    warning: { backgroundColor: '#f8e9c9', color: '#94620d' },
    danger: { backgroundColor: '#f5dcd8', color: colors.destructive },
    blue: { backgroundColor: colors.accent, color: colors.accentForeground },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.badgeLabel, { color: palette.color }]}>{children}</Text>
    </View>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.input, color: colors.foreground }, props.style]}
      />
    </View>
  );
}

export function LoadingState() {
  const colors = useColors();
  return <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { paddingHorizontal: 20 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' },
  titleBlock: { gap: 6, marginTop: 8, marginBottom: 24 },
  pageTitle: { fontSize: 31, lineHeight: 36, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  actionButton: { minHeight: 44, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionLabel: { fontSize: 14, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  sectionAction: { fontSize: 13, fontWeight: '700' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  badgeLabel: { fontSize: 11, lineHeight: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  input: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: 14, fontSize: 15 },
});

export const commonStyles = styles;