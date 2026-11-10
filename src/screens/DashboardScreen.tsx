import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Sliders,
  Shield,
  Palette,
  Settings,
  Sparkles,
  Lock,
  Volume2,
  Volume1,
  Bell,
  Play,
  RotateCcw,
  Disc,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { KeyCard } from '../components/KeyCard';
import { FloatingKeyPreview } from '../components/FloatingKeyPreview';
import { useKeyStore } from '../store/useKeyStore';
import { PowerKey } from '../modules/PowerKey';
import { VolumeKey } from '../modules/VolumeKey';
import { AlertKey } from '../modules/AlertKey';
import { FloatingKeys } from '../modules/FloatingKeys';
import { KeyId } from '../types';
import { colors } from '../theme/colors';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const {
    isOverlayActive,
    isLoading,
    permissions,
    config,
    loadInitialData,
    refreshPermissions,
    toggleOverlayService,
    toggleKey,
  } = useKeyStore();

  useEffect(() => {
    loadInitialData();

    // Refresh permissions when returning to app
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadInitialData, refreshPermissions]);

  const handleToggleOverlay = async () => {
    if (!permissions.overlay) {
      Alert.alert(
        'Permission Required',
        'Display over other apps permission is required to show the floating hardware keys.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Grant Permission',
            onPress: () => navigation.navigate('Permissions'),
          },
        ]
      );
      return;
    }

    const success = await toggleOverlayService();
    if (!success) {
      Alert.alert(
        'Overlay Service',
        'Unable to toggle floating keys. Please verify display permissions.'
      );
    }
  };

  const handleTestLock = async () => {
    try {
      const locked = await PowerKey.lockScreen();
      if (!locked) {
        Alert.alert(
          'Lock Screen Required Permission',
          'Lock screen requires Device Administrator or Virtual Key Accessibility Service.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Configure Permissions',
              onPress: () => navigation.navigate('Permissions'),
            },
          ]
        );
      }
    } catch (e: any) {
      Alert.alert('Lock Screen', e.message);
    }
  };

  const handleTestVolUp = async () => {
    await VolumeKey.increaseVolume('media', true, 1);
    if (isOverlayActive) {
      await FloatingKeys.toggleVolumeDial();
    }
  };

  const handleTestVolDown = async () => {
    await VolumeKey.decreaseVolume('media', true, 1);
    if (isOverlayActive) {
      await FloatingKeys.toggleVolumeDial();
    }
  };

  const handleTestPowerMenu = async () => {
    try {
      const opened = await PowerKey.openPowerMenu();
      if (!opened) {
        Alert.alert(
          'Accessibility Required',
          'Opening the Android Power Dialog requires Virtual Key Accessibility Service.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Permissions Screen',
              onPress: () => navigation.navigate('Permissions'),
            },
          ]
        );
      }
    } catch (e: any) {
      Alert.alert('Power Dialog', e.message);
    }
  };

  const handleTestVolContinuousUp = async () => {
    for (let i = 0; i < 3; i++) {
      await VolumeKey.increaseVolume('media', true, 1);
    }
    Alert.alert('Hold-to-Repeat', 'Volume Up continuous repeat (+3 steps)');
  };

  const handleTestVolContinuousDown = async () => {
    for (let i = 0; i < 3; i++) {
      await VolumeKey.decreaseVolume('media', true, 1);
    }
    Alert.alert('Hold-to-Repeat', 'Volume Down continuous repeat (-3 steps)');
  };

  const handleTestAlertLongPress = async () => {
    const action = config.keys.alert.longPress || 'play_sound';
    await AlertKey.executeAlertAction(action as any, {
      soundType: config.keys.alert.alertSound,
      phoneNumber: config.keys.alert.emergencyNumber,
      packageName: config.keys.alert.customAppPackage,
    });
    Alert.alert('Alert (Hold)', `Executed long press: ${action}`);
  };

  const handleTestAlert = async () => {
    await AlertKey.executeAlertAction(config.keys.alert.singleTap as any);
  };

  const handleTestVolumeDial = async () => {
    if (!isOverlayActive) {
      Alert.alert(
        'Overlay Inactive',
        'Turn on the Floating Hardware Keys master switch above to launch the rotary dial on screen.'
      );
      return;
    }
    await FloatingKeys.toggleVolumeDial();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Virtual Hardware Keys"
        subtitle="Floating system controls"
        logo={require('../assets/logo.png')}
        rightElement={
          <StatusBadge
            status={isOverlayActive ? 'active' : 'inactive'}
            label={isOverlayActive ? 'Running' : 'Stopped'}
          />
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Notice Banner if overlay permission missing */}
        {!permissions.overlay && (
          <TouchableOpacity
            style={styles.permissionAlertCard}
            onPress={() => navigation.navigate('Permissions')}
            activeOpacity={0.8}
          >
            <View style={styles.alertIconBox}>
              <Shield size={20} color={colors.warning} />
            </View>
            <View style={styles.alertTextBox}>
              <Text style={styles.alertTitle}>Action Required: Grant Overlay</Text>
              <Text style={styles.alertDesc}>
                Tap here to grant "Display over other apps" so floating keys can appear.
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Master Toggle Card */}
        <View style={styles.masterCard}>
          <View style={styles.masterInfo}>
            <Text style={styles.masterTitle}>Floating Hardware Keys</Text>
            <Text style={styles.masterSubtitle}>
              {isOverlayActive
                ? 'Keys are floating and accessible over any application'
                : 'Turn on to show floating keys along screen bezel'}
            </Text>
          </View>
          <Switch
            value={isOverlayActive}
            onValueChange={handleToggleOverlay}
            trackColor={{ false: '#27272A', true: '#FFFFFF' }}
            thumbColor={isOverlayActive ? '#09090B' : '#71717A'}
          />
        </View>

        {/* Interactive Layout Preview & Quick Customize Section */}
        <View style={styles.previewSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Independent Virtual Keys</Text>
              <Text style={styles.sectionSubtitle}>
                Monochrome edge tabs • Drag anywhere along bezels
              </Text>
            </View>
            <TouchableOpacity
              style={styles.customizeButton}
              onPress={() => navigation.navigate('CustomizeKeys')}
            >
              <Sliders size={13} color="#09090B" style={{ marginRight: 5 }} />
              <Text style={styles.customizeButtonText}>Arrange Keys</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Phone Mockup Preview */}
          <FloatingKeyPreview
            config={config}
            interactive={false}
          />
        </View>

        {/* Quick Hardware Actions Bar */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Live Test Hardware Actions (Tap or Hold)</Text>
          <View style={styles.quickButtonsGrid}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={handleTestLock}
              onLongPress={handleTestPowerMenu}
              delayLongPress={400}
              activeOpacity={0.7}
            >
              <Lock size={15} color="#FFFFFF" />
              <Text style={styles.quickBtnText}>Lock (Menu)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={handleTestVolUp}
              onLongPress={handleTestVolContinuousUp}
              delayLongPress={400}
              activeOpacity={0.7}
            >
              <Volume2 size={15} color="#FFFFFF" />
              <Text style={styles.quickBtnText}>Vol + (Jog)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={handleTestVolDown}
              onLongPress={handleTestVolContinuousDown}
              delayLongPress={400}
              activeOpacity={0.7}
            >
              <Volume1 size={15} color="#FFFFFF" />
              <Text style={styles.quickBtnText}>Vol - (Jog)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={handleTestAlert}
              onLongPress={handleTestAlertLongPress}
              delayLongPress={400}
              activeOpacity={0.7}
            >
              <Bell size={15} color="#FFFFFF" />
              <Text style={styles.quickBtnText}>Alert (Hold)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Individual Key Configuration Cards */}
        <View style={styles.keysSection}>
          <Text style={styles.sectionTitle}>Individual Key Controls</Text>
          <Text style={styles.sectionSubtitle}>
            Toggle keys or tap to customize actions & gestures
          </Text>

          {(['power', 'volume_up', 'volume_down', 'alert'] as KeyId[]).map((keyId) => {
            const keyConfig = config.keys[keyId];
            return (
              <KeyCard
                key={keyId}
                keyConfig={keyConfig}
                onToggle={() => toggleKey(keyId)}
                onPressSettings={() =>
                  navigation.navigate('KeySettings', { keyId })
                }
              />
            );
          })}
        </View>

        {/* App Navigation Navigation Hub */}
        <View style={styles.navHub}>
          <TouchableOpacity
            style={styles.hubItem}
            onPress={() => navigation.navigate('Permissions')}
          >
            <View style={styles.hubIcon}>
              <Shield size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.hubTitle}>Permissions</Text>
            <Text style={styles.hubDesc}>Setup Android rights</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hubItem}
            onPress={() => navigation.navigate('Appearance')}
          >
            <View style={styles.hubIcon}>
              <Palette size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.hubTitle}>Appearance</Text>
            <Text style={styles.hubDesc}>Shapes, size, opacity</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hubItem}
            onPress={() => navigation.navigate('GeneralSettings')}
          >
            <View style={styles.hubIcon}>
              <Settings size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.hubTitle}>Settings</Text>
            <Text style={styles.hubDesc}>Auto-start & info</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  permissionAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  alertIconBox: {
    marginRight: 10,
  },
  alertTextBox: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertDesc: {
    fontSize: 11,
    color: '#A1A1AA',
    marginTop: 2,
  },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceCard,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  masterInfo: {
    flex: 1,
    marginRight: 12,
  },
  masterTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  masterSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  previewSection: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  customizeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#09090B',
  },
  quickActionsContainer: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  quickButtonsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 9,
    marginHorizontal: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 5,
  },
  keysSection: {
    marginBottom: 16,
  },
  navHub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  hubItem: {
    flex: 1,
    backgroundColor: colors.surfaceCard,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  hubIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  hubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hubDesc: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
