import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Badge } from '@/components/AppUI';
import type { UploadReport } from '@/context/UploaderContext';

export function ReportRow({ report }: { report: UploadReport }) {
  const colors = useColors();
  const tone = report.status === 'success' ? 'success' : report.status === 'failed' ? 'danger' : 'warning';
  const icon = report.status === 'success' ? 'check' : report.status === 'failed' ? 'alert-circle' : 'clock';
  const label = report.status === 'success' ? 'Published' : report.status === 'failed' ? 'Failed' : 'Scheduled';

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={17} color={report.status === 'failed' ? colors.destructive : colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{report.title}</Text>
        <Text numberOfLines={1} style={[styles.filename, { color: colors.mutedForeground }]}>{report.filename}</Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{report.status === 'failed' ? report.error : report.scheduledAt}</Text>
      </View>
      <Badge tone={tone}>{label}</Badge>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 88, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontWeight: '700' },
  filename: { fontSize: 12 },
  date: { fontSize: 11, marginTop: 2 },
});