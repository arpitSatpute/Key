import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBadge } from './StatusBadge';
import { colors } from '../theme/colors';

interface PermissionItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badgeType: 'critical' | 'recommended' | 'optional';
  isGranted: boolean;
  onEnable: () => void;
  onTest?: () => void;
  testLabel?: string;
}

export const PermissionItem: React.FC<PermissionItemProps> = ({
  icon,
  title,
  description,
  badgeType,
  isGranted,
  onEnable,
  onTest,
  testLabel = 'Test Function',
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>{icon}</View>
        <View style={styles.titleBox}>
          <View style={styles.titleTagRow}>
            <Text style={styles.title}>{title}</Text>
            <View
              style={[
                styles.badgeType,
                badgeType === 'critical'
                  ? styles.badgeCritical
                  : badgeType === 'recommended'
                  ? styles.badgeRecommended
                  : styles.badgeOptional,
              ]}
            >
              <Text
                style={[
                  styles.badgeTypeText,
                  badgeType === 'critical'
                    ? styles.textCritical
                    : badgeType === 'recommended'
                    ? styles.textRecommended
                    : styles.textOptional,
                ]}
              >
                {badgeType.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        <StatusBadge status={isGranted ? 'granted' : 'required'} />
      </View>

      <Text style={styles.description}>{description}</Text>

      <View style={styles.actionsRow}>
        {!isGranted ? (
          <TouchableOpacity style={styles.enableButton} onPress={onEnable}>
            <Text style={styles.enableButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.grantedRow}>
            <Text style={styles.grantedText}>✓ Configured and Active</Text>
            {onTest && (
              <TouchableOpacity style={styles.testButton} onPress={onTest}>
                <Text style={styles.testButtonText}>{testLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleBox: {
    flex: 1,
  },
  titleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 6,
  },
  badgeType: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeCritical: {
    backgroundColor: `${colors.danger}22`,
  },
  badgeRecommended: {
    backgroundColor: `${colors.warning}22`,
  },
  badgeOptional: {
    backgroundColor: `${colors.primary}22`,
  },
  badgeTypeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  textCritical: {
    color: colors.danger,
  },
  textRecommended: {
    color: colors.warning,
  },
  textOptional: {
    color: colors.primary,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 10,
  },
  actionsRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  enableButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  enableButtonText: {
    color: '#09090B',
    fontSize: 13,
    fontWeight: '700',
  },
  grantedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grantedText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorderLight,
  },
  testButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
});

