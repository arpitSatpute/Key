/* eslint-disable no-undef */
import { NativeModules } from 'react-native';

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

NativeModules.PowerKeyModule = {
  lockScreen: jest.fn().mockResolvedValue(true),
  openPowerMenu: jest.fn().mockResolvedValue(true),
  getPowerCapabilities: jest.fn().mockResolvedValue({
    hasDeviceAdmin: true,
    hasAccessibility: true,
    canLockScreen: true,
    canOpenPowerMenu: true,
    androidVersion: 34,
  }),
};

NativeModules.VolumeKeyModule = {
  increaseVolume: jest.fn().mockResolvedValue({ currentVolume: 8, maxVolume: 15, stream: 'media' }),
  decreaseVolume: jest.fn().mockResolvedValue({ currentVolume: 6, maxVolume: 15, stream: 'media' }),
  setVolume: jest.fn().mockResolvedValue({ currentVolume: 10, maxVolume: 15, stream: 'media' }),
  getCurrentVolume: jest.fn().mockResolvedValue({ currentVolume: 7, maxVolume: 15, stream: 'media' }),
  getMaximumVolume: jest.fn().mockResolvedValue(15),
  getVolumeLevels: jest.fn().mockResolvedValue({
    media: { current: 7, max: 15 },
    ring: { current: 4, max: 7 },
    notification: { current: 5, max: 7 },
    alarm: { current: 6, max: 7 },
    voice: { current: 3, max: 5 },
  }),
};

NativeModules.AlertKeyModule = {
  executeAlertAction: jest.fn().mockResolvedValue(true),
  getAlertCapabilities: jest.fn().mockResolvedValue({
    ringerMode: 'normal',
    hasDndPermission: true,
    isDndActive: false,
  }),
  playAlertSound: jest.fn().mockResolvedValue(true),
  triggerHapticFeedback: jest.fn().mockResolvedValue(true),
};

NativeModules.PermissionModule = {
  checkOverlayPermission: jest.fn().mockResolvedValue(true),
  requestOverlayPermission: jest.fn().mockResolvedValue(true),
  checkDeviceAdminStatus: jest.fn().mockResolvedValue(true),
  requestDeviceAdmin: jest.fn().mockResolvedValue(true),
  removeDeviceAdmin: jest.fn().mockResolvedValue(true),
  checkAccessibilityStatus: jest.fn().mockResolvedValue(true),
  openAccessibilitySettings: jest.fn().mockResolvedValue(true),
  checkNotificationPolicyAccess: jest.fn().mockResolvedValue(true),
  requestNotificationPolicyAccess: jest.fn().mockResolvedValue(true),
  checkNotificationPermission: jest.fn().mockResolvedValue(true),
  requestNotificationPermission: jest.fn().mockResolvedValue(true),
  checkBatteryOptimizationStatus: jest.fn().mockResolvedValue(true),
  requestIgnoreBatteryOptimization: jest.fn().mockResolvedValue(true),
  getAllPermissionsStatus: jest.fn().mockResolvedValue({
    overlay: true,
    deviceAdmin: true,
    accessibility: true,
    notificationPolicy: true,
    notifications: true,
    batteryOptimizationIgnored: true,
  }),
};

NativeModules.FloatingKeyModule = {
  startOverlay: jest.fn().mockResolvedValue(true),
  stopOverlay: jest.fn().mockResolvedValue(true),
  isOverlayRunning: jest.fn().mockResolvedValue(false),
  showOverlay: jest.fn().mockResolvedValue(true),
  hideOverlay: jest.fn().mockResolvedValue(true),
  toggleOverlay: jest.fn().mockResolvedValue(true),
  toggleVolumeDial: jest.fn().mockResolvedValue(true),
  updateOverlayConfiguration: jest.fn().mockResolvedValue(true),
  getOverlayConfiguration: jest.fn().mockResolvedValue(null),
  resetOverlayConfiguration: jest.fn().mockResolvedValue(null),
};
