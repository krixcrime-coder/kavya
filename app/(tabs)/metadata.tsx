import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, ActionButton, Badge, Eyebrow, Field, IconButton, PageTitle } from '@/components/AppUI';
import { MetadataTab, useUploader } from '@/context/UploaderContext';
import { useColors } from '@/hooks/useColors';

const tabs: { key: MetadataTab; label: string; singular: string }[] = [
  { key: 'titles', label: 'Titles', singular: 'title' },
  { key: 'descriptions', label: 'Descriptions', singular: 'description' },
  { key: 'tags', label: 'Tags', singular: 'tag set' },
];

export default function MetadataScreen() {
  const colors = useColors();
  const { titles, descriptions, tagSets, addMetadata, updateMetadata, removeMetadata } = useUploader();
  const [activeTab, setActiveTab] = useState<MetadataTab>('titles');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const active = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  const items = useMemo(() => {
    if (activeTab === 'titles') return titles;
    if (activeTab === 'descriptions') return descriptions;
    return tagSets.map((tagSet) => tagSet.join(', '));
  }, [activeTab, descriptions, tagSets, titles]);

  const submit = () => {
    if (!draft.trim()) return;
    if (editing === null) addMetadata(activeTab, draft);
    else updateMetadata(activeTab, editing, draft);
    setDraft('');
    setEditing(null);
  };

  const startEdit = (index: number) => {
    setEditing(index);
    setDraft(items[index]);
  };

  const confirmDelete = (index: number) => {
    Alert.alert(`Remove ${active.singular}?`, 'This only removes the local copy until repository sync is enabled.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMetadata(activeTab, index) },
    ]);
  };

  return (
    <Screen>
      <Eyebrow>Content library</Eyebrow>
      <PageTitle subtitle="Shape the pool your uploader draws from.">Metadata</PageTitle>

      <View style={[styles.syncNotice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.syncIcon, { backgroundColor: colors.card }]}>
          <Feather name="smartphone" size={18} color={colors.primary} />
        </View>
        <View style={styles.syncCopy}>
          <Text style={[styles.syncTitle, { color: colors.foreground }]}>Saved on this device</Text>
          <Text style={[styles.syncText, { color: colors.mutedForeground }]}>GitHub sync is available once a repository is connected.</Text>
        </View>
        <Badge tone="blue">Local</Badge>
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.muted }]}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            onPress={() => { setActiveTab(tab.key); setDraft(''); setEditing(null); }}
            style={[styles.tab, activeTab === tab.key && { backgroundColor: colors.card }]}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? colors.foreground : colors.mutedForeground }]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.editor}>
        <Field
          label={editing === null ? `Add ${active.singular}` : `Edit ${active.singular}`}
          value={draft}
          onChangeText={setDraft}
          placeholder={activeTab === 'tags' ? 'shorts, daily shorts, creator' : `Write a ${active.singular}...`}
          multiline={activeTab === 'descriptions'}
          numberOfLines={activeTab === 'descriptions' ? 3 : 1}
          returnKeyType="done"
        />
        <View style={styles.editorActions}>
          {editing !== null ? <ActionButton variant="ghost" onPress={() => { setEditing(null); setDraft(''); }}>Cancel</ActionButton> : null}
          <ActionButton icon={editing === null ? 'plus' : 'check'} onPress={submit} disabled={!draft.trim()}>
            {editing === null ? 'Add option' : 'Save changes'}
          </ActionButton>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: colors.foreground }]}>{items.length} {active.label.toLowerCase()}</Text>
        <Text style={[styles.listHint, { color: colors.mutedForeground }]}>Randomly selected per upload</Text>
      </View>

      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={`${activeTab}-${index}-${item}`} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.index, { backgroundColor: colors.muted }]}>
              <Text style={[styles.indexText, { color: colors.mutedForeground }]}>{String(index + 1).padStart(2, '0')}</Text>
            </View>
            <Text style={[styles.itemText, { color: colors.foreground }]}>{item}</Text>
            <IconButton name="edit-2" onPress={() => startEdit(index)} accessibilityLabel={`Edit ${active.singular} ${index + 1}`} size={16} />
            <IconButton name="trash-2" onPress={() => confirmDelete(index)} accessibilityLabel={`Remove ${active.singular} ${index + 1}`} size={16} color={colors.destructive} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  syncNotice: { borderWidth: 1, borderRadius: 20, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  syncIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  syncCopy: { flex: 1, gap: 2 },
  syncTitle: { fontSize: 13, fontWeight: '700' },
  syncText: { fontSize: 11, lineHeight: 16 },
  tabBar: { marginTop: 22, padding: 4, borderRadius: 16, flexDirection: 'row', gap: 3 },
  tab: { flex: 1, minHeight: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 12, fontWeight: '700' },
  editor: { marginTop: 20, gap: 12 },
  editorActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9 },
  listHeader: { marginTop: 28, marginBottom: 11, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  listTitle: { fontSize: 16, fontWeight: '700' },
  listHint: { fontSize: 11 },
  list: { gap: 9 },
  item: { minHeight: 65, borderRadius: 17, borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  index: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontSize: 11, fontWeight: '700' },
  itemText: { flex: 1, fontSize: 14, lineHeight: 19 },
});