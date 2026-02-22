import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import {
  getTodayMedicationLogs,
  getMedicationLogsByRange,
  markMedicationTaken,
  markMedicationSkipped,
  getPatientProfile,
} from '../../services/patientService';
import { Card, Button, ScreenHeader, Badge, SectionHeader, EmptyState } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { MedicationLog, Medication } from '../../types';

export default function MedicationsScreen() {
  const { user } = useAuth();
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'list'>('today');
  const [historyLogs, setHistoryLogs] = useState<MedicationLog[]>([]);
  const [noteModal, setNoteModal] = useState<{ logId: string; action: 'taken' | 'skipped' } | null>(null);
  const [note, setNote] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    const [logs, profile] = await Promise.all([
      getTodayMedicationLogs(user.uid),
      getPatientProfile(user.uid),
    ]);
    setTodayLogs(logs);
    setMedications(profile?.medications || []);

    const end = new Date().toISOString().split('T')[0];
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const history = await getMedicationLogsByRange(
      user.uid,
      start.toISOString().split('T')[0],
      end
    );
    setHistoryLogs(history);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAction = (logId: string, action: 'taken' | 'skipped') => {
    setNote('');
    setNoteModal({ logId, action });
  };

  const confirmAction = async () => {
    if (!noteModal) return;
    try {
      if (noteModal.action === 'taken') {
        await markMedicationTaken(noteModal.logId, new Date().toISOString(), note);
      } else {
        await markMedicationSkipped(noteModal.logId, note);
      }
      setNoteModal(null);
      await loadData();
    } catch (err) {
      Alert.alert('Error', 'Failed to update medication status');
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      taken: COLORS.secondary,
      missed: COLORS.danger,
      skipped: COLORS.textSecondary,
      pending: COLORS.warning,
    };
    return map[status] || COLORS.textSecondary;
  };

  const getStatusBg = (status: string) => {
    const map: Record<string, string> = {
      taken: COLORS.secondaryLight,
      missed: COLORS.dangerLight,
      skipped: COLORS.background,
      pending: COLORS.warningLight,
    };
    return map[status] || COLORS.background;
  };

  const takenToday = todayLogs.filter((l) => l.status === 'taken').length;
  const total = todayLogs.length;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScreenHeader title="Medications" subtitle={`${takenToday}/${total} taken today`} />

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['today', 'list', 'history'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* TODAY TAB */}
        {activeTab === 'today' && (
          <>
            {/* Progress Bar */}
            <Card>
              <Text style={styles.progressLabel}>
                Today's Adherence: {total > 0 ? Math.round((takenToday / total) * 100) : 100}%
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: total > 0 ? `${(takenToday / total) * 100}%` : '100%' as any },
                  ]}
                />
              </View>
              <Text style={styles.progressSub}>{takenToday} of {total} doses taken</Text>
            </Card>

            {todayLogs.length === 0 ? (
              <EmptyState
                title="No medications today"
                subtitle="Your clinician hasn't scheduled any medications for today."
                icon={<Ionicons name="medkit-outline" size={48} color={COLORS.border} />}
              />
            ) : (
              todayLogs.map((log) => (
                <Card key={log.id}>
                  <View style={styles.logRow}>
                    <View style={[styles.logDot, { backgroundColor: getStatusColor(log.status) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logName}>{log.medicationName}</Text>
                      <Text style={styles.logTime}>Scheduled: {log.scheduledTime}</Text>
                      {log.takenAt && (
                        <Text style={styles.logTaken}>
                          Taken at: {new Date(log.takenAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      )}
                      {log.note && <Text style={styles.logNote}>Note: {log.note}</Text>}
                    </View>
                    <Badge
                      label={log.status}
                      color={getStatusColor(log.status)}
                      bgColor={getStatusBg(log.status)}
                    />
                  </View>
                  {log.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <Button
                        title="Mark Taken"
                        size="sm"
                        variant="secondary"
                        style={{ flex: 1, marginRight: SPACING.xs }}
                        icon={<Ionicons name="checkmark" size={14} color={COLORS.white} />}
                        onPress={() => handleAction(log.id, 'taken')}
                      />
                      <Button
                        title="Skip"
                        size="sm"
                        variant="outline"
                        style={{ flex: 1, marginLeft: SPACING.xs }}
                        onPress={() => handleAction(log.id, 'skipped')}
                      />
                    </View>
                  )}
                </Card>
              ))
            )}
          </>
        )}

        {/* MEDICATION LIST TAB */}
        {activeTab === 'list' && (
          <>
            {medications.length === 0 ? (
              <EmptyState
                title="No medications prescribed"
                subtitle="Your clinician will add your medications here."
                icon={<Ionicons name="medkit-outline" size={48} color={COLORS.border} />}
              />
            ) : (
              medications.map((med) => (
                <Card key={med.id}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medDosage}>{med.dosage} — {med.frequency}</Text>
                  <View style={styles.timesRow}>
                    {med.times.map((t, i) => (
                      <Badge key={i} label={t} color={COLORS.primary} bgColor={COLORS.primaryLight} />
                    ))}
                  </View>
                  {med.instructions && (
                    <Text style={styles.medInstructions}>{med.instructions}</Text>
                  )}
                  <Text style={styles.medStart}>Started: {new Date(med.startDate).toLocaleDateString()}</Text>
                </Card>
              ))
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <>
            <SectionHeader title="Last 7 Days" />
            {historyLogs.length === 0 ? (
              <EmptyState
                title="No history yet"
                subtitle="Your medication history will appear here."
              />
            ) : (
              historyLogs.map((log) => (
                <View key={log.id} style={styles.historyRow}>
                  <View style={[styles.historyDot, { backgroundColor: getStatusColor(log.status) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logName}>{log.medicationName}</Text>
                    <Text style={styles.logTime}>{log.date} · {log.scheduledTime}</Text>
                  </View>
                  <Badge
                    label={log.status}
                    color={getStatusColor(log.status)}
                    bgColor={getStatusBg(log.status)}
                  />
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Note Modal */}
      <Modal visible={!!noteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {noteModal?.action === 'taken' ? 'Mark as Taken' : 'Skip Dose'}
            </Text>
            <Text style={styles.modalSub}>Add an optional note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Took with food, felt dizzy..."
              multiline
              numberOfLines={3}
              style={styles.modalInput}
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <Button
                title="Cancel"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => setNoteModal(null)}
              />
              <Button
                title="Confirm"
                style={{ flex: 1 }}
                onPress={confirmAction}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  progressLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.full,
  },
  progressSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.xs },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  logDot: { width: 10, height: 10, borderRadius: 5 },
  logName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  logTime: { fontSize: 12, color: COLORS.textSecondary },
  logTaken: { fontSize: 12, color: COLORS.secondary },
  logNote: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  medName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  medDosage: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  timesRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap', marginBottom: SPACING.xs },
  medInstructions: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: SPACING.xs },
  medStart: { fontSize: 11, color: COLORS.textMuted },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
    minHeight: 80,
  },
});
