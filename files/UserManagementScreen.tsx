// src/screens/admin/UserManagementScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Alert, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllUsers, createUserAccount, activateUser, deactivateUser } from '../../services/adminService';
import { Card, Button, ScreenHeader, Badge, EmptyState, Input } from '../../components/common';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { User, UserRole } from '../../types';

const ROLE_COLORS: Record<UserRole, string> = {
  patient: COLORS.secondary, clinician: COLORS.primary, admin: COLORS.warning,
};

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');

  const load = useCallback(async () => {
    setUsers(await getAllUsers());
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleCreate = async () => {
    if (!name || !email || !password) { Alert.alert('Error', 'All fields required'); return; }
    try {
      await createUserAccount(email, password, name, role);
      setShowCreate(false);
      setName(''); setEmail(''); setPassword('');
      await load();
      Alert.alert('Created', 'User account created successfully');
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const toggleUser = async (user: User) => {
    Alert.alert(
      user.isActive ? 'Deactivate User' : 'Activate User',
      `Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            if (user.isActive) await deactivateUser(user.uid);
            else await activateUser(user.uid);
            await load();
          },
        },
      ]
    );
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScreenHeader
        title="User Management"
        subtitle={`${users.length} total users`}
        right={
          <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        }
      />

      {/* Filters */}
      <View style={styles.filters}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search..." style={styles.searchInput} placeholderTextColor={COLORS.textMuted} />
        </View>
        <View style={styles.roleFilters}>
          {(['all', 'patient', 'clinician', 'admin'] as const).map((r) => (
            <TouchableOpacity key={r} onPress={() => setRoleFilter(r)} style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, roleFilter === r && { color: COLORS.white }]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <EmptyState title="No users found" icon={<Ionicons name="people-outline" size={48} color={COLORS.border} />} />
        ) : (
          filtered.map((u) => (
            <Card key={u.uid}>
              <View style={styles.userRow}>
                <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[u.role] }]}>
                  <Text style={styles.avatarText}>{u.displayName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.displayName}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  <Text style={styles.userDate}>Joined: {new Date(u.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.userBadges}>
                  <Badge label={u.role} color={ROLE_COLORS[u.role]} bgColor={`${ROLE_COLORS[u.role]}20`} />
                  <Badge label={u.isActive ? 'Active' : 'Inactive'} color={u.isActive ? COLORS.secondary : COLORS.danger} bgColor={u.isActive ? COLORS.secondaryLight : COLORS.dangerLight} />
                </View>
              </View>
              {u.role !== 'admin' && (
                <TouchableOpacity onPress={() => toggleUser(u)} style={styles.toggleBtn}>
                  <Ionicons name={u.isActive ? 'ban-outline' : 'checkmark-circle-outline'} size={16} color={u.isActive ? COLORS.danger : COLORS.secondary} />
                  <Text style={[styles.toggleText, { color: u.isActive ? COLORS.danger : COLORS.secondary }]}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Create User Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <ScrollView contentContainerStyle={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create User</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>

            <Input label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} />
            <Input label="Email" placeholder="user@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Input label="Password" placeholder="Min 6 characters" value={password} onChangeText={setPassword} secureTextEntry />

            <Text style={styles.roleLabel}>Role</Text>
            <View style={styles.roleRow}>
              {(['patient', 'clinician', 'admin'] as UserRole[]).map((r) => (
                <TouchableOpacity key={r} onPress={() => setRole(r)} style={[styles.roleChip, role === r && { backgroundColor: ROLE_COLORS[r], borderColor: ROLE_COLORS[r] }]}>
                  <Text style={[styles.roleChipText, role === r && { color: COLORS.white }]}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Create Account" onPress={handleCreate} style={{ marginTop: SPACING.md }} />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  filters: { backgroundColor: COLORS.white, padding: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.xs },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.text },
  roleFilters: { flexDirection: 'row', gap: SPACING.xs },
  filterChip: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.background },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  userRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textSecondary },
  userDate: { fontSize: 11, color: COLORS.textMuted },
  userBadges: { gap: SPACING.xs },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  toggleText: { fontSize: 13, fontWeight: '500' },
  overlay: { flexGrow: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.white, borderTopLeftRadius: BORDER_RADIUS.lg, borderTopRightRadius: BORDER_RADIUS.lg, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  roleLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  roleRow: { flexDirection: 'row', gap: SPACING.sm },
  roleChip: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.sm, alignItems: 'center' },
  roleChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
});
