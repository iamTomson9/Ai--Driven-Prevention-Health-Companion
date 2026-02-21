import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '../../services/authService';
import { Button, Input } from '../../components/common';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { UserRole } from '../../types';

const ROLES: { label: string; value: UserRole; icon: string; description: string }[] = [
  { label: 'Patient', value: 'patient', icon: 'person-outline', description: 'Manage your health' },
  { label: 'Clinician', value: 'clinician', icon: 'medical-outline', description: 'Monitor patients' },
];

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await registerUser(email.trim(), password, name.trim(), role);
      // AppNavigator will redirect based on role
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join HealthConnect today</Text>

        {/* Role Selector */}
        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>I am a...</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setRole(r.value)}
                style={[styles.roleCard, role === r.value && styles.roleCardActive]}
              >
                <Ionicons
                  name={r.icon as any}
                  size={24}
                  color={role === r.value ? COLORS.primary : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.roleCardLabel,
                    role === r.value && { color: COLORS.primary },
                  ]}
                >
                  {r.label}
                </Text>
                <Text style={styles.roleCardDesc}>{r.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Enter your full names"
            value={name}
            onChangeText={setName}
          />
          <Input
            label="Email Address"
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Input
            label="Password"
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Input
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title="Sign Up"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: SPACING.sm }}
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  back: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  roleContainer: {
    marginBottom: SPACING.md,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  roleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  roleCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  roleCardDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  loginLink: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
