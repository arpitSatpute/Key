import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Palette,
  Vibrate,
  Sliders,
  Type,
  Maximize,
  Sparkles,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { SettingRow } from '../components/SettingRow';
import { useKeyStore } from '../store/useKeyStore';
import { AlertKey } from '../modules/AlertKey';
import { ButtonShape, ButtonSize } from '../types';
import { colors } from '../theme/colors';

interface AppearanceScreenProps {
  navigation: any;
}

export const AppearanceScreen: React.FC<AppearanceScreenProps> = ({
  navigation,
}) => {
  const { config, updateConfig } = useKeyStore();

  const handleTestVibration = async (type: string) => {
    await AlertKey.triggerHapticFeedback(type);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <Header
        title="Appearance & Styling"
        subtitle="Visual design, shapes & feedback"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Button Size Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Button Size</Text>
          <View style={styles.pillRow}>
            {(['small', 'medium', 'large'] as ButtonSize[]).map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.pillOption,
                  config.buttonSize === size && styles.pillOptionActive,
                ]}
                onPress={() => updateConfig({ buttonSize: size })}
              >
                <Text
                  style={[
                    styles.pillText,
                    config.buttonSize === size && styles.pillTextActive,
                  ]}
                >
                  {size.toUpperCase()}
                  {size === 'small'
                    ? ' (42dp)'
                    : size === 'medium'
                    ? ' (50dp)'
                    : ' (58dp)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Button Shape Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Button Geometry Shape</Text>
          <View style={styles.pillRow}>
            {(['circle', 'rounded', 'pill'] as ButtonShape[]).map((shape) => (
              <TouchableOpacity
                key={shape}
                style={[
                  styles.pillOption,
                  config.buttonShape === shape && styles.pillOptionActive,
                ]}
                onPress={() => updateConfig({ buttonShape: shape })}
              >
                <Text
                  style={[
                    styles.pillText,
                    config.buttonShape === shape && styles.pillTextActive,
                  ]}
                >
                  {shape === 'circle'
                    ? 'Circular'
                    : shape === 'rounded'
                    ? 'Rounded Square'
                    : 'Pill'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transparency / Opacity */}
        <View style={styles.sectionCard}>
          <View style={styles.titleValRow}>
            <Text style={styles.sectionTitle}>Overlay Transparency</Text>
            <Text style={styles.valText}>
              {Math.round(config.opacity * 100)}%
            </Text>
          </View>
          <View style={styles.pillRow}>
            {[0.4, 0.6, 0.75, 0.9, 1.0].map((op) => (
              <TouchableOpacity
                key={op}
                style={[
                  styles.pillOption,
                  config.opacity === op && styles.pillOptionActive,
                ]}
                onPress={() => updateConfig({ opacity: op })}
              >
                <Text
                  style={[
                    styles.pillText,
                    config.opacity === op && styles.pillTextActive,
                  ]}
                >
                  {Math.round(op * 100)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Spacing */}
        <View style={styles.sectionCard}>
          <View style={styles.titleValRow}>
            <Text style={styles.sectionTitle}>Button Spacing</Text>
            <Text style={styles.valText}>{config.spacing} dp</Text>
          </View>
          <View style={styles.pillRow}>
            {[6, 10, 14, 18, 22].map((sp) => (
              <TouchableOpacity
                key={sp}
                style={[
                  styles.pillOption,
                  config.spacing === sp && styles.pillOptionActive,
                ]}
                onPress={() => updateConfig({ spacing: sp })}
              >
                <Text
                  style={[
                    styles.pillText,
                    config.spacing === sp && styles.pillTextActive,
                  ]}
                >
                  {sp} dp
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Haptic Feedback Section */}
        <View style={styles.sectionCard}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Haptic Feedback</Text>
              <Text style={styles.switchDesc}>
                Vibrate with tactile click on button press
              </Text>
            </View>
            <Switch
              value={config.hapticFeedback}
              onValueChange={(val) => updateConfig({ hapticFeedback: val })}
              trackColor={{ false: '#27272A', true: '#FFFFFF' }}
              thumbColor={config.hapticFeedback ? '#09090B' : '#71717A'}
            />
          </View>

          {config.hapticFeedback && (
            <View style={styles.hapticTestRow}>
              <Text style={styles.hapticTestTitle}>Test Vibration Patterns:</Text>
              <View style={styles.hapticButtons}>
                <TouchableOpacity
                  style={styles.hapticTestBtn}
                  onPress={() => handleTestVibration('click')}
                >
                  <Text style={styles.hapticTestBtnText}>Click</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.hapticTestBtn}
                  onPress={() => handleTestVibration('heavy')}
                >
                  <Text style={styles.hapticTestBtnText}>Heavy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.hapticTestBtn}
                  onPress={() => handleTestVibration('double')}
                >
                  <Text style={styles.hapticTestBtnText}>Double</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.hapticTestBtn}
                  onPress={() => handleTestVibration('tick')}
                >
                  <Text style={styles.hapticTestBtnText}>Tick</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Theme */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Application Theme</Text>
          <View style={styles.pillRow}>
            <TouchableOpacity
              style={[
                styles.pillOption,
                config.theme === 'dark' && styles.pillOptionActive,
              ]}
              onPress={() => updateConfig({ theme: 'dark' })}
            >
              <Text
                style={[
                  styles.pillText,
                  config.theme === 'dark' && styles.pillTextActive,
                ]}
              >
                Deep Obsidian (Dark)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillOption,
                config.theme === 'light' && styles.pillOptionActive,
              ]}
              onPress={() => updateConfig({ theme: 'light' })}
            >
              <Text
                style={[
                  styles.pillText,
                  config.theme === 'light' && styles.pillTextActive,
                ]}
              >
                Titanium Light
              </Text>
            </TouchableOpacity>
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  titleValRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  valText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillOption: {
    flex: 1,
    minWidth: 70,
    backgroundColor: colors.surfaceLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorderLight,
  },
  pillOptionActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: '#09090B',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  switchDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  hapticTestRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  hapticTestTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  hapticButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  hapticTestBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  hapticTestBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

