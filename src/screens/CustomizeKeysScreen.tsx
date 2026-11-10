import React, { useState, useEffect } from 'react';
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
  RotateCcw,
  Save,
  Check,
  Power,
  Volume2,
  Volume1,
  Bell,
  ArrowUp,
  ArrowDown,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { FloatingKeyPreview } from '../components/FloatingKeyPreview';
import { useKeyStore, DEFAULT_CONFIG } from '../store/useKeyStore';
import { KeyId, OverlayConfig } from '../types';
import { colors } from '../theme/colors';

interface CustomizeKeysScreenProps {
  navigation: any;
}

export const CustomizeKeysScreen: React.FC<CustomizeKeysScreenProps> = ({
  navigation,
}) => {
  const { config, updateConfig, resetToDefaults } = useKeyStore();

  const [draftConfig, setDraftConfig] = useState<OverlayConfig>(config);
  const [previousConfig] = useState<OverlayConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<KeyId>('power');

  useEffect(() => {
    setDraftConfig(config);
  }, [config]);

  const handleKeyPositionChange = (keyId: KeyId, edge: 'left' | 'right', yPercent: number) => {
    setDraftConfig((prev) => {
      const currentKey = prev.keys[keyId];
      if (!currentKey) return prev;
      const updatedKey = { ...currentKey, edge, posYPercent: yPercent };
      const updatedKeys = { ...prev.keys, [keyId]: updatedKey };
      setHasChanges(true);
      return { ...prev, keys: updatedKeys };
    });
  };

  const updateSelectedKey = (patch: Partial<any>) => {
    setDraftConfig((prev) => {
      const currentKey = prev.keys[selectedKeyId];
      if (!currentKey) return prev;
      const updatedKey = { ...currentKey, ...patch };
      const updatedKeys = { ...prev.keys, [selectedKeyId]: updatedKey };
      setHasChanges(true);
      return { ...prev, keys: updatedKeys };
    });
  };

  const handleSave = async () => {
    await updateConfig(draftConfig);
    setHasChanges(false);
    Alert.alert(
      'Layout Saved',
      'Independent virtual key positions have been updated across your device screen.'
    );
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset All Key Positions',
      'Reset all virtual keys to default independent edge positions?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setDraftConfig(DEFAULT_CONFIG);
            await resetToDefaults();
            setHasChanges(false);
          },
        },
      ]
    );
  };

  const handleRestore = () => {
    setDraftConfig(previousConfig);
    setHasChanges(false);
  };

  const selectedKey = draftConfig.keys[selectedKeyId];

  const colorPresets = [
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#EC4899', // Pink
  ];

  const keyTabs: { id: KeyId; label: string; icon: any }[] = [
    { id: 'power', label: 'Power', icon: Power },
    { id: 'volume_up', label: 'Vol +', icon: Volume2 },
    { id: 'volume_down', label: 'Vol -', icon: Volume1 },
    { id: 'alert', label: 'Alert', icon: Bell },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <Header
        title="Customize Virtual Keys"
        subtitle="Independent edge positioning"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={[styles.saveHeaderBtn, !hasChanges && styles.saveHeaderBtnDisabled]}
            onPress={handleSave}
            disabled={!hasChanges}
          >
            <Save size={15} color={hasChanges ? '#09090B' : '#71717A'} style={{ marginRight: 5 }} />
            <Text style={[styles.saveHeaderText, !hasChanges && styles.saveHeaderDisabledText]}>Save</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instructionText}>
          Each button is an independent sidebar-type edge key. Drag any button inside the phone frame to position it along either bezel, or use the controls below.
        </Text>

        {/* Interactive Phone Simulation with Real-time Multi-Key Drag */}
        <FloatingKeyPreview
          config={draftConfig}
          onKeyPositionChange={handleKeyPositionChange}
          selectedKeyId={selectedKeyId}
          onSelectKey={(id) => setSelectedKeyId(id)}
          interactive={true}
        />

        {/* Key Selection Tabs */}
        <View style={styles.controlCard}>
          <Text style={styles.controlTitle}>Select Key to Arrange</Text>
          <View style={styles.keyTabRow}>
            {keyTabs.map((tab) => {
              const isSelected = selectedKeyId === tab.id;
              const Icon = tab.icon;
              const keyConf = draftConfig.keys[tab.id];
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.keyTabItem,
                    isSelected && styles.keyTabItemActive,
                  ]}
                  onPress={() => setSelectedKeyId(tab.id)}
                >
                  <View
                    style={[
                      styles.tabDot,
                      { backgroundColor: '#FFFFFF' },
                    ]}
                  />
                  <Icon size={14} color={isSelected ? '#FFFFFF' : '#71717A'} />
                  <Text
                    style={[
                      styles.keyTabLabel,
                      isSelected && styles.keyTabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Key Alignment & Bezel Placement */}
        {selectedKey && (
          <View style={styles.controlCard}>
            <View style={styles.titleValRow}>
              <Text style={styles.controlTitle}>
                {selectedKey.name} • Screen Bezel
              </Text>
              <Text style={styles.valText}>
                {selectedKey.edge === 'left' ? 'Left Edge' : 'Right Edge'}
              </Text>
            </View>
            <View style={styles.pillRow}>
              <TouchableOpacity
                style={[
                  styles.pillOption,
                  selectedKey.edge === 'left' && styles.pillOptionActive,
                ]}
                onPress={() => updateSelectedKey({ edge: 'left' })}
              >
                <Text
                  style={[
                    styles.pillText,
                    selectedKey.edge === 'left' && styles.pillTextActive,
                  ]}
                >
                  Dock to Left Bezel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pillOption,
                  (selectedKey.edge || 'right') === 'right' && styles.pillOptionActive,
                ]}
                onPress={() => updateSelectedKey({ edge: 'right' })}
              >
                <Text
                  style={[
                    styles.pillText,
                    (selectedKey.edge || 'right') === 'right' && styles.pillTextActive,
                  ]}
                >
                  Dock to Right Bezel
                </Text>
              </TouchableOpacity>
            </View>

            {/* Vertical Position Presets & Stepper */}
            <View style={[styles.titleValRow, { marginTop: 16 }]}>
              <Text style={styles.controlTitle}>Vertical Position Along Screen</Text>
              <Text style={styles.valText}>
                {Math.round((selectedKey.posYPercent ?? 0.5) * 100)}%
              </Text>
            </View>
            <View style={styles.pillRow}>
              {[
                { label: 'Top (18%)', val: 0.18 },
                { label: 'Upper (32%)', val: 0.32 },
                { label: 'Middle (48%)', val: 0.48 },
                { label: 'Lower (64%)', val: 0.64 },
              ].map((pos) => (
                <TouchableOpacity
                  key={pos.val}
                  style={[
                    styles.pillOption,
                    Math.abs((selectedKey.posYPercent ?? 0.5) - pos.val) < 0.05 &&
                      styles.pillOptionActive,
                  ]}
                  onPress={() => updateSelectedKey({ posYPercent: pos.val })}
                >
                  <Text
                    style={[
                      styles.pillText,
                      Math.abs((selectedKey.posYPercent ?? 0.5) - pos.val) < 0.05 &&
                        styles.pillTextActive,
                    ]}
                  >
                    {pos.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Micro Steppers for Y Position */}
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() =>
                  updateSelectedKey({
                    posYPercent: Math.max(0.05, (selectedKey.posYPercent ?? 0.5) - 0.04),
                  })
                }
              >
                <ArrowUp size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.stepBtnText}>Nudge Up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() =>
                  updateSelectedKey({
                    posYPercent: Math.min(0.95, (selectedKey.posYPercent ?? 0.5) + 0.04),
                  })
                }
              >
                <ArrowDown size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.stepBtnText}>Nudge Down</Text>
              </TouchableOpacity>
            </View>

            {/* Key Enable Switch */}
            <View style={[styles.switchRow, { marginTop: 16 }]}>
              <View>
                <Text style={styles.switchTitle}>Enable {selectedKey.name}</Text>
                <Text style={styles.switchDesc}>Show on screen as floating key</Text>
              </View>
              <Switch
                value={selectedKey.enabled}
                onValueChange={(val) => updateSelectedKey({ enabled: val })}
                trackColor={{ false: '#334155', true: `${colors.primary}80` }}
                thumbColor={selectedKey.enabled ? colors.primary : '#94A3B8'}
              />
            </View>

            {/* Color Swatches */}
            <Text style={[styles.controlTitle, { marginTop: 16 }]}>
              Key Accent Glow Color
            </Text>
            <View style={styles.colorRow}>
              {colorPresets.map((c) => {
                const isSelected = selectedKey.color === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      isSelected && styles.colorSwatchSelected,
                    ]}
                    onPress={() => updateSelectedKey({ color: c })}
                  >
                    {isSelected && <Check size={14} color="#FFF" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Action Controls */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={handleSave}
          >
            <Save size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Save All Key Positions</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn]}
              onPress={handleReset}
            >
              <RotateCcw size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.secondaryBtnText}>Reset Layout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn]}
              onPress={handleRestore}
            >
              <Text style={styles.secondaryBtnText}>Restore</Text>
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
  instructionText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveHeaderBtnDisabled: {
    backgroundColor: '#27272A',
  },
  saveHeaderText: {
    color: '#09090B',
    fontWeight: '700',
    fontSize: 13,
  },
  saveHeaderDisabledText: {
    color: '#71717A',
  },
  controlCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  controlTitle: {
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
    color: colors.primary,
  },
  keyTabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keyTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  keyTabItemActive: {
    backgroundColor: `${colors.primary}25`,
    borderColor: colors.primary,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  keyTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  keyTabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
  stepperRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  stepBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
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
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  primaryBtnText: {
    color: '#09090B',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
});
