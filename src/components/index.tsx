import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

//Button styling
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: ReactNode;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  icon,
}: ButtonProps) => {
  const bgColors = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    danger: COLORS.danger,
    outline: 'transparent',
    ghost: 'transparent',
  };
  const textColors = {
    primary: COLORS.white,
    secondary: COLORS.white,
    danger: COLORS.white,
    outline: COLORS.primary,
    ghost: COLORS.textSecondary,
  };
  const paddings = { sm: SPACING.sm, md: SPACING.md, lg: SPACING.lg };
  const textSizes = { sm: 13, md: 15, lg: 17 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? COLORS.border : bgColors[variant],
          paddingVertical: paddings[size],
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: COLORS.primary,
          opacity: disabled ? 0.7 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text style={{ color: textColors[variant], fontWeight: '600', fontSize: textSizes[size] }}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

//Card Views 
interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card = ({ children, style, onPress }: CardProps) => {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.card, SHADOWS.sm, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, SHADOWS.sm, style]}>{children}</View>;
};

//Text Input fields
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  error?: string;
  editable?: boolean;
}

export const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  multiline,
  numberOfLines,
  style,
  error,
  editable = true,
}: InputProps) => (
  <View style={[{ marginBottom: SPACING.md }, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      editable={editable}
      placeholderTextColor={COLORS.textMuted}
      style={[
        styles.input,
        multiline && { height: 24 * (numberOfLines || 3), textAlignVertical: 'top' },
        error ? { borderColor: COLORS.danger } : {},
        !editable && { backgroundColor: COLORS.background, color: COLORS.textSecondary },
      ]}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Badge (small information not touchble information buttons)
interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
}

export const Badge = ({
  label,
  color = COLORS.primary,
  bgColor = COLORS.primaryLight,
}: BadgeProps) => (
  <View style={[styles.badge, { backgroundColor: bgColor }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

//Header
interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

export const SectionHeader = ({ title, action }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={styles.sectionAction}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Empty State
interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export const EmptyState = ({ title, subtitle, icon }: EmptyStateProps) => (
  <View style={styles.emptyState}>
    {icon && <View style={{ marginBottom: SPACING.md }}>{icon}</View>}
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
  </View>
);

//Screen Header
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export const ScreenHeader = ({ title, subtitle, right }: ScreenHeaderProps) => (
  <View style={styles.screenHeader}>
    <View style={{ flex: 1 }}>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
    </View>
    {right && <View>{right}</View>}
  </View>
);

// Stats Card
interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  bgColor?: string;
  icon?: ReactNode;
}

export const StatCard = ({
  label,
  value,
  color = COLORS.primary,
  bgColor = COLORS.primaryLight,
  icon,
}: StatCardProps) => (
  <View style={[styles.statCard, { backgroundColor: bgColor }]}>
    {icon && <View style={{ marginBottom: SPACING.xs }}>{icon}</View>}
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Styles css
const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionAction: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  screenSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flex: 1,
    margin: SPACING.xs,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
  },
});
