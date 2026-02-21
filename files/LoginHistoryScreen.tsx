// src/screens/admin/LoginHistoryScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllLoginHistory } from '../../services/adminService';
import { ScreenHeader, Badge } from '../../components/common';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { LoginHistory, UserRole } from '../../types';

const ROLE_COLORS: Record<UserRole, string> = {
  patient: COLORS.secondary, clinician: COLORS.primary, admin: COLORS.warning,
};

export default function LoginHistoryScreen() {
  const [history, setHistory] = useState<LoginHistory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const load = useCallback(async () => {
    setHistory(await getAllLoginHistory(200));
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = roleFilter === 'all' ? history : history.filter((h) => h.userRole === roleFilter);

  const renderItem = ({ item }: { item: LoginHistory }) => (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[item.userRole] }]}>
        <Ionicons name={item.userRole === 'patient' ? 'person' : item.userRole === 'clinician' ? 'medical' : 'shield-checkmark'} size={16} color={COLORS.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.email}>{item.userEmail}</Text>
        <Text style={styles.time}>{new Date(item.loginAt).toLocaleString()}</Text>
      </View>
      <Badge label={item.userRole} color={ROLE_COLORS[item.userRole]} bgColor={`${ROLE_COLORS[item.userRole]}20`} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScreenHeader title="Login History" subtitle={`${filtered.length} records`} />

      {/* Role Filter */}
      <View style={styles.filterRow}>
        {(['all', 'patient', 'clinician', 'admin'] as const).map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRoleFilter(r)}
            style={[styles.chip, roleFilter === r && styles.chipActive]}
          >
            <Text style={[styles.chipText, roleFilter === r && { color: COLORS.white }]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: SPACING.xxl }}>
            <Ionicons name="time-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No login history</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: SPACING.xs, padding: SPACING.sm, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chip: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.background },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  content: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, paddingBottom: SPACING.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  email: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  time: { fontSize: 11, color: COLORS.textSecondary },
  separator: { height: 4 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.sm },
});
