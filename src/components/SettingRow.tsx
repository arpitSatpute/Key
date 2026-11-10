import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface SettingRowProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  onPress?: () => void;
  type?: 'switch' | 'navigation' | 'value' | 'custom';
  switchValue?: boolean;
  onSwitchChange?: (val: boolean) => void;
  valueText?: string;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  label,
  description,
  onPress,
  type = 'navigation',
  switchValue = false,
  onSwitchChange,
  valueText,
  rightElement,
  disabled = false,
}) => {
  const content = (
    <View style={[styles.container, disabled && styles.disabled]}>
      {icon && <View style={styles.iconBox}>{icon}</View>}
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>

      <View style={styles.rightContainer}>
        {type === 'switch' && (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            disabled={disabled}
            trackColor={{ false: '#27272A', true: '#FFFFFF' }}
            thumbColor={switchValue ? '#09090B' : '#71717A'}
          />
        )}
        {type === 'value' && (
          <View style={styles.valueRow}>
            <Text style={styles.valueText}>{valueText}</Text>
            {onPress && <ChevronRight size={16} color={colors.textMuted} />}
          </View>
        )}
        {type === 'navigation' && (
          <ChevronRight size={18} color={colors.textMuted} />
        )}
        {type === 'custom' && rightElement}
      </View>
    </View>
  );

  if (type === 'switch' || !onPress) {
    return content;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={disabled}>
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  disabled: {
    opacity: 0.5,
  },
  iconBox: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  rightContainer: {
    marginLeft: 10,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: 4,
  },
});

