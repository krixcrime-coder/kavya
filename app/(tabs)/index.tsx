import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ActionButton, Badge, Eyebrow, PageTitle, Screen, SectionHeading } from '@/components/AppUI';
import { ReportRow } from '@/components/ReportRow';
import { useUploader } from '@/context/UploaderContext';
import { useColors } from '@/hooks/useColors';

export default function DashboardScreen() {
  const colors = useColors();
  const { reports, titles, descriptions, tagSets } = useUploader();
  const scheduled = reports.find((report) => report.status === 'scheduled');
  const successCount = reports.filter((report) => report.status === 'success').length;
  const failedCount = reports.filter((report) => report.status === 'failed').length;

  return (
    <Screen>
      <Eyebrow>Creator control room</Eyebrow>
      <PageTitle subtitle="Your uploader is keeping the queue moving.">Good morning</PageTitle>

      <LinearGradient colors={[colors.foreground, colors.accentForeground]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroOrb} />
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroEyebrow, { color: colors.muted }]}>Next publish</Text>
            <Text style={[styles.heroTime, { color: colors.background }]}>{scheduled ? scheduled.scheduledAt.split(' · ')[1] : 'No slot queued'}</Text>
          </View>
          <View style={[styles.playIcon, { backgroundColor: colors.primary }]}><Feather name="play" size={17} color={colors.primaryForeground} /></View>
        </View>
        <View style={styles.heroBottom}>
          <View style={styles.heroCopy}>
            <Text numberOfLines={1} style={[styles.heroTitle, { color: colors.background }]}>{scheduled?.title ?? 'Your queue is clear'}</Text>
            <Text style={[styles.heroMeta, { color: colors.muted }]}>{scheduled?.filename ?? 'Add videos to Google Drive to begin'}</Text>
          </View>
          <Badge tone="warning">{scheduled ? 'Queued' : 'Ready'}</Badge>
        </View>
      </LinearGradient>

      <SectionHeading title="This week" action="Live locally" />
      <View style={styles.statsRow}>
        <StatCard value={String(successCount).padStart(2, '0')} label="Published" icon="check-circle" colors={colors} />
        <StatCard value={String(reports.filter((report) => report.status === 'scheduled').length).padStart(2, '0')} label="Scheduled" icon="clock" colors={colors} />
        <StatCard value={String(failedCount).padStart(2, '0')} label="Failed" icon="alert-circle" colors={colors} danger />
      </View>

      <View style={[styles.poolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.poolCopy}>
          <Text style={[styles.poolTitle, { color: colors.foreground }]}>Metadata pool</Text>
          <Text style={[styles.poolText, { color: colors.mutedForeground }]}>Your uploader has plenty of variation to work with.</Text>
        </View>
        <View style={styles.poolCounts}>
          <PoolCount count={titles.length} label="titles" colors={colors} />
          <PoolCount count={descriptions.length} label="descriptions" colors={colors} />
          <PoolCount count={tagSets.length} label="tag sets" colors={colors} />
        </View>
      </View>

      <SectionHeading title="Recent activity" action="View all" />
      <View style={styles.reportList}>
        {reports.slice(0, 3).map((report) => <ReportRow report={report} key={report.id} />)}
      </View>
      <ActionButton variant="soft" icon="edit-3" onPress={() => router.push('/metadata')} style={styles.action}>Edit metadata pool</ActionButton>
    </Screen>
  );
}

function StatCard({ value, label, icon, colors, danger }: { value: string; label: string; icon: React.ComponentProps<typeof Feather>['name']; colors: ReturnType<typeof useColors>; danger?: boolean }) {
  return (
    <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={16} color={danger ? colors.destructive : colors.primary} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function PoolCount({ count, label, colors }: { count: number; label: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.poolCount}><Text style={[styles.poolCountValue, { color: colors.foreground }]}>{count}</Text><Text style={[styles.poolCountLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden', borderRadius: 25, minHeight: 190, padding: 20, justifyContent: 'space-between' },
  heroOrb: { position: 'absolute', width: 190, height: 190, borderRadius: 95, right: -66, top: -85, backgroundColor: 'rgba(232,101,88,0.23)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase' },
  heroTime: { fontSize: 37, lineHeight: 44, fontWeight: '700', marginTop: 5, letterSpacing: -1 },
  playIcon: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  heroCopy: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 16, fontWeight: '700' },
  heroMeta: { fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 9 },
  stat: { flex: 1, minHeight: 94, borderRadius: 18, borderWidth: 1, padding: 13, justifyContent: 'space-between' },
  statValue: { fontSize: 27, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  poolCard: { marginTop: 12, borderRadius: 20, borderWidth: 1, padding: 16, gap: 18 },
  poolCopy: { gap: 4 },
  poolTitle: { fontSize: 16, fontWeight: '700' },
  poolText: { fontSize: 12, lineHeight: 17 },
  poolCounts: { flexDirection: 'row', gap: 30 },
  poolCount: { gap: 2 },
  poolCountValue: { fontSize: 23, fontWeight: '700' },
  poolCountLabel: { fontSize: 11 },
  reportList: { gap: 9 },
  action: { marginTop: 15, alignSelf: 'flex-start' },
});
