import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getUpcomingAppointments, getTodayMedicationLogs } from '../../services/patientService';
import { getPatientProfile } from '../../services/patientService';
import { Card, StatCard, SectionHeader, Badge, Button, ScreenHeader } from '../../components';
import { COLORS, SPACING } from '../../constants/theme';
import { Patient, Appointment, MedicationLog } from '../../types';

export default function PatientDashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [p, appts, logs] = await Promise.all([
      getPatientProfile(user.uid),
      getUpcomingAppointments(user.uid),
      getTodayMedicationLogs(user.uid),
    ]);
    setPatient(p);
    setAppointments(appts.slice(0, 3));
    setTodayLogs(logs);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const takenCount = todayLogs.filter((l) => l.status === 'taken').length;
  const pendingCount = todayLogs.filter((l) => l.status === 'pending').length;
  const missedCount = todayLogs.filter((l) => l.status === 'missed').length;
  const adherenceToday = todayLogs.length > 0
    ? Math.round((takenCount / todayLogs.length) * 100)
    : 100;

  const nextAppointment = appointments[0];

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScreenHeader
        title={`${getHour()},`}
        subtitle={user?.displayName || 'Patient'}
        right={
          <Ionicons
            name="log-out-outline"
            size={24}
            color={COLORS.textSecondary}
            onPress={logout}
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Today's Stats */}
        <SectionHeader title="Today's Overview" />
        <View style={styles.statsRow}>
          <StatCard
            label="Taken"
            value={takenCount}
            color={COLORS.secondary}
            bgColor={COLORS.secondaryLight}
            icon={<Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />}
          />
          <StatCard
            label="Pending"
            value={pendingCount}
            color={COLORS.warning}
            bgColor={COLORS.warningLight}
            icon={<Ionicons name="time" size={20} color={COLORS.warning} />}
          />
          <StatCard
            label="Adherence"
            value={`${adherenceToday}%`}
            color={adherenceToday >= 80 ? COLORS.secondary : COLORS.danger}
            bgColor={adherenceToday >= 80 ? COLORS.secondaryLight : COLORS.dangerLight}
            icon={<Ionicons name="analytics" size={20} color={COLORS.primary} />}
          />
        </View>

        {/* Diagnoses */}
        {patient?.diagnoses && patient.diagnoses.length > 0 && (
          <>
            <SectionHeader title="My Conditions" />
            <Card>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
                {patient.diagnoses.map((d, i) => (
                  <Badge key={i} label={d} />
                ))}
              </View>
            </Card>
          </>
        )}

        {/* Next Appointment */}
        <SectionHeader
          title="Next Appointment"
          action={{ label: 'View All', onPress: () => {} }}
        />
        {nextAppointment ? (
          <Card>
            <View style={styles.apptRow}>
              <View style={styles.apptIcon}>
                <Ionicons
                  name={nextAppointment.type === 'virtual' ? 'videocam' : 'location'}
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.apptDate}>
                  {new Date(nextAppointment.scheduledAt).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </Text>
                <Text style={styles.apptTime}>
                  {new Date(nextAppointment.scheduledAt).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.apptClinician}>
                  with Dr. {nextAppointment.clinicianName}
                </Text>
              </View>
              <Badge
                label={nextAppointment.type === 'virtual' ? 'Virtual' : 'In-Person'}
                color={nextAppointment.type === 'virtual' ? COLORS.primary : COLORS.secondary}
                bgColor={nextAppointment.type === 'virtual' ? COLORS.primaryLight : COLORS.secondaryLight}
              />
            </View>
            {nextAppointment.venue && (
              <View style={styles.venuePill}>
                <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.venueText}>{nextAppointment.venue}</Text>
              </View>
            )}
          </Card>
        ) : (
          <Card>
            <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>
              No upcoming appointments
            </Text>
          </Card>
        )}

        {/* Today's Medications */}
        <SectionHeader
          title="Today's Medications"
          action={{ label: 'View All', onPress: () => {} }}
        />
        {todayLogs.length === 0 ? (
          <Card>
            <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>
              No medications scheduled today
            </Text>
          </Card>
        ) : (
          todayLogs.slice(0, 4).map((log) => (
            <Card key={log.id}>
              <View style={styles.medRow}>
                <View style={styles.medIcon}>
                  <Ionicons name="medkit" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{log.medicationName}</Text>
                  <Text style={styles.medTime}>Scheduled: {log.scheduledTime}</Text>
                </View>
                <Badge
                  label={log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                  color={
                    log.status === 'taken'
                      ? COLORS.secondary
                      : log.status === 'missed'
                      ? COLORS.danger
                      : COLORS.warning
                  }
                  bgColor={
                    log.status === 'taken'
                      ? COLORS.secondaryLight
                      : log.status === 'missed'
                      ? COLORS.dangerLight
                      : COLORS.warningLight
                  }
                />
              </View>
            </Card>
          ))
        )}

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsRow}>
          <Button
            title="Chat with AI"
            variant="outline"
            size="sm"
            style={{ flex: 1, marginRight: SPACING.xs }}
            icon={<Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />}
            onPress={() => {}}
          />
          <Button
            title="Log Medication"
            size="sm"
            style={{ flex: 1, marginLeft: SPACING.xs }}
            icon={<Ionicons name="medkit-outline" size={16} color={COLORS.white} />}
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  statsRow: { flexDirection: 'row', marginHorizontal: -SPACING.xs },
  apptRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  apptIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptDate: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  apptTime: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  apptClinician: { fontSize: 12, color: COLORS.textSecondary },
  venuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  venueText: { fontSize: 12, color: COLORS.textSecondary },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  medIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  medTime: { fontSize: 12, color: COLORS.textSecondary },
  actionsRow: { flexDirection: 'row' },
});
