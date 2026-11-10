import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'warning' | 'granted' | 'required';
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const isPositive = status === 'active' || status === 'granted';
  const isWarning = status === 'warning';

  const badgeColor = isPositive
    ? colors.success
    : isWarning
    ? colors.warning
    : colors.danger;

  const defaultText = isPositive
    ? status === 'granted'
      ? 'Granted'
      : 'Active'
    : status === 'required'
    ? 'Required'
    : 'Inactive';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${badgeColor}18`,
          borderColor: `${badgeColor}50`,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: badgeColor }]} />
      <Text style={[styles.text, { color: badgeColor }]}>
        {label || defaultText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

