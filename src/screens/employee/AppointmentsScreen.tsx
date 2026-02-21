import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import {
  getClinicianAppointments, createAppointment, updateAppointment, cancelAppointment, getClinicianPatients,
} from '../../services/clinicianService';
import { Card, Button, ScreenHeader, Badge, EmptyState, Input } from '../../components/common';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Appointment, Patient } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  scheduled: COLORS.primary, completed: COLORS.secondary,
  cancelled: COLORS.danger, rescheduled: COLORS.warning,
};

export default function ClinicianAppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Form
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [apptType, setApptType] = useState<'physical' | 'virtual'>('physical');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptDuration, setApptDuration] = useState('30');
  const [apptVenue, setApptVenue] = useState('');
  const [apptLink, setApptLink] = useState('');
  const [apptNotes, setApptNotes] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const [appts, pts] = await Promise.all([
      getClinicianAppointments(user.uid),
      getClinicianPatients(user.uid),
    ]);
    setAppointments(appts);
    setPatients(pts);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleCreate = async () => {
    if (!selectedPatientId || !apptDate || !apptTime) {
      Alert.alert('Error', 'Please fill in patient, date, and time');
      return;
    }
    const patient = patients.find((p) => p.uid === selectedPatientId);
    if (!patient || !user) return;

    try {
      const scheduledAt = new Date(`${apptDate}T${apptTime}:00`).toISOString();
      await createAppointment({
        patientId: selectedPatientId,
        clinicianId: user.uid,
        patientName: patient.displayName,
        clinicianName: user.displayName,
        type: apptType,
        status: 'scheduled',
        scheduledAt,
        duration: parseInt(apptDuration) || 30,
        venue: apptVenue || undefined,
        meetingLink: apptLink || undefined,
        notes: apptNotes || undefined,
        createdAt: new Date().toISOString(),
      });
      setShowCreate(false);
      await load();
      Alert.alert('Success', 'Appointment scheduled');
    } catch { Alert.alert('Error', 'Failed to create appointment'); }
  };

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: async () => { await cancelAppointment(id); await load(); } },
    ]);
  };

  const handleComplete = async (id: string) => {
    await updateAppointment(id, { status: 'completed' });
    await load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScreenHeader
        title="Appointments"
        subtitle={`${appointments.length} total`}
        right={
          <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {appointments.length === 0 ? (
          <EmptyState
            title="No appointments"
            subtitle="Tap + to schedule an appointment"
            icon={<Ionicons name="calendar-outline" size={48} color={COLORS.border} />}
          />
        ) : (
          appointments.map((appt) => {
            const date = new Date(appt.scheduledAt);
            return (
              <Card key={appt.id}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{appt.patientName}</Text>
                    <Text style={styles.dateStr}>
                      {date.toLocaleDateString()} · {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Badge label={appt.status} color={STATUS_COLORS[appt.status]} bgColor={`${STATUS_COLORS[appt.status]}20`} />
                </View>
                <View style={styles.detail}>
                  <Badge label={appt.type} color={appt.type === 'virtual' ? COLORS.primary : COLORS.secondary} bgColor={appt.type === 'virtual' ? COLORS.primaryLight : COLORS.secondaryLight} />
                  {appt.venue && <Text style={styles.venue}>{appt.venue}</Text>}
                  <Text style={styles.dur}>{appt.duration} min</Text>
                </View>
                {appt.status === 'scheduled' && (
                  <View style={styles.actions}>
                    <Button title="Complete" size="sm" variant="secondary" style={{ flex: 1 }} onPress={() => handleComplete(appt.id)} />
                    <Button title="Cancel" size="sm" variant="danger" style={{ flex: 1 }} onPress={() => handleCancel(appt.id)} />
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/*Appointment Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <ScrollView contentContainerStyle={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Appointment</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Patient *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
              {patients.map((p) => (
                <TouchableOpacity
                  key={p.uid}
                  onPress={() => setSelectedPatientId(p.uid)}
                  style={[styles.patientChip, selectedPatientId === p.uid && styles.patientChipActive]}
                >
                  <Text style={[styles.chipText, selectedPatientId === p.uid && { color: COLORS.white }]}>
                    {p.displayName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {(['physical', 'virtual'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setApptType(t)}
                  style={[styles.typeBtn, apptType === t && styles.typeBtnActive]}
                >
                  <Ionicons name={t === 'virtual' ? 'videocam-outline' : 'location-outline'} size={16} color={apptType === t ? COLORS.white : COLORS.textSecondary} />
                  <Text style={[styles.typeBtnText, apptType === t && { color: COLORS.white }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Date (YYYY-MM-DD) *" placeholder="2026-03-15" value={apptDate} onChangeText={setApptDate} />
            <Input label="Time (HH:MM) *" placeholder="09:00" value={apptTime} onChangeText={setApptTime} />
            <Input label="Duration (minutes)" placeholder="30" value={apptDuration} onChangeText={setApptDuration} keyboardType="numeric" />
            {apptType === 'physical' && <Input label="Venue" placeholder="Clinic name or address" value={apptVenue} onChangeText={setApptVenue} />}
            {apptType === 'virtual' && <Input label="Meeting Link" placeholder="https://meet...." value={apptLink} onChangeText={setApptLink} />}
            <Input label="Notes (optional)" placeholder="Any notes..." value={apptNotes} onChangeText={setApptNotes} multiline numberOfLines={3} />

            <Button title="Schedule Appointment" onPress={handleCreate} />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  dateStr: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  detail: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap', marginBottom: SPACING.xs },
  venue: { fontSize: 12, color: COLORS.textSecondary },
  dur: { fontSize: 12, color: COLORS.textMuted },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  overlay: { flexGrow: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.white, borderTopLeftRadius: BORDER_RADIUS.lg, borderTopRightRadius: BORDER_RADIUS.lg, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  patientChip: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, marginRight: SPACING.xs },
  patientChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  typeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.sm },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
});
