import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getAllPatientsAdherence } from '../../services/clinicianService';
import { Card, ScreenHeader, StatCard, SectionHeader, EmptyState } from '../../components/common';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { MedicationAdherence } from '../../types';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [adherence, setAdherence] = useState<MedicationAdherence[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getAllPatientsAdherence(user.uid);
    setAdherence(data);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const avgAdherence = adherence.length > 0
    ? Math.round(adherence.reduce((s, a) => s + a.adherenceRate, 0) / adherence.length)
    : 0;

  const highRisk = adherence.filter((a) => a.adherenceRate < 60).length;
  const goodAdh = adherence.filter((a) => a.adherenceRate >= 80).length;

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return COLORS.secondary;
    if (rate >= 60) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScreenHeader title="Patient Analytics" subtitle="Medication adherence overview" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Stats */}
        <SectionHeader title="Overall Summary" />
        <View style={styles.statsRow}>
          <StatCard label="Avg Adherence" value={`${avgAdherence}%`} color={getAdherenceColor(avgAdherence)} bgColor={`${getAdherenceColor(avgAdherence)}20`} />
          <StatCard label="High Risk" value={highRisk} color={COLORS.danger} bgColor={COLORS.dangerLight} icon={<Ionicons name="warning" size={18} color={COLORS.danger} />} />
          <StatCard label="Good ≥80%" value={goodAdh} color={COLORS.secondary} bgColor={COLORS.secondaryLight} />
        </View>

        {/* Legend */}
        <Card>
          <Text style={styles.legendTitle}>Adherence Guide</Text>
          <View style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.secondary }]} />
            <Text style={styles.legendText}>≥80% Good</Text>
            <View style={[styles.dot, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.legendText}>60-79% Fair</Text>
            <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.legendText}>&lt;60% At Risk</Text>
          </View>
        </Card>

        {/* Per-Patient Adherence */}
        <SectionHeader title="Patient Breakdown" />
        {adherence.length === 0 ? (
          <EmptyState title="No data" subtitle="Medication data will appear here as patients log their doses." icon={<Ionicons name="bar-chart-outline" size={48} color={COLORS.border} />} />
        ) : (
          adherence
            .sort((a, b) => a.adherenceRate - b.adherenceRate)
            .map((item) => (
              <Card key={item.patientId}>
                <View style={styles.patRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patName}>{item.patientName}</Text>
                    <Text style={styles.patDetail}>
                      {item.takenDoses}/{item.totalDoses} doses · {item.missedDoses} missed
                    </Text>
                  </View>
                  <Text style={[styles.rate, { color: getAdherenceColor(item.adherenceRate) }]}>
                    {item.adherenceRate}%
                  </Text>
                </View>
                {/* Progress bar */}
                <View style={styles.bar}>
                  <View style={[styles.fill, {
                    width: `${item.adherenceRate}%` as any,
                    backgroundColor: getAdherenceColor(item.adherenceRate),
                  }]} />
                </View>
                {item.adherenceRate < 60 && (
                  <View style={styles.alertRow}>
                    <Ionicons name="warning-outline" size={14} color={COLORS.danger} />
                    <Text style={styles.alertText}>Consider following up with this patient</Text>
                  </View>
                )}
              </Card>
            ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  statsRow: { flexDirection: 'row', marginHorizontal: -SPACING.xs, marginBottom: SPACING.sm },
  legendTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: COLORS.textSecondary },
  patRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  patName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  patDetail: { fontSize: 12, color: COLORS.textSecondary },
  rate: { fontSize: 24, fontWeight: '800' },
  bar: { height: 8, backgroundColor: COLORS.border, borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: BORDER_RADIUS.full },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm },
  alertText: { fontSize: 12, color: COLORS.danger },
});
