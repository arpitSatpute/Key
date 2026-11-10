export type KeyId = 'power' | 'volume_up' | 'volume_down' | 'alert';

export type ButtonShape = 'circle' | 'rounded' | 'pill';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ScreenEdge = 'left' | 'right' | 'top' | 'bottom';

export type AudioStream = 'media' | 'ring' | 'notification' | 'alarm' | 'voice';

export type PowerAction = 'lock_screen' | 'power_menu' | 'none';
export type VolumeAction =
  | 'volume_up'
  | 'volume_down'
  | 'volume_max'
  | 'volume_mute'
  | 'volume_up_continuous'
  | 'volume_down_continuous'
  | 'none';

export type AlertAction =
  | 'toggle_silent'
  | 'toggle_dnd'
  | 'toggle_vibrate'
  | 'play_sound'
  | 'custom_notification'
  | 'launch_app'
  | 'emergency_dial'
  | 'none';

export interface IndividualKeyConfig {
  id: KeyId;
  name: string;
  enabled: boolean;
  singleTap: string;
  doubleTap?: string;
  longPress?: string;
  color: string;
  icon: string;
  label: string;
  order: number;
  // Independent position
  edge?: 'left' | 'right';
  posYPercent?: number; // 0.0 to 1.0 (vertical position along screen)
  // Volume specific
  step?: number;
  stream?: AudioStream;
  showUi?: boolean;
  // Alert specific
  alertSound?: string;
  customAppPackage?: string;
  emergencyNumber?: string;
}

export interface OverlayConfig {
  edge: ScreenEdge;
  posYPercent: number;
  posXPercent: number;
  spacing: number;
  buttonSize: ButtonSize;
  buttonShape: ButtonShape;
  opacity: number;
  hapticFeedback: boolean;
  showLabels: boolean;
  compactMode: boolean;
  theme: 'dark' | 'light';
  keys: {
    power: IndividualKeyConfig;
    volume_up: IndividualKeyConfig;
    volume_down: IndividualKeyConfig;
    alert: IndividualKeyConfig;
  };
}

export interface PermissionsStatus {
  overlay: boolean;
  deviceAdmin: boolean;
  accessibility: boolean;
  notificationPolicy: boolean;
  notifications: boolean;
  batteryOptimizationIgnored: boolean;
}

export interface PowerCapabilities {
  hasDeviceAdmin: boolean;
  hasAccessibility: boolean;
  canLockScreen: boolean;
  canOpenPowerMenu: boolean;
  androidVersion: number;
}

export interface VolumeLevelInfo {
  current: number;
  max: number;
}

export interface AllVolumeLevels {
  media: VolumeLevelInfo;
  ring: VolumeLevelInfo;
  notification: VolumeLevelInfo;
  alarm: VolumeLevelInfo;
  voice: VolumeLevelInfo;
}

export interface AlertCapabilities {
  ringerMode: 'normal' | 'vibrate' | 'silent';
  hasDndPermission: boolean;
  isDndActive: boolean;
}

