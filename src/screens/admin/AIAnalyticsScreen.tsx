import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAIAnalytics, getSystemAdherenceStats, AIAnalytics } from '../../services/adminService';
import { Card, ScreenHeader, StatCard, SectionHeader } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function AIAnalyticsScreen() {
  const [aiData, setAiData] = useState<AIAnalytics | null>(null);
  const [adherence, setAdherence] = useState<{ averageAdherence: number; totalPatients: number; highRiskPatients: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [ai, adh] = await Promise.all([getAIAnalytics(), getSystemAdherenceStats()]);
    setAiData(ai);
    setAdherence(adh);
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScreenHeader title="System Analytics" subtitle="AI & medication insights" />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* AI Metrics */}
        <SectionHeader title="AI Assistant" />
        <View style={styles.row}>
          <StatCard label="Conversations" value={aiData?.totalConversations ?? '—'} color={COLORS.primary} bgColor={COLORS.primaryLight} />
          <StatCard label="Messages" value={aiData?.totalMessages ?? '—'} color={COLORS.secondary} bgColor={COLORS.secondaryLight} />
        </View>
        <View style={styles.row}>
          <StatCard label="Escalated" value={aiData?.escalatedCount ?? '—'} color={COLORS.danger} bgColor={COLORS.dangerLight} />
          <StatCard label="Escl. Rate" value={aiData ? `${aiData.escalationRate}%` : '—'} color={COLORS.warning} bgColor={COLORS.warningLight} />
        </View>
        <View style={styles.row}>
          <StatCard label="Resolved" value={aiData?.resolvedEnquiries ?? '—'} color={COLORS.secondary} bgColor={COLORS.secondaryLight} />
          <StatCard label="Pending" value={aiData?.pendingEnquiries ?? '—'} color={COLORS.danger} bgColor={COLORS.dangerLight} />
        </View>

        {/* Adherence */}
        <SectionHeader title="Medication Adherence" />
        <View style={styles.row}>
          <StatCard label="Avg Adherence" value={adherence ? `${adherence.averageAdherence}%` : '—'} color={COLORS.primary} bgColor={COLORS.primaryLight} />
          <StatCard label="Total Patients" value={adherence?.totalPatients ?? '—'} color={COLORS.secondary} bgColor={COLORS.secondaryLight} />
        </View>
        <Card>
          <View style={styles.riskRow}>
            <Ionicons name="warning-outline" size={20} color={COLORS.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.riskTitle}>High-Risk Patients</Text>
              <Text style={styles.riskSub}>Adherence below 60% in last 7 days</Text>
            </View>
            <Text style={styles.riskCount}>{adherence?.highRiskPatients ?? '—'}</Text>
          </View>
        </Card>

        {/* keywords that patients often mention when they need help, which can help us to optimize the AI assistant's response and the health education materials we provide to the patients */}

        {aiData?.topKeywords && aiData.topKeywords.length > 0 && (
          <>
            <SectionHeader title="Top Keywords from Patients" />
            <Card>
              {aiData.topKeywords.map((kw, i) => (
                <View key={kw.keyword} style={styles.kwRow}>
                  <Text style={styles.kwRank}>#{i + 1}</Text>
                  <Text style={styles.kwWord}>{kw.keyword}</Text>
                  <View style={styles.kwBar}>
                    <View style={[styles.kwFill, { width: `${Math.min((kw.count / aiData.topKeywords[0].count) * 100, 100)}%` as any }]} />
                  </View>
                  <Text style={styles.kwCount}>{kw.count}</Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  row: { flexDirection: 'row', marginHorizontal: -SPACING.xs, marginBottom: SPACING.xs },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  riskTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  riskSub: { fontSize: 11, color: COLORS.textSecondary },
  riskCount: { fontSize: 32, fontWeight: '800', color: COLORS.danger },
  kwRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  kwRank: { width: 24, fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },
  kwWord: { width: 100, fontSize: 13, color: COLORS.text, fontWeight: '500' },
  kwBar: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
  kwFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full },
  kwCount: { width: 30, fontSize: 12, color: COLORS.textSecondary, textAlign: 'right' },
});
