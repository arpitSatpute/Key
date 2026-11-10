import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Layers,
  Power,
  Shield,
  BellOff,
  Bell,
  BatteryCharging,
  RefreshCw,
  Info,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { PermissionItem } from '../components/PermissionItem';
import { useKeyStore } from '../store/useKeyStore';
import { Permissions } from '../modules/Permissions';
import { PowerKey } from '../modules/PowerKey';
import { AlertKey } from '../modules/AlertKey';
import { colors } from '../theme/colors';

interface PermissionsScreenProps {
  navigation: any;
}

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({
  navigation,
}) => {
  const { permissions, refreshPermissions } = useKeyStore();

  useEffect(() => {
    refreshPermissions();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshPermissions]);

  const handleTestLock = async () => {
    try {
      const locked = await PowerKey.lockScreen();
      if (!locked) {
        Alert.alert(
          'Lock Screen',
          'Lock screen requires Device Administrator or Virtual Key Accessibility Service.'
        );
      }
    } catch (e: any) {
      Alert.alert('Lock Screen', e.message);
    }
  };

  const handleTestPowerMenu = async () => {
    try {
      const opened = await PowerKey.openPowerMenu();
      if (!opened) {
        Alert.alert(
          'Power Menu',
          'Power Menu requires Virtual Key Accessibility Service to be active.'
        );
      }
    } catch (e: any) {
      Alert.alert('Power Menu', e.message);
    }
  };

  const handleTestDnd = async () => {
    try {
      await AlertKey.executeAlertAction('toggle_dnd');
    } catch (e: any) {
      Alert.alert('DND Test', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <Header
        title="Permissions & Setup"
        subtitle="Android system privileges guide"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={refreshPermissions}
          >
            <RefreshCw size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy & Transparency Banner */}
        <View style={styles.privacyBanner}>
          <Info size={18} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={styles.privacyText}>
            Virtual Hardware Keys operates entirely offline. No user data, keystrokes,
            or screen contents are collected or transmitted.
          </Text>
        </View>

        {/* 1. Display Over Other Apps */}
        <PermissionItem
          icon={<Layers size={20} color={colors.primary} />}
          title="Display Over Other Apps"
          description="Allows virtual hardware keys to float above apps, games, browsers, and home screen."
          badgeType="critical"
          isGranted={permissions.overlay}
          onEnable={() => Permissions.requestOverlayPermission()}
        />

        {/* 2. Accessibility Service */}
        <PermissionItem
          icon={<Power size={20} color={colors.keys.power} />}
          title="Virtual Key Accessibility Service"
          description="Enables the Virtual Power Key to trigger the system Power Menu dialog and lock the screen on Android 9+. Does NOT inspect screen content or read keystrokes."
          badgeType="recommended"
          isGranted={permissions.accessibility}
          onEnable={() => Permissions.openAccessibilitySettings()}
          onTest={handleTestPowerMenu}
          testLabel="Test Power Menu"
        />

        {/* 3. Device Administrator */}
        <PermissionItem
          icon={<Shield size={20} color={colors.warning} />}
          title="Device Administrator"
          description="Enables native screen locking on Android versions without accessibility. Requests only the force-lock policy."
          badgeType="recommended"
          isGranted={permissions.deviceAdmin}
          onEnable={() => Permissions.requestDeviceAdmin()}
          onTest={handleTestLock}
          testLabel="Test Screen Lock"
        />

        {/* 4. Do Not Disturb / Notification Policy */}
        <PermissionItem
          icon={<BellOff size={20} color={colors.accent} />}
          title="Do Not Disturb Policy Access"
          description="Required if you configure the Virtual Alert Key to toggle Do Not Disturb or Silent mode on modern Android."
          badgeType="optional"
          isGranted={permissions.notificationPolicy}
          onEnable={() => Permissions.requestNotificationPolicyAccess()}
          onTest={handleTestDnd}
          testLabel="Test DND Toggle"
        />

        {/* 5. Notifications Permission */}
        <PermissionItem
          icon={<Bell size={20} color={colors.success} />}
          title="Post Notifications"
          description="Required on Android 13+ for the foreground service notification that keeps floating controls active and provides quick show/hide controls."
          badgeType="recommended"
          isGranted={permissions.notifications}
          onEnable={() => Permissions.requestNotificationPermission()}
        />

        {/* 6. Battery Optimization Exemption */}
        <PermissionItem
          icon={<BatteryCharging size={20} color={colors.warning} />}
          title="Ignore Battery Optimization"
          description="Prevents aggressive OEM background cleaners (e.g. MIUI, OneUI, EMUI) from killing the floating service when the app is in the background."
          badgeType="optional"
          isGranted={permissions.batteryOptimizationIgnored}
          onEnable={() => Permissions.requestIgnoreBatteryOptimization()}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  privacyText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    flex: 1,
  },
});

