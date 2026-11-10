import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RotateCcw,
  EyeOff,
  Battery,
  ShieldAlert,
  Info,
  Terminal,
  Cpu,
  Layers,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { SettingRow } from '../components/SettingRow';
import { useKeyStore } from '../store/useKeyStore';
import { FloatingKeys } from '../modules/FloatingKeys';
import { Permissions } from '../modules/Permissions';
import { colors } from '../theme/colors';

interface GeneralSettingsScreenProps {
  navigation: any;
}

export const GeneralSettingsScreen: React.FC<GeneralSettingsScreenProps> = ({
  navigation,
}) => {
  const { isOverlayActive, toggleOverlayService, resetToDefaults } = useKeyStore();
  const [autoStartBoot, setAutoStartBoot] = useState(true);

  const handleReset = () => {
    Alert.alert(
      'Restore Factory Defaults',
      'This will reset all button layouts, colors, sizes, and gesture actions back to initial setup.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Defaults',
          style: 'destructive',
          onPress: async () => {
            await resetToDefaults();
            Alert.alert('Reset Complete', 'Default configurations restored.');
          },
        },
      ]
    );
  };

  const handleToggleHide = async () => {
    await FloatingKeys.toggleOverlay();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <Header
        title="General Settings"
        subtitle="System behavior & platform guide"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Controls Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Floating Key Service</Text>

          <SettingRow
            icon={<Cpu size={20} color={colors.primary} />}
            label="Start on Device Boot"
            description="Automatically restore floating keys after restarting phone"
            type="switch"
            switchValue={autoStartBoot}
            onSwitchChange={(val) => setAutoStartBoot(val)}
          />

          <SettingRow
            icon={<EyeOff size={20} color={colors.warning} />}
            label="Temporarily Hide Floating Keys"
            description="Toggle visibility without terminating the background service"
            type="navigation"
            onPress={handleToggleHide}
          />

          <SettingRow
            icon={<Battery size={20} color={colors.success} />}
            label="Battery Optimization Guidance"
            description="Configure background execution settings for uninterrupted access"
            type="navigation"
            onPress={() => Permissions.requestIgnoreBatteryOptimization()}
          />

          <SettingRow
            icon={<RotateCcw size={20} color={colors.danger} />}
            label="Restore All Factory Defaults"
            description="Reset positions, shapes, and gesture mappings"
            type="navigation"
            onPress={handleReset}
          />
        </View>

        {/* Android Platform Architectural Limitations Section */}
        <View style={styles.sectionCard}>
          <View style={styles.titleIconRow}>
            <ShieldAlert size={18} color={colors.warning} />
            <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>
              Android Platform Security Boundaries
            </Text>
          </View>

          <Text style={styles.disclaimerText}>
            To protect device security, Android strictly isolates physical hardware
            buttons and limits background privileges. Here is how Virtual Hardware Keys
            implements genuine system operations:
          </Text>

          <View style={styles.limitItem}>
            <Text style={styles.limitHeader}>• Screen Lock:</Text>
            <Text style={styles.limitBody}>
              Implemented via DevicePolicyManager (force-lock policy) or
              AccessibilityService (GLOBAL_ACTION_LOCK_SCREEN on Android 9+).
              Never bypasses device PIN/biometric authentication.
            </Text>
          </View>

          <View style={styles.limitItem}>
            <Text style={styles.limitHeader}>• Power Menu Dialog:</Text>
            <Text style={styles.limitBody}>
              Implemented via AccessibilityService (GLOBAL_ACTION_POWER_DIALOG).
              Non-root applications cannot reboot or shut down the device directly.
            </Text>
          </View>

          <View style={styles.limitItem}>
            <Text style={styles.limitHeader}>• Volume Keys:</Text>
            <Text style={styles.limitBody}>
              Implemented using Android AudioManager API. Intercepts stream volume
              adjustments directly without fake overlays.
            </Text>
          </View>

          <View style={styles.limitItem}>
            <Text style={styles.limitHeader}>• Do Not Disturb & Silent Mode:</Text>
            <Text style={styles.limitBody}>
              Requires Android Notification Policy Access. Never modifies system
              security states without explicit authorization.
            </Text>
          </View>
        </View>

        {/* About Card */}
        <View style={styles.sectionCard}>
          <View style={styles.logoRow}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.aboutLogo}
              resizeMode="cover"
            />
            <View style={styles.logoTextBox}>
              <Text style={styles.aboutAppName}>Key</Text>
              <Text style={styles.aboutAppTagline}>Virtual Hardware Keys for Android</Text>
            </View>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0 (Production Build)</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Android Support</Text>
            <Text style={styles.aboutValue}>Android 7.0 – 16+ (API 24–36+)</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Architecture</Text>
            <Text style={styles.aboutValue}>React Native + Kotlin Native</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Overlay API</Text>
            <Text style={styles.aboutValue}>TYPE_APPLICATION_OVERLAY</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Data Privacy</Text>
            <Text style={styles.aboutValue}>100% Local Offline Storage</Text>
          </View>
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
  sectionCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  limitItem: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorderLight,
  },
  limitHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  limitBody: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  aboutLogo: {
    width: 44,
    height: 44,
    borderRadius: 11,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  logoTextBox: {
    flex: 1,
  },
  aboutAppName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aboutAppTagline: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  aboutLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  aboutValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

