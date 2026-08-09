import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Badge, Eyebrow, PageTitle, Screen } from '@/components/AppUI';
import { ReportRow } from '@/components/ReportRow';
import { useUploader } from '@/context/UploaderContext';
import { useColors } from '@/hooks/useColors';

type Filter = 'all' | 'success' | 'scheduled' | 'failed';

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Published' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'failed', label: 'Failed' },
];

export default function ReportsScreen() {
  const colors = useColors();
  const { reports } = useUploader();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const visibleReports = useMemo(() => reports.filter((report) => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const needle = query.trim().toLowerCase();
    return matchesFilter && (!needle || report.filename.toLowerCase().includes(needle) || report.title.toLowerCase().includes(needle));
  }), [filter, query, reports]);
  const successCount = reports.filter((report) => report.status === 'success').length;
  const pendingCount = reports.filter((report) => report.status === 'scheduled').length;
  const failedCount = reports.filter((report) => report.status === 'failed').length;

  return (
    <Screen>
      <Eyebrow>Run history</Eyebrow>
      <PageTitle subtitle="A clear trail of every upload attempt.">Reports</PageTitle>

      <View style={styles.summaryRow}>
        <Summary value={successCount} label="Published" tone="success" />
        <Summary value={pendingCount} label="Queued" tone="warning" />
        <Summary value={failedCount} label="Needs retry" tone="danger" />
      </View>

      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.input }]}>
        <Feather name="search" size={17} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by filename or title"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
          accessibilityLabel="Search reports"
        />
        {query ? <Pressable onPress={() => setQuery('')}><Feather name="x" size={17} color={colors.mutedForeground} /></Pressable> : null}
      </View>

      <View style={[styles.filters, { borderBottomColor: colors.border }]}>
        {filters.map((item) => (
          <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[styles.filter, filter === item.key && { borderBottomColor: colors.primary }]}>
            <Text style={[styles.filterText, { color: filter === item.key ? colors.primary : colors.mutedForeground }]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.reportList}>
        {visibleReports.length ? visibleReports.map((report) => <ReportRow key={report.id} report={report} />) : (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={24} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing here yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Try a different filter or search term.</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

function Summary({ value, label, tone }: { value: number; label: string; tone: 'success' | 'warning' | 'danger' }) {
  const colors = useColors();
  const color = tone === 'success' ? colors.primary : tone === 'danger' ? colors.destructive : colors.accentForeground;
  return (
    <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: 9 },
  summary: { flex: 1, minHeight: 82, borderRadius: 18, borderWidth: 1, padding: 13, justifyContent: 'space-between' },
  summaryValue: { fontSize: 27, fontWeight: '700', letterSpacing: -0.6 },
  summaryLabel: { fontSize: 11, fontWeight: '600' },
  search: { minHeight: 48, marginTop: 22, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  filters: { marginTop: 20, borderBottomWidth: 1, flexDirection: 'row' },
  filter: { paddingHorizontal: 4, paddingBottom: 12, marginRight: 23, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterText: { fontSize: 12, fontWeight: '700' },
  reportList: { marginTop: 12, gap: 9 },
  empty: { minHeight: 180, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 12 },
});