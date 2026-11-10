import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Power, Volume2, Volume1, Bell, ChevronRight } from 'lucide-react-native';
import { IndividualKeyConfig } from '../types';
import { colors } from '../theme/colors';

interface KeyCardProps {
  keyConfig: IndividualKeyConfig;
  onToggle: (enabled: boolean) => void;
  onPressSettings: () => void;
}

export const KeyCard: React.FC<KeyCardProps> = ({
  keyConfig,
  onToggle,
  onPressSettings,
}) => {
  const renderIcon = () => {
    const size = 20;
    const color = '#FFFFFF';
    switch (keyConfig.id) {
      case 'power':
        return <Power size={size} color={color} strokeWidth={2.4} />;
      case 'volume_up':
        return <Volume2 size={size} color={color} strokeWidth={2.4} />;
      case 'volume_down':
        return <Volume1 size={size} color={color} strokeWidth={2.4} />;
      case 'alert':
        return <Bell size={size} color={color} strokeWidth={2.4} />;
    }
  };

  const getActionSummary = () => {
    const formatAction = (act: string) => {
      return act
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const single = `Tap: ${formatAction(keyConfig.singleTap)}`;
    const double = keyConfig.doubleTap ? ` • 2×: ${formatAction(keyConfig.doubleTap)}` : '';
    const long = keyConfig.longPress ? ` • Hold: ${formatAction(keyConfig.longPress)}` : '';
    return `${single}${double}${long}`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        !keyConfig.enabled && styles.cardDisabled,
      ]}
      onPress={onPressSettings}
      activeOpacity={0.7}
    >
      <View style={styles.leftRow}>
        <View
          style={[
            styles.iconContainer,
            !keyConfig.enabled && styles.iconDisabled,
          ]}
        >
          {renderIcon()}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.name,
                !keyConfig.enabled && styles.textDisabled,
              ]}
            >
              {keyConfig.name}
            </Text>
            <Text style={styles.badgeLabel}>{keyConfig.label}</Text>
          </View>
          <Text
            style={styles.actionSummary}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {getActionSummary()}
          </Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        <Switch
          value={keyConfig.enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#27272A', true: '#FFFFFF' }}
          thumbColor={keyConfig.enabled ? '#09090B' : '#71717A'}
        />
        <ChevronRight size={18} color={colors.textMuted} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardDisabled: {
    opacity: 0.6,
    borderColor: 'transparent',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  iconDisabled: {
    borderColor: '#3F3F46',
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  infoContainer: {
    marginLeft: 12,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  textDisabled: {
    color: colors.textSecondary,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionSummary: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  chevron: {
    marginLeft: 6,
  },
});

