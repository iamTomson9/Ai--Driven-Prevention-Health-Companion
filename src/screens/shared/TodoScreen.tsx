import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import {
  getUserTodos, createTodo, updateTodo, deleteTodo, toggleTodoComplete,
} from '../../services/patientService';
import { Card, Button, ScreenHeader, Badge, EmptyState } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { TodoItem } from '../../types';

const PRIORITIES = ['low', 'medium', 'high'] as const;
const CATEGORIES = ['general', 'health', 'medication', 'appointment'] as const;

const PRIORITY_COLORS: Record<string, string> = {
  low: COLORS.secondary, medium: COLORS.warning, high: COLORS.danger,
};
const PRIORITY_BG: Record<string, string> = {
  low: COLORS.secondaryLight, medium: COLORS.warningLight, high: COLORS.dangerLight,
};

export default function TodoScreen() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<TodoItem | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoItem['priority']>('medium');
  const [category, setCategory] = useState<TodoItem['category']>('general');
  const [dueDate, setDueDate] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getUserTodos(user.uid);
    setTodos(data);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openCreate = () => {
    setEditItem(null);
    setTitle(''); setDescription(''); setPriority('medium'); setCategory('general'); setDueDate('');
    setShowModal(true);
  };

  const openEdit = (item: TodoItem) => {
    setEditItem(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setPriority(item.priority);
    setCategory(item.category || 'general');
    setDueDate(item.dueDate || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !user) return;

    try {
      if (editItem) {
        await updateTodo(editItem.id, { title, description, priority, category, dueDate: dueDate || undefined });
      } else {
        await createTodo({
          userId: user.uid,
          title, description, priority,
          category, dueDate: dueDate || undefined,
          completed: false,
          createdAt: new Date().toISOString(),
        });
      }
      setShowModal(false);
      await load();
    } catch (err) {
      Alert.alert('Error', 'Failed to save todo');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete', 'Remove this todo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTodo(id); await load(); } },
    ]);
  };

  const handleToggle = async (item: TodoItem) => {
    await toggleTodoComplete(item.id, !item.completed);
    await load();
  };

  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  const renderTodo = (item: TodoItem) => (
    <Card key={item.id} style={item.completed ? { opacity: 0.6 } : {}}>
      <View style={styles.todoRow}>
        <TouchableOpacity onPress={() => handleToggle(item)} style={styles.checkbox}>
          <Ionicons
            name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={item.completed ? COLORS.secondary : COLORS.border}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.todoTitle, item.completed && styles.todoDone]}>{item.title}</Text>
          {item.description ? <Text style={styles.todoDesc}>{item.description}</Text> : null}
          <View style={styles.todoMeta}>
            <Badge label={item.priority} color={PRIORITY_COLORS[item.priority]} bgColor={PRIORITY_BG[item.priority]} />
            {item.category && item.category !== 'general' && (
              <Badge label={item.category} color={COLORS.textSecondary} bgColor={COLORS.background} />
            )}
            {item.dueDate && <Text style={styles.dueDate}>Due: {item.dueDate}</Text>}
          </View>
        </View>
        <View style={styles.todoActions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
            <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScreenHeader
        title="To-Do List"
        subtitle={`${pending.length} pending`}
        right={
          <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {todos.length === 0 ? (
          <EmptyState
            title="No todos yet"
            subtitle="Tap + to create your first task"
            icon={<Ionicons name="checkbox-outline" size={48} color={COLORS.border} />}
          />
        ) : (
          <>
            {pending.length > 0 && (
              <>
                <Text style={styles.section}>Pending ({pending.length})</Text>
                {pending.map(renderTodo)}
              </>
            )}
            {completed.length > 0 && (
              <>
                <Text style={styles.section}>Completed ({completed.length})</Text>
                {completed.map(renderTodo)}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Create and Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editItem ? 'Edit Todo' : 'New Todo'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Task title *"
              style={styles.mInput}
              placeholderTextColor={COLORS.textMuted}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              style={[styles.mInput, { height: 80, textAlignVertical: 'top' }]}
              multiline
              placeholderTextColor={COLORS.textMuted}
            />
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="Due date (e.g. 2026-03-01)"
              style={styles.mInput}
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.mLabel}>Priority</Text>
            <View style={styles.pillRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[styles.pill, priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] }]}
                >
                  <Text style={[styles.pillText, priority === p && { color: COLORS.white }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.mLabel}>Category</Text>
            <View style={styles.pillRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.pill, category === c && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                >
                  <Text style={[styles.pillText, category === c && { color: COLORS.white }]}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Save" onPress={handleSave} disabled={!title.trim()} style={{ marginTop: SPACING.md }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginVertical: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  todoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  checkbox: { marginTop: 2 },
  todoTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  todoDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  todoDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  todoMeta: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap', marginTop: SPACING.xs },
  dueDate: { fontSize: 11, color: COLORS.textMuted, alignSelf: 'center' },
  todoActions: { flexDirection: 'row' },
  actionBtn: { padding: SPACING.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  mInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  mLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  pillRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap', marginBottom: SPACING.sm },
  pill: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  pillText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
});
