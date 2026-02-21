import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getEscalatedEnquiries, resolveEnquiry, markEnquiryReviewed } from '../../services/clinicianService';
import { Card, ScreenHeader, Badge, EmptyState, Button } from '../../components/common';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { EscalatedEnquiry } from '../../types';

export default function EnquiriesScreen() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState<EscalatedEnquiry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<EscalatedEnquiry | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setEnquiries(await getEscalatedEnquiries(user.uid));
  }, [user]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleResolve = async () => {
    if (!selected) return;
    await resolveEnquiry(selected.id, note);
    setSelected(null);
    await load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScreenHeader title="Patient Enquiries" subtitle="Escalated from AI" />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {enquiries.length === 0 ? (
          <EmptyState title="No pending enquiries" subtitle="All escalated enquiries will appear here." icon={<Ionicons name="alert-circle-outline" size={48} color={COLORS.border} />} />
        ) : (
          enquiries.map((enq) => (
            <Card key={enq.id} onPress={() => { setSelected(enq); setNote(''); }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{enq.patientName || `Patient ${enq.patientId.slice(-4)}`}</Text>
                  <Text style={styles.time}>{new Date(enq.escalatedAt).toLocaleString()}</Text>
                </View>
                <Badge label={enq.status} color={enq.status === 'pending' ? COLORS.danger : COLORS.secondary} bgColor={enq.status === 'pending' ? COLORS.dangerLight : COLORS.secondaryLight} />
              </View>
              <Text style={styles.preview} numberOfLines={2}>
                {enq.messages[enq.messages.length - 1]?.message || 'No message'}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Enquiry Details</Text>
            <Text style={styles.modalSub}>{selected?.patientName}</Text>
            <ScrollView style={{ maxHeight: 300, marginBottom: SPACING.md }}>
              {selected?.messages.map((msg) => (
                <View key={msg.id} style={[styles.msgBubble, msg.sender === 'patient' ? styles.msgRight : styles.msgLeft]}>
                  <Text style={styles.msgSender}>{msg.sender.toUpperCase()}</Text>
                  <Text style={styles.msgText}>{msg.message}</Text>
                </View>
              ))}
            </ScrollView>
            <TextInput value={note} onChangeText={setNote} placeholder="Add resolution note..." style={styles.noteInput} multiline numberOfLines={3} placeholderTextColor={COLORS.textMuted} />
            <View style={styles.btnRow}>
              <Button title="Close" variant="outline" style={{ flex: 1 }} onPress={() => setSelected(null)} />
              <Button title="Resolve" style={{ flex: 1 }} onPress={handleResolve} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  time: { fontSize: 11, color: COLORS.textSecondary },
  preview: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.white, borderTopLeftRadius: BORDER_RADIUS.lg, borderTopRightRadius: BORDER_RADIUS.lg, padding: SPACING.lg },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md },
  msgBubble: { borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.xs, maxWidth: '80%' },
  msgLeft: { backgroundColor: COLORS.primaryLight, alignSelf: 'flex-start' },
  msgRight: { backgroundColor: COLORS.secondaryLight, alignSelf: 'flex-end' },
  msgSender: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, marginBottom: 2 },
  msgText: { fontSize: 13, color: COLORS.text },
  noteInput: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: 14, color: COLORS.text, textAlignVertical: 'top', marginBottom: SPACING.md, minHeight: 80 },
  btnRow: { flexDirection: 'row', gap: SPACING.sm },
});
