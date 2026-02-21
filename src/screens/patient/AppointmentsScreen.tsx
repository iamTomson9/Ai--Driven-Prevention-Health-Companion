// src/screens/patient/AppointmentsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getPatientAppointments } from '../../services/patientService';
import { Card, ScreenHeader, Badge, EmptyState, SectionHeader } from '../../components/common';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Appointment } from '../../types';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming');

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getPatientAppointments(user.uid);
    setAppointments(data);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const now = new Date().toISOString();
  const filtered = filter === 'upcoming'
    ? appointments.filter((a) => a.scheduledAt >= now && a.status === 'scheduled')
    : appointments;

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      scheduled: COLORS.primary, completed: COLORS.secondary,
      cancelled: COLORS.danger, rescheduled: COLORS.warning,
    };
    return map[status] || COLORS.textSecondary;
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScreenHeader title="Appointments" subtitle={`${filtered.length} ${filter}`} />

      <View style={styles.filterRow}>
        {(['upcoming', 'all'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="No appointments"
            subtitle={filter === 'upcoming' ? 'You have no upcoming appointments.' : 'No appointments found.'}
            icon={<Ionicons name="calendar-outline" size={48} color={COLORS.border} />}
          />
        ) : (
          filtered.map((appt) => {
            const date = new Date(appt.scheduledAt);
            return (
              <Card key={appt.id}>
                <View style={styles.apptHeader}>
                  <View style={[styles.typeIcon, {
                    backgroundColor: appt.type === 'virtual' ? COLORS.primaryLight : COLORS.secondaryLight
                  }]}>
                    <Ionicons
                      name={appt.type === 'virtual' ? 'videocam' : 'location'}
                      size={20}
                      color={appt.type === 'virtual' ? COLORS.primary : COLORS.secondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.apptDate}>
                      {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                    <Text style={styles.apptTime}>
                      {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {appt.duration} min
                    </Text>
                  </View>
                  <Badge label={appt.status} color={getStatusColor(appt.status)} bgColor={`${getStatusColor(appt.status)}20`} />
                </View>

                <View style={styles.divider} />

                <View style={styles.apptDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>Dr. {appt.clinicianName}</Text>
                  </View>
                  {appt.venue && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.detailText}>{appt.venue}</Text>
                    </View>
                  )}
                  {appt.type === 'virtual' && appt.meetingLink && (
                    <View style={styles.detailRow}>
                      <Ionicons name="link-outline" size={14} color={COLORS.primary} />
                      <Text style={[styles.detailText, { color: COLORS.primary }]}>Join Meeting</Text>
                    </View>
                  )}
                  <Badge
                    label={appt.type === 'virtual' ? '📹 Virtual' : '🏥 In-Person'}
                    color={appt.type === 'virtual' ? COLORS.primary : COLORS.secondary}
                    bgColor={appt.type === 'virtual' ? COLORS.primaryLight : COLORS.secondaryLight}
                  />
                </View>
                {appt.notes && <Text style={styles.apptNotes}>{appt.notes}</Text>}
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', padding: SPACING.sm, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterBtn: { flex: 1, paddingVertical: SPACING.xs, alignItems: 'center', borderRadius: BORDER_RADIUS.md },
  filterBtnActive: { backgroundColor: COLORS.primaryLight },
  filterText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  filterTextActive: { color: COLORS.primary, fontWeight: '700' },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  apptHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  typeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  apptDate: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  apptTime: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  apptDetails: { gap: SPACING.xs },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  detailText: { fontSize: 13, color: COLORS.textSecondary },
  apptNotes: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic', marginTop: SPACING.xs },
});
