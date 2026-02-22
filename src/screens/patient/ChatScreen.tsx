import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import {
  sendMessageToAI,
  getChatHistory,
  generateSessionId,
} from '../../services/chatService';
import { getPatientProfile } from '../../services/patientService';
import { ScreenHeader } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ChatMessage } from '../../types';

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const [assignedClinicianId, setAssignedClinicianId] = useState<string | undefined>();
  const flatListRef = useRef<FlatList>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const [history, patient] = await Promise.all([
      getChatHistory(user.uid, sessionId),
      getPatientProfile(user.uid),
    ]);
    setMessages(history);
    setAssignedClinicianId(patient?.assignedClinicianId || undefined);
  }, [user, sessionId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending || !user) return;

    const userMsg = inputText.trim();
    setInputText('');
    setSending(true);

    // adding patient message
    const optimisticMsg: ChatMessage = {
      id: `tmp_${Date.now()}`,
      patientId: user.uid,
      sender: 'patient',
      message: userMsg,
      timestamp: new Date().toISOString(),
      isEscalated: false,
      sessionId,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { reply, escalated } = await sendMessageToAI(
        user.uid,
        userMsg,
        sessionId,
        assignedClinicianId
      );

      // AI reply
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        patientId: user.uid,
        sender: 'ai',
        message: reply,
        timestamp: new Date().toISOString(),
        isEscalated: escalated,
        sessionId,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (escalated) {
        Alert.alert(
          ' Escalated to Doctor',
          'Your enquiry has been flagged and sent to your Doctor for urgent review.'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isPatient = item.sender === 'patient';
    const isAI = item.sender === 'ai';

    return (
      <View
        style={[
          styles.messageWrapper,
          isPatient ? styles.messageWrapperRight : styles.messageWrapperLeft,
        ]}
      >
        {!isPatient && (
          <View style={[styles.avatar, { backgroundColor: item.isEscalated ? COLORS.dangerLight : COLORS.primaryLight }]}>
            <Ionicons
              name={item.isEscalated ? 'alert-circle' : 'hardware-chip-outline'}
              size={16}
              color={item.isEscalated ? COLORS.danger : COLORS.primary}
            />
          </View>
        )}
        <View style={{ maxWidth: '78%' }}>
          {item.isEscalated && (
            <View style={styles.escalationBadge}>
              <Ionicons name="alert-circle" size={12} color={COLORS.danger} />
              <Text style={styles.escalationText}>Escalated to clinician</Text>
            </View>
          )}
          <View
            style={[
              styles.bubble,
              isPatient ? styles.bubblePatient : styles.bubbleAI,
              item.isEscalated && styles.bubbleEscalated,
            ]}
          >
            <Text style={[styles.messageText, isPatient && styles.messageTextPatient]}>
              {item.message}
            </Text>
          </View>
          <Text style={[styles.timestamp, isPatient && { textAlign: 'right' }]}>
            {new Date(item.timestamp).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {isPatient && (
          <View style={styles.avatarPatient}>
            <Ionicons name="person" size={16} color={COLORS.white} />
          </View>
        )}
      </View>
    );
  };

  const QUICK_QUESTIONS = [
    'What are my medications?',
    'When is my next appointment?',
    'I feel unwell',
    'I missed my medication',
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScreenHeader
        title="Health Assistant"
        subtitle="AI-powered · Escalates complex queries"
      />

      {/* Welcome Banner */}
      {messages.length === 0 && (
        <View style={styles.welcomeBanner}>
          <View style={styles.aiAvatar}>
            <Ionicons name="hardware-chip" size={32} color={COLORS.white} />
          </View>
          <Text style={styles.welcomeTitle}>Hi, I'm your Health Assistant</Text>
          <Text style={styles.welcomeSub}>
            Ask me about your medications, symptoms, or general health questions. Complex issues will be forwarded to your clinician.
          </Text>
          <View style={styles.quickQs}>
            {QUICK_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.quickQ}
                onPress={() => setInputText(q)}
              >
                <Text style={styles.quickQText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Typing Indicator */}
      {sending && (
        <View style={styles.typingRow}>
          <View style={styles.typingBubble}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.typingText}>AI is thinking...</Text>
          </View>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask a health question..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.textInput}
          multiline
          maxLength={500}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          style={[
            styles.sendBtn,
            (!inputText.trim() || sending) && { backgroundColor: COLORS.border },
          ]}
        >
          <Ionicons name="send" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  welcomeBanner: {
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  aiAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  welcomeTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  welcomeSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.md },
  quickQs: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, justifyContent: 'center' },
  quickQ: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  quickQText: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  messageList: { padding: SPACING.md, paddingBottom: SPACING.sm },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  messageWrapperRight: { justifyContent: 'flex-end' },
  messageWrapperLeft: { justifyContent: 'flex-start' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPatient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escalationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  escalationText: { fontSize: 11, color: COLORS.danger, fontWeight: '600' },
  bubble: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  bubbleAI: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  bubblePatient: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleEscalated: { borderColor: COLORS.danger, borderWidth: 1.5 },
  messageText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  messageTextPatient: { color: COLORS.white },
  timestamp: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  typingRow: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xs },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typingText: { fontSize: 12, color: COLORS.textSecondary },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
