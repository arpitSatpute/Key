import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Power,
  Volume2,
  Volume1,
  Bell,
  Check,
  Shield,
  Play,
  Phone,
  Sliders,
  Sparkles,
  Disc,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { useKeyStore } from '../store/useKeyStore';
import { PowerKey } from '../modules/PowerKey';
import { VolumeKey } from '../modules/VolumeKey';
import { AlertKey } from '../modules/AlertKey';
import { FloatingKeys } from '../modules/FloatingKeys';
import { KeyId, IndividualKeyConfig, AudioStream } from '../types';
import { colors } from '../theme/colors';

interface KeySettingsScreenProps {
  route: any;
  navigation: any;
}

export const KeySettingsScreen: React.FC<KeySettingsScreenProps> = ({
  route,
  navigation,
}) => {
  const initialKeyId: KeyId = route?.params?.keyId || 'power';
  const [selectedKeyId, setSelectedKeyId] = useState<KeyId>(initialKeyId);

  const { config, updateKey } = useKeyStore();
  const currentKey = config.keys[selectedKeyId];

  const [currentVol, setCurrentVol] = useState<number>(7);
  const [maxVol, setMaxVol] = useState<number>(15);

  useEffect(() => {
    if (selectedKeyId === 'volume_up' || selectedKeyId === 'volume_down') {
      const stream = currentKey.stream || 'media';
      VolumeKey.getCurrentVolume(stream).then((res) => {
        setCurrentVol(res.currentVolume);
        setMaxVol(res.maxVolume);
      });
    }
  }, [selectedKeyId, currentKey.stream]);

  const colorPresets = [
    '#FFFFFF', // Monochrome White (Default)
    '#E4E4E7', // Zinc Light
    '#A1A1AA', // Zinc Muted
    '#71717A', // Slate Muted
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
  ];

  const handleTestKeyAction = async () => {
    try {
      if (selectedKeyId === 'power') {
        const locked = await PowerKey.lockScreen();
        if (!locked) {
          Alert.alert(
            'Permission Required',
            'Locking screen requires Device Administrator or Virtual Key Accessibility Service.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Permissions Screen',
                onPress: () => navigation.navigate('Permissions'),
              },
            ]
          );
        }
      } else if (selectedKeyId === 'volume_up') {
        const res = await VolumeKey.increaseVolume(
          currentKey.stream || 'media',
          currentKey.showUi ?? true,
          currentKey.step || 1
        );
        setCurrentVol(res.currentVolume);
      } else if (selectedKeyId === 'volume_down') {
        const res = await VolumeKey.decreaseVolume(
          currentKey.stream || 'media',
          currentKey.showUi ?? true,
          currentKey.step || 1
        );
        setCurrentVol(res.currentVolume);
      } else if (selectedKeyId === 'alert') {
        await AlertKey.executeAlertAction(currentKey.singleTap as any, {
          soundType: currentKey.alertSound,
          phoneNumber: currentKey.emergencyNumber,
          packageName: currentKey.customAppPackage,
        });
      }
    } catch (e: any) {
      Alert.alert('Action Test', e.message);
    }
  };

  const handleTestKeyLongPress = async () => {
    try {
      if (selectedKeyId === 'power') {
        const opened = await PowerKey.openPowerMenu();
        if (!opened) {
          Alert.alert(
            'Accessibility Service Required',
            'Opening Android Power Dialog requires Virtual Key Accessibility Service.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Permissions Screen',
                onPress: () => navigation.navigate('Permissions'),
              },
            ]
          );
        }
      } else if (selectedKeyId === 'volume_up') {
        let v = currentVol;
        for (let i = 0; i < 3; i++) {
          const res = await VolumeKey.increaseVolume(currentKey.stream || 'media', true, 1);
          v = res.currentVolume;
        }
        setCurrentVol(v);
        Alert.alert('Hold-to-Repeat', 'Volume Up continuous repeat simulated (+3 levels)');
      } else if (selectedKeyId === 'volume_down') {
        let v = currentVol;
        for (let i = 0; i < 3; i++) {
          const res = await VolumeKey.decreaseVolume(currentKey.stream || 'media', true, 1);
          v = res.currentVolume;
        }
        setCurrentVol(v);
        Alert.alert('Hold-to-Repeat', 'Volume Down continuous repeat simulated (-3 levels)');
      } else if (selectedKeyId === 'alert') {
        const action = (currentKey.longPress || 'play_sound') as any;
        await AlertKey.executeAlertAction(action, {
          soundType: currentKey.alertSound,
          phoneNumber: currentKey.emergencyNumber,
          packageName: currentKey.customAppPackage,
        });
        Alert.alert('Hold Triggered', `Triggered long press action: ${action}`);
      }
    } catch (e: any) {
      Alert.alert('Hold Action Test', e.message);
    }
  };

  const renderKeyTabs = () => {
    const keys: { id: KeyId; label: string; icon: any }[] = [
      { id: 'power', label: 'Power', icon: Power },
      { id: 'volume_up', label: 'Vol +', icon: Volume2 },
      { id: 'volume_down', label: 'Vol -', icon: Volume1 },
      { id: 'alert', label: 'Alert', icon: Bell },
    ];

    return (
      <View style={styles.tabBar}>
        {keys.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedKeyId === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setSelectedKeyId(tab.id)}
            >
              <Icon
                size={16}
                color={isActive ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <Header
        title={`${currentKey.name} Settings`}
        subtitle="Gestures & action configuration"
        onBack={() => navigation.goBack()}
      />

      {renderKeyTabs()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Key Card Summary */}
        <View style={styles.summaryCard}>
          <View
            style={[
              styles.keyIconBox,
              { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1.5, borderColor: currentKey.color || '#FFFFFF' },
            ]}
          >
            {selectedKeyId === 'power' && <Power size={24} color="#FFF" />}
            {selectedKeyId === 'volume_up' && <Volume2 size={24} color="#FFF" />}
            {selectedKeyId === 'volume_down' && <Volume1 size={24} color="#FFF" />}
            {selectedKeyId === 'alert' && <Bell size={24} color="#FFF" />}
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryName}>{currentKey.name}</Text>
            <Text style={styles.summaryStatus}>
              {currentKey.enabled ? 'Enabled in floating dock' : 'Disabled'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestKeyAction}
            onLongPress={handleTestKeyLongPress}
            delayLongPress={400}
            activeOpacity={0.7}
          >
            <Play size={14} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.testBtnText}>Tap / Hold</Text>
          </TouchableOpacity>
        </View>

        {/* Color Presets */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Button Color</Text>
          <View style={styles.colorRow}>
            {colorPresets.map((c) => {
              const isSelected = currentKey.color === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    isSelected && styles.colorSwatchSelected,
                  ]}
                  onPress={() => updateKey(selectedKeyId, { color: c })}
                >
                  {isSelected && <Check size={14} color="#FFF" strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* POWER KEY CONFIGURATION */}
        {selectedKeyId === 'power' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Single Tap Action</Text>
              <View style={styles.optionList}>
                {[
                  { id: 'lock_screen', label: 'Lock Screen / Turn Off' },
                  { id: 'power_menu', label: 'Open Power Dialog Menu' },
                  { id: 'none', label: 'None (Disabled)' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionRow,
                      currentKey.singleTap === opt.id && styles.optionRowActive,
                    ]}
                    onPress={() =>
                      updateKey('power', { singleTap: opt.id })
                    }
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        currentKey.singleTap === opt.id && styles.optionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {currentKey.singleTap === opt.id && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Double Tap Action</Text>
              <View style={styles.optionList}>
                {[
                  { id: 'power_menu', label: 'Open Power Dialog Menu' },
                  { id: 'lock_screen', label: 'Lock Screen' },
                  { id: 'none', label: 'None' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionRow,
                      currentKey.doubleTap === opt.id && styles.optionRowActive,
                    ]}
                    onPress={() =>
                      updateKey('power', { doubleTap: opt.id })
                    }
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        currentKey.doubleTap === opt.id && styles.optionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {currentKey.doubleTap === opt.id && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Long Press Action</Text>
              <View style={styles.optionList}>
                {[
                  { id: 'power_menu', label: 'Open Power Dialog Menu' },
                  { id: 'lock_screen', label: 'Lock Screen' },
                  { id: 'none', label: 'None' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionRow,
                      currentKey.longPress === opt.id && styles.optionRowActive,
                    ]}
                    onPress={() =>
                      updateKey('power', { longPress: opt.id })
                    }
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        currentKey.longPress === opt.id && styles.optionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {currentKey.longPress === opt.id && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.infoBox}>
              <Shield size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.infoBoxText}>
                Android Architecture Note: Screen locking uses Device Administrator
                or AccessibilityService. Power Dialog requires Accessibility Service.
                Third-party apps cannot reboot or physically wake hardware without
                privileged OS root.
              </Text>
            </View>
          </>
        )}

        {/* VOLUME UP / DOWN CONFIGURATION */}
        {(selectedKeyId === 'volume_up' || selectedKeyId === 'volume_down') && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Audio Stream Target</Text>
              <View style={styles.pillRow}>
                {[
                  { id: 'media', label: 'Media / Music' },
                  { id: 'ring', label: 'Ringtone' },
                  { id: 'notification', label: 'Notification' },
                  { id: 'alarm', label: 'Alarm' },
                ].map((st) => (
                  <TouchableOpacity
                    key={st.id}
                    style={[
                      styles.pillOption,
                      (currentKey.stream || 'media') === st.id &&
                        styles.pillOptionActive,
                    ]}
                    onPress={() =>
                      updateKey(selectedKeyId, { stream: st.id as AudioStream })
                    }
                  >
                    <Text
                      style={[
                        styles.pillText,
                        (currentKey.stream || 'media') === st.id &&
                          styles.pillTextActive,
                      ]}
                    >
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.titleValRow}>
                <Text style={styles.cardTitle}>Adjustment Step</Text>
                <Text style={styles.valText}>{currentKey.step || 1} level</Text>
              </View>
              <View style={styles.pillRow}>
                {[1, 2, 3, 5].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.pillOption,
                      (currentKey.step || 1) === st && styles.pillOptionActive,
                    ]}
                    onPress={() => updateKey(selectedKeyId, { step: st })}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        (currentKey.step || 1) === st && styles.pillTextActive,
                      ]}
                    >
                      +{st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Show System Volume Slider</Text>
                  <Text style={styles.switchDesc}>
                    Display native Android volume HUD on press
                  </Text>
                </View>
                <Switch
                  value={currentKey.showUi ?? true}
                  onValueChange={(val) =>
                    updateKey(selectedKeyId, { showUi: val })
                  }
                  trackColor={{ false: '#27272A', true: '#FFFFFF' }}
                  thumbColor={currentKey.showUi ? '#09090B' : '#71717A'}
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Current Stream Level</Text>
              <View style={styles.volProgressRow}>
                <Text style={styles.volLevelText}>
                  {currentVol} / {maxVol}
                </Text>
                <View style={styles.volProgressBar}>
                  <View
                    style={[
                      styles.volProgressFill,
                      {
                        width: `${Math.round((currentVol / Math.max(1, maxVol)) * 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Gesture Actions: Single Tap, Double Tap, Long Press */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Single Tap Action</Text>
              <View style={styles.optionList}>
                {[
                  { id: selectedKeyId === 'volume_up' ? 'volume_up' : 'volume_down', label: selectedKeyId === 'volume_up' ? 'Volume Up (+step)' : 'Volume Down (-step)' },
                  { id: 'volume_dial', label: 'Launch Rotary Volume Dial' },
                  { id: 'volume_max', label: 'Set Maximum Volume' },
                  { id: 'volume_mute', label: 'Mute Audio' },
                  { id: 'none', label: 'None' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionRow,
                      currentKey.singleTap === opt.id && styles.optionRowActive,
                    ]}
                    onPress={() => updateKey(selectedKeyId, { singleTap: opt.id })}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        currentKey.singleTap === opt.id && styles.optionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {currentKey.singleTap === opt.id && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Double Tap Action</Text>
              <View style={styles.optionList}>
                {[
                  { id: selectedKeyId === 'volume_up' ? 'volume_max' : 'volume_mute', label: selectedKeyId === 'volume_up' ? 'Set Maximum Volume' : 'Mute Audio' },
                  { id: selectedKeyId === 'volume_up' ? 'volume_up' : 'volume_down', label: selectedKeyId === 'volume_up' ? 'Volume Up' : 'Volume Down' },
                  { id: 'volume_dial', label: 'Launch Rotary Volume Dial' },
                  { id: 'none', label: 'None' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionRow,
                      currentKey.doubleTap === opt.id && styles.optionRowActive,
                    ]}
                    onPress={() => updateKey(selectedKeyId, { doubleTap: opt.id })}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        currentKey.doubleTap === opt.id && styles.optionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {currentKey.doubleTap === opt.id && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tap & Hold (Long Press) Action</Text>
              <View style={styles.optionList}>
                {[
                  { id: selectedKeyId === 'volume_up' ? 'volume_up_continuous' : 'volume_down_continuous', label: selectedKeyId === 'volume_up' ? 'Continuous Volume Increase (Hold-to-Repeat)' : 'Continuous Volume Decrease (Hold-to-Repeat)' },
                  { id: 'volume_dial', label: 'Launch Rotary Volume Dial' },
                  { id: selectedKeyId === 'volume_up' ? 'volume_max' : 'volume_mute', label: selectedKeyId === 'volume_up' ? 'Set Maximum Volume' : 'Mute Audio' },
                  { id: 'none', label: 'None' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionRow,
                      currentKey.longPress === opt.id && styles.optionRowActive,
                    ]}
                    onPress={() => updateKey(selectedKeyId, { longPress: opt.id })}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        currentKey.longPress === opt.id && styles.optionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {currentKey.longPress === opt.id && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rotary Volume Dial Card */}
            <View style={styles.card}>
              <View style={styles.titleValRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Disc size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={[styles.cardTitle, { marginBottom: 0 }]}>
                    Rotary Volume Dial
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.testBtn}
                  onPress={() => FloatingKeys.toggleVolumeDial()}
                >
                  <Text style={styles.testBtnText}>Test Dial</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.switchDesc, { marginTop: 8 }]}>
                Rotate your finger circular around the attached dial to smoothly raise or lower system volume with tactile haptic ticks.
              </Text>
            </View>
          </>
        )}

        {/* ALERT KEY CONFIGURATION */}
        {selectedKeyId === 'alert' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Single Tap Action</Text>
              <View style={styles.optionList}>
                {[
                  { id: 'toggle_silent', label: 'Toggle Silent / Normal / Vibrate' },
                  { id: 'toggle_dnd', label: 'Toggle Do Not Disturb (DND)' },
                  { id: 'toggle_vibrate', label: 'Toggle Vibrate Mode' },
                  { id: 'play_sound', label: 'Play Configurable Alert Tone' },
                  { id: 'custom_notification', label: 'Trigger Custom Notification' },
                  { id: 'launch_app', label: 'Launch Application' },
                  { id: 'emergency_dial', label: 'Open Emergency Contact Dialer' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionRow,
                      currentKey.singleTap === opt.id && styles.optionRowActive,
                    ]}
                    onPress={() => updateKey('alert', { singleTap: opt.id })}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        currentKey.singleTap === opt.id && styles.optionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {currentKey.singleTap === opt.id && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Emergency Number Input */}
            {(currentKey.singleTap === 'emergency_dial' ||
              currentKey.doubleTap === 'emergency_dial' ||
              currentKey.longPress === 'emergency_dial') && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Emergency Dial Shortcut</Text>
                <Text style={styles.switchDesc}>
                  Opens pre-filled dialer with confirmation before calling.
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={currentKey.emergencyNumber || '911'}
                  onChangeText={(val) =>
                    updateKey('alert', { emergencyNumber: val })
                  }
                  keyboardType="phone-pad"
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}

            {/* Custom App Launch Package */}
            {(currentKey.singleTap === 'launch_app' ||
              currentKey.doubleTap === 'launch_app' ||
              currentKey.longPress === 'launch_app') && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Launch Package Name</Text>
                <Text style={styles.switchDesc}>
                  Enter Android package (e.g., com.google.android.youtube)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={currentKey.customAppPackage || ''}
                  onChangeText={(val) =>
                    updateKey('alert', { customAppPackage: val })
                  }
                  placeholder="com.example.app"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              </View>
            )}

            {/* Alert Sound Selection */}
            {(currentKey.singleTap === 'play_sound' ||
              currentKey.doubleTap === 'play_sound' ||
              currentKey.longPress === 'play_sound') && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Alert Sound</Text>
                <View style={styles.pillRow}>
                  {['beep', 'tone', 'ringtone'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.pillOption,
                        (currentKey.alertSound || 'beep') === s &&
                          styles.pillOptionActive,
                      ]}
                      onPress={() => updateKey('alert', { alertSound: s })}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          (currentKey.alertSound || 'beep') === s &&
                            styles.pillTextActive,
                        ]}
                      >
                        {s.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Double Tap Action Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Double Tap Action</Text>
              <View style={styles.optionList}>
                {[
                  { id: 'toggle_dnd', label: 'Toggle Do Not Disturb (DND)' },
                  { id: 'toggle_silent', label: 'Toggle Silent / Normal / Vibrate' },
                  { id: 'play_sound', label: 'Play Configurable Alert Tone' },
                  { id: 'toggle_vibrate', label: 'Toggle Vibrate Mode' },
                  { id: 'none', label: 'None' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionRow,
                      currentKey.doubleTap === opt.id && styles.optionRowActive,
                    ]}
                    onPress={() => updateKey('alert', { doubleTap: opt.id })}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        currentKey.doubleTap === opt.id && styles.optionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {currentKey.doubleTap === opt.id && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tap & Hold (Long Press) Action Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tap & Hold (Long Press) Action</Text>
              <View style={styles.optionList}>
                {[
                  { id: 'play_sound', label: 'Play Configurable Alert Tone' },
                  { id: 'toggle_dnd', label: 'Toggle Do Not Disturb (DND)' },
                  { id: 'emergency_dial', label: 'Open Emergency Contact Dialer' },
                  { id: 'toggle_silent', label: 'Toggle Silent / Normal' },
                  { id: 'custom_notification', label: 'Trigger Custom Notification' },
                  { id: 'launch_app', label: 'Launch Application' },
                  { id: 'none', label: 'None' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionRow,
                      currentKey.longPress === opt.id && styles.optionRowActive,
                    ]}
                    onPress={() => updateKey('alert', { longPress: opt.id })}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        currentKey.longPress === opt.id && styles.optionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {currentKey.longPress === opt.id && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  keyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 14,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryStatus: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  testBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  optionList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorderLight,
  },
  optionRowActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  optionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  optionLabelActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}15`,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    marginTop: 6,
  },
  infoBoxText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    flex: 1,
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
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  titleValRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryLight,
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
  volProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  volLevelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryLight,
    width: 60,
  },
  volProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  volProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  textInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorderLight,
    marginTop: 10,
  },
});

