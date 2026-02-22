import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import {
  getClinicianPatients, setPatientDiagnoses, addMedicationToPatient, removeMedicationFromPatient,
} from '../../services/clinicianService';
import { Card, Button, ScreenHeader, Badge, EmptyState, Input } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Patient, Medication } from '../../types';

export default function PatientsScreen() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeModal, setActiveModal] = useState<'diagnosis' | 'medication' | null>(null);

  // Diagnosis form
  const [diagInput, setDiagInput] = useState('');
  const [diagnoses, setDiagnoses] = useState<string[]>([]);

  // Medication form
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [medTimes, setMedTimes] = useState('');
  const [medInstructions, setMedInstructions] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getClinicianPatients(user.uid);
    setPatients(data);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openDiagnosis = (patient: Patient) => {
    setSelectedPatient(patient);
    setDiagnoses([...patient.diagnoses]);
    setDiagInput('');
    setActiveModal('diagnosis');
  };

  const openMedication = (patient: Patient) => {
    setSelectedPatient(patient);
    setMedName(''); setMedDosage(''); setMedFreq(''); setMedTimes(''); setMedInstructions('');
    setActiveModal('medication');
  };

  const saveDiagnoses = async () => {
    if (!selectedPatient) return;
    try {
      await setPatientDiagnoses(selectedPatient.uid, diagnoses);
      setActiveModal(null);
      await load();
      Alert.alert('Saved', 'Diagnoses updated successfully');
    } catch { Alert.alert('Error', 'Failed to save diagnoses'); }
  };

  const addMedication = async () => {
    if (!selectedPatient || !medName || !medDosage || !medTimes) {
      Alert.alert('Error', 'Please fill in Name, Dosage and Times');
      return;
    }
    try {
      const times = medTimes.split(',').map((t) => t.trim()).filter(Boolean);
      await addMedicationToPatient(selectedPatient.uid, {
        name: medName,
        dosage: medDosage,
        frequency: medFreq,
        times,
        prescribedBy: user!.uid,
        startDate: new Date().toISOString().split('T')[0],
        instructions: medInstructions,
      });
      setActiveModal(null);
      await load();
      Alert.alert('Added', 'Medication prescribed successfully');
    } catch { Alert.alert('Error', 'Failed to add medication'); }
  };

  const removeMedication = async (patient: Patient, medId: string) => {
    Alert.alert('Remove Medication', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await removeMedicationFromPatient(patient.uid, medId);
        await load();
      }},
    ]);
  };

  const filteredPatients = patients.filter((p) =>
    p.displayName.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScreenHeader title="My Patients" subtitle={`${patients.length} patients`} />

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search patients..."
          style={styles.searchInput}
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredPatients.length === 0 ? (
          <EmptyState
            title="No patients assigned"
            subtitle="Patients will appear here once assigned to you by admin."
            icon={<Ionicons name="people-outline" size={48} color={COLORS.border} />}
          />
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.uid}>
              {/* Patient Header */}
              <View style={styles.patientHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {patient.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{patient.displayName}</Text>
                  <Text style={styles.patientEmail}>{patient.email}</Text>
                </View>
                <Badge label={patient.isActive ? 'Active' : 'Inactive'}
                  color={patient.isActive ? COLORS.secondary : COLORS.danger}
                  bgColor={patient.isActive ? COLORS.secondaryLight : COLORS.dangerLight}
                />
              </View>

              {/* Diagnoses */}
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Diagnoses</Text>
                  <TouchableOpacity onPress={() => openDiagnosis(patient)}>
                    <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                {patient.diagnoses.length === 0 ? (
                  <Text style={styles.emptyText}>No diagnoses set</Text>
                ) : (
                  <View style={styles.tagRow}>
                    {patient.diagnoses.map((d, i) => <Badge key={i} label={d} />)}
                  </View>
                )}
              </View>

              {/* Medications */}
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Medications</Text>
                  <TouchableOpacity onPress={() => openMedication(patient)}>
                    <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                {patient.medications.length === 0 ? (
                  <Text style={styles.emptyText}>No medications prescribed</Text>
                ) : (
                  patient.medications.map((med) => (
                    <View key={med.id} style={styles.medRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medName}>{med.name}</Text>
                        <Text style={styles.medDetail}>{med.dosage} · {med.frequency} · {med.times.join(', ')}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeMedication(patient, med.id)}>
                        <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Diagnosis Modal */}
      <Modal visible={activeModal === 'diagnosis'} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Manage Diagnoses</Text>
            <Text style={styles.modalSub}>{selectedPatient?.displayName}</Text>

            <View style={styles.addRow}>
              <TextInput
                value={diagInput}
                onChangeText={setDiagInput}
                placeholder="Add diagnosis..."
                style={[styles.mInput, { flex: 1, marginBottom: 0 }]}
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity
                style={styles.addCircle}
                onPress={() => {
                  if (diagInput.trim() && !diagnoses.includes(diagInput.trim())) {
                    setDiagnoses([...diagnoses, diagInput.trim()]);
                    setDiagInput('');
                  }
                }}
              >
                <Ionicons name="add" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.tagRow}>
              {diagnoses.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setDiagnoses(diagnoses.filter((_, j) => j !== i))}
                  style={styles.removableTag}
                >
                  <Text style={styles.tagText}>{d}</Text>
                  <Ionicons name="close" size={12} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.btnRow}>
              <Button title="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setActiveModal(null)} />
              <Button title="Save" style={{ flex: 1 }} onPress={saveDiagnoses} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Medication Modal */}
      <Modal visible={activeModal === 'medication'} transparent animationType="slide">
        <ScrollView contentContainerStyle={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Prescribe Medication</Text>
            <Text style={styles.modalSub}>{selectedPatient?.displayName}</Text>

            <TextInput value={medName} onChangeText={setMedName} placeholder="Medication name *" style={styles.mInput} placeholderTextColor={COLORS.textMuted} />
            <TextInput value={medDosage} onChangeText={setMedDosage} placeholder="Dosage (e.g. 500mg) *" style={styles.mInput} placeholderTextColor={COLORS.textMuted} />
            <TextInput value={medFreq} onChangeText={setMedFreq} placeholder="Frequency (e.g. Twice daily)" style={styles.mInput} placeholderTextColor={COLORS.textMuted} />
            <TextInput value={medTimes} onChangeText={setMedTimes} placeholder="Times, comma-separated (e.g. 08:00, 20:00) *" style={styles.mInput} placeholderTextColor={COLORS.textMuted} />
            <TextInput value={medInstructions} onChangeText={setMedInstructions} placeholder="Instructions (e.g. Take with food)" style={[styles.mInput, { height: 70, textAlignVertical: 'top' }]} multiline placeholderTextColor={COLORS.textMuted} />

            <View style={styles.btnRow}>
              <Button title="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setActiveModal(null)} />
              <Button title="Prescribe" style={{ flex: 1 }} onPress={addMedication} />
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, margin: SPACING.md, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  content: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },
  patientHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  patientName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  patientEmail: { fontSize: 12, color: COLORS.textSecondary },
  section: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm, marginTop: SPACING.sm },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  emptyText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  medName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  medDetail: { fontSize: 11, color: COLORS.textSecondary },
  overlay: { flexGrow: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.white, borderTopLeftRadius: BORDER_RADIUS.lg, borderTopRightRadius: BORDER_RADIUS.lg, padding: SPACING.lg },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md },
  mInput: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, fontSize: 14, color: COLORS.text, marginBottom: SPACING.sm },
  addRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  addCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  removableTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  tagText: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  btnRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
});
