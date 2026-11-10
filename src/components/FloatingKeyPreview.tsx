import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import {
  Power,
  Volume2,
  Volume1,
  Bell,
} from 'lucide-react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { KeyId, OverlayConfig } from '../types';
import { colors } from '../theme/colors';

interface FloatingKeyPreviewProps {
  config: OverlayConfig;
  onKeyPositionChange?: (keyId: KeyId, edge: 'left' | 'right', yPercent: number) => void;
  selectedKeyId?: KeyId;
  onSelectKey?: (keyId: KeyId) => void;
  interactive?: boolean;
}

const PREVIEW_WIDTH = 224;
const PREVIEW_HEIGHT = 440;
const KEY_HEIGHT = 40;
const MIN_TOP = 40;
const MAX_TOP = PREVIEW_HEIGHT - KEY_HEIGHT - 30;

export const FloatingKeyPreview: React.FC<FloatingKeyPreviewProps> = ({
  config,
  onKeyPositionChange,
  selectedKeyId,
  onSelectKey,
  interactive = true,
}) => {
  const [showRotaryDial, setShowRotaryDial] = useState(false);
  const [dialAttachedKey, setDialAttachedKey] = useState<KeyId>('volume_up');
  const [dialVolume, setDialVolume] = useState(72); // 0 - 100%
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);

  const triggerFeedback = (text: string) => {
    setGestureFeedback(text);
    setTimeout(() => setGestureFeedback(null), 2400);
  };

  // Helper to calculate Y position from percent
  const getYPos = (yPercent: number) => {
    return Math.max(MIN_TOP, Math.min(MAX_TOP, MIN_TOP + (MAX_TOP - MIN_TOP) * yPercent));
  };

  // Rotary Dial touch handler
  const dialPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const delta = -gestureState.dy * 0.5 + gestureState.dx * 0.5;
        setDialVolume((prev) => Math.max(0, Math.min(100, Math.round(prev + delta * 0.2))));
      },
    })
  ).current;

  // SVG Arc calculation for rotary dial
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const keyList: { id: KeyId; defaultEdge: 'left' | 'right'; defaultY: number }[] = [
    { id: 'power', defaultEdge: 'right', defaultY: 0.18 },
    { id: 'volume_up', defaultEdge: 'right', defaultY: 0.32 },
    { id: 'volume_down', defaultEdge: 'right', defaultY: 0.46 },
    { id: 'alert', defaultEdge: 'right', defaultY: 0.62 },
  ];

  // Attached volume dial position (docked flush against phone edge bezel)
  const activeVolKeyConfig = config.keys[dialAttachedKey] || config.keys.volume_up;
  const dialEdge = activeVolKeyConfig.edge || 'right';
  const dialYPercent = activeVolKeyConfig.posYPercent ?? 0.32;
  const dialY = Math.max(30, Math.min(PREVIEW_HEIGHT - 120, getYPos(dialYPercent) + KEY_HEIGHT / 2 - 52));

  // Edge Arc Semi-Circle Jog Wheel paths
  const arcRadius = 42;
  const jogW = 58;
  const jogH = 104;
  const jogCy = jogH / 2;

  const bgSemiPath = dialEdge === 'right'
    ? `M ${jogW} 6 A 46 46 0 0 0 ${jogW} ${jogH - 6} Z`
    : `M 0 6 A 46 46 0 0 1 0 ${jogH - 6} Z`;

  const trackArcPath = dialEdge === 'right'
    ? describeArc(jogW, jogCy, arcRadius, 195, 345)
    : describeArc(0, jogCy, arcRadius, 165, 15);

  const activeSweepDeg = 150 * (dialVolume / 100);
  const activeArcPath = dialEdge === 'right'
    ? describeArc(jogW, jogCy, arcRadius, 195, 195 + activeSweepDeg)
    : describeArc(0, jogCy, arcRadius, 165, 165 - activeSweepDeg);

  return (
    <View style={styles.wrapper}>
      {/* Phone Mockup Frame */}
      <View style={styles.phoneFrame}>
        {/* Dynamic Island */}
        <View style={styles.dynamicIsland} />

        {/* Screen Content */}
        <View style={styles.screenContent}>
          <View style={styles.mockClock}>
            <Text style={styles.mockTimeText}>09:41</Text>
            <Text style={styles.mockDateText}>Tuesday, November 10</Text>
          </View>

          {/* Gesture Live Feedback Toast */}
          {gestureFeedback && (
            <View style={styles.feedbackToast}>
              <Text style={styles.feedbackToastText}>{gestureFeedback}</Text>
            </View>
          )}

          {/* Edge Arc / Semi-Circle Jog Wheel Docked Directly to Bezel */}
          {showRotaryDial && (
            <View
              {...dialPanResponder.panHandlers}
              style={[
                styles.jogWheelContainer,
                {
                  top: dialY,
                  [dialEdge === 'left' ? 'left' : 'right']: 0,
                },
              ]}
            >
              <Svg width={jogW} height={jogH}>
                {/* Translucent Semicircle Glass Background & Border (Monochrome B&W) */}
                <SvgPath
                  d={bgSemiPath}
                  fill="rgba(0, 0, 0, 0.45)"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                />
                {/* Outer Track Arc */}
                <SvgPath
                  d={trackArcPath}
                  stroke="rgba(255, 255, 255, 0.20)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Active Crisp White Progress Arc */}
                <SvgPath
                  d={activeArcPath}
                  stroke="#FFFFFF"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>

              <View
                style={[
                  styles.dialCenterContent,
                  dialEdge === 'right' ? { left: 8 } : { right: 8 },
                ]}
              >
                <Volume2 size={12} color="#FFFFFF" />
                <Text style={styles.dialPercentText}>{dialVolume}%</Text>
                <Text style={styles.dialStreamLabel}>MEDIA</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.closeDialBtn,
                  dialEdge === 'right' ? { left: 6 } : { right: 6 },
                ]}
                onPress={() => setShowRotaryDial(false)}
              >
                <Text style={styles.closeDialText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* INDEPENDENT SIDEBAR-TYPE KEYS */}
          {keyList.map(({ id, defaultEdge, defaultY }) => {
            const keyConfig = config.keys[id];
            if (!keyConfig || keyConfig.enabled === false) return null;

            const edge = keyConfig.edge || defaultEdge;
            const yPercent = keyConfig.posYPercent ?? defaultY;
            const topPos = getYPos(yPercent);
            const isSelected = selectedKeyId === id;

            // PanResponder for each key to drag independently
            const keyPanResponder = PanResponder.create({
              onStartShouldSetPanResponder: () => interactive,
              onMoveShouldSetPanResponder: () => interactive,
              onPanResponderMove: (_, gestureState) => {
                if (!interactive || !onKeyPositionChange) return;

                const newY = topPos + gestureState.dy;
                const boundedY = Math.max(MIN_TOP, Math.min(MAX_TOP, newY));
                const newYPercent = (boundedY - MIN_TOP) / (MAX_TOP - MIN_TOP);

                // Check edge flip
                const newEdge = gestureState.moveX < PREVIEW_WIDTH / 2 ? 'left' : 'right';
                onKeyPositionChange(id, newEdge, Math.max(0.05, Math.min(0.95, newYPercent)));
              },
            });

            const renderKeyIcon = () => {
              const iconColor = '#FFFFFF';
              const strokeW = 2.0;
              switch (id) {
                case 'power':
                  return <Power size={11} color={iconColor} strokeWidth={strokeW} />;
                case 'volume_up':
                  return <Volume2 size={11} color={iconColor} strokeWidth={strokeW} />;
                case 'volume_down':
                  return <Volume1 size={11} color={iconColor} strokeWidth={strokeW} />;
                case 'alert':
                  return <Bell size={11} color={iconColor} strokeWidth={strokeW} />;
              }
            };

            const handlePress = () => {
              onSelectKey?.(id);

              if (id === 'power') {
                triggerFeedback('Power: Tap → Lock Screen');
              } else if (id === 'volume_up') {
                setDialAttachedKey('volume_up');
                setShowRotaryDial((prev) => !prev);
                triggerFeedback('Vol+: Tap → Raise Vol + Attached Dial');
              } else if (id === 'volume_down') {
                setDialAttachedKey('volume_down');
                setShowRotaryDial((prev) => !prev);
                triggerFeedback('Vol-: Tap → Lower Vol + Attached Dial');
              } else if (id === 'alert') {
                triggerFeedback('Alert: Tap → Toggle Silent Mode');
              }
            };

            const handleLongPress = () => {
              onSelectKey?.(id);

              if (id === 'power') {
                triggerFeedback('Power: Hold → Android Power Menu');
              } else if (id === 'volume_up') {
                triggerFeedback('Vol+: Hold → Continuous Volume Repeat ▲▲');
              } else if (id === 'volume_down') {
                triggerFeedback('Vol-: Hold → Continuous Volume Repeat ▼▼');
              } else if (id === 'alert') {
                triggerFeedback('Alert: Hold → Trigger Alert Tone');
              }
            };

            return (
              <View
                key={id}
                {...(interactive ? keyPanResponder.panHandlers : {})}
                style={[
                  styles.independentKeyWrapper,
                  {
                    top: topPos,
                    [edge === 'left' ? 'left' : 'right']: 0,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePress}
                  onLongPress={handleLongPress}
                  delayLongPress={400}
                  style={[
                    styles.sidebarKeyTab,
                    edge === 'right' ? styles.tabDockedRight : styles.tabDockedLeft,
                    { borderColor: keyConfig.color || colors.primary },
                    isSelected && styles.tabSelected,
                  ]}
                >
                  {/* Grip Bezel Line */}
                  <View
                    style={[
                      styles.gripLine,
                      edge === 'right' ? styles.gripRight : styles.gripLeft,
                    ]}
                  />

                  {/* Centered Key Icon */}
                  <View style={styles.iconContainer}>{renderKeyIcon()}</View>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Home indicator bar at bottom */}
          <View style={styles.homeIndicator} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  phoneFrame: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#27272A',
    backgroundColor: '#09090B',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  dynamicIsland: {
    width: 68,
    height: 14,
    borderRadius: 8,
    backgroundColor: '#000',
    alignSelf: 'center',
    marginTop: 8,
    zIndex: 10,
  },
  screenContent: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
    padding: 12,
  },
  mockClock: {
    alignItems: 'center',
    marginTop: 20,
  },
  mockTimeText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  mockDateText: {
    fontSize: 10,
    color: '#71717A',
    marginTop: 2,
  },
  feedbackToast: {
    position: 'absolute',
    top: 54,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(24, 24, 27, 0.95)',
    borderColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  feedbackToastText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  independentKeyWrapper: {
    position: 'absolute',
    zIndex: 25,
  },
  sidebarKeyTab: {
    width: 17,
    height: KEY_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  tabDockedRight: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    paddingRight: 1,
  },
  tabDockedLeft: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    paddingLeft: 1,
  },
  tabSelected: {
    borderWidth: 1.8,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  gripLine: {
    position: 'absolute',
    width: 1.5,
    height: 14,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  gripRight: {
    right: 1,
  },
  gripLeft: {
    left: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  jogWheelContainer: {
    position: 'absolute',
    width: 58,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 40,
  },
  dialCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialPercentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  dialStreamLabel: {
    color: '#94A3B8',
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  closeDialBtn: {
    position: 'absolute',
    top: 4,
    padding: 3,
  },
  closeDialText: {
    color: '#64748B',
    fontSize: 8.5,
    fontWeight: '700',
  },
  homeIndicator: {
    width: 72,
    height: 3,
    backgroundColor: '#64748B',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
});
