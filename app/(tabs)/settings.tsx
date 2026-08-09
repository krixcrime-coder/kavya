import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton, Badge, Eyebrow, PageTitle, Screen } from '@/components/AppUI';
import { useUploader } from '@/context/UploaderContext';
import { useColors } from '@/hooks/useColors';

export default function SettingsScreen() {
  const colors = useColors();
  const { resetLocalData } = useUploader();

  const connectRepository = () => {
    Alert.alert(
      'Repository connection',
      'GitHub access is not connected yet. When you authorize the GitHub integration, this screen will sync directly with the uploader repository.',
      [{ text: 'Got it' }],
    );
  };

  const reset = () => Alert.alert(
    'Reset local data?',
    'This restores the sample metadata and report history on this device.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetLocalData },
    ],
  );

  return (
    <Screen>
      <Eyebrow>Workspace</Eyebrow>
      <PageTitle subtitle="Keep the companion pointed at the right source of truth.">Settings</PageTitle>

      <View style={[styles.connectionCard, { backgroundColor: colors.foreground }]}>
        <View style={styles.connectionTop}>
          <View style={[styles.repoIcon, { backgroundColor: colors.primary }]}>
            <Feather name="github" size={20} color={colors.primaryForeground} />
          </View>
          <Badge tone="warning">Not connected</Badge>
        </View>
        <Text style={[styles.connectionTitle, { color: colors.background }]}>Connect your repository</Text>
        <Text style={[styles.connectionText, { color: colors.muted }]}>Sync metadata edits and read upload reports directly from the automation repo when GitHub access is available.</Text>
        <ActionButton onPress={connectRepository} icon="link" style={styles.connectButton}>Connect GitHub</ActionButton>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Repository details</Text>
      <SettingRow icon="folder" label="Repository" value="krixcrime-coder/yt-auto-uploader" colors={colors} />
      <SettingRow icon="file-text" label="State file" value="data/state.json" colors={colors} />
      <SettingRow icon="activity" label="Reports file" value="data/reports.json" colors={colors} />

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Local data</Text>
      <View style={[styles.localRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.localIcon, { backgroundColor: colors.secondary }]}><Feather name="smartphone" size={17} color={colors.primary} /></View>
        <View style={styles.localCopy}>
          <Text style={[styles.localTitle, { color: colors.foreground }]}>Offline editor cache</Text>
          <Text style={[styles.localText, { color: colors.mutedForeground }]}>Your metadata edits are saved on this device.</Text>
        </View>
        <Badge tone="success">Active</Badge>
      </View>
      <ActionButton variant="ghost" onPress={reset} icon="rotate-ccw" style={styles.resetButton}>Reset sample data</ActionButton>

      <Pressable onPress={() => Linking.openURL('https://github.com/krixcrime-coder/yt-auto-uploader')} style={styles.linkRow}>
        <Text style={[styles.linkText, { color: colors.primary }]}>Open repository in browser</Text>
        <Feather name="external-link" size={15} color={colors.primary} />
      </Pressable>
    </Screen>
  );
}

function SettingRow({ icon, label, value, colors }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <Feather name={icon} size={17} color={colors.mutedForeground} />
      <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text numberOfLines={1} style={[styles.settingValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  connectionCard: { borderRadius: 24, padding: 20, marginBottom: 28 },
  connectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  repoIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  connectionTitle: { fontSize: 21, fontWeight: '700', marginTop: 22, letterSpacing: -0.3 },
  connectionText: { fontSize: 13, lineHeight: 19, marginTop: 7 },
  connectButton: { marginTop: 19, alignSelf: 'flex-start' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, marginTop: 6 },
  settingRow: { minHeight: 53, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingLabel: { fontSize: 12, width: 82 },
  settingValue: { flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  localRow: { minHeight: 73, marginTop: 3, borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  localIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  localCopy: { flex: 1, gap: 3 },
  localTitle: { fontSize: 13, fontWeight: '700' },
  localText: { fontSize: 11, lineHeight: 15 },
  resetButton: { marginTop: 12, alignSelf: 'flex-start' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'center', marginTop: 30, padding: 8 },
  linkText: { fontSize: 13, fontWeight: '700' },
});