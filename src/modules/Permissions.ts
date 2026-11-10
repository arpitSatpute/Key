import { NativeModules } from 'react-native';
import { PermissionsStatus } from '../types';

const { PermissionModule } = NativeModules;

export const Permissions = {
  checkOverlayPermission: async (): Promise<boolean> => {
    if (!PermissionModule?.checkOverlayPermission) return false;
    return PermissionModule.checkOverlayPermission();
  },

  requestOverlayPermission: async (): Promise<boolean> => {
    if (!PermissionModule?.requestOverlayPermission) return false;
    return PermissionModule.requestOverlayPermission();
  },

  checkDeviceAdminStatus: async (): Promise<boolean> => {
    if (!PermissionModule?.checkDeviceAdminStatus) return false;
    return PermissionModule.checkDeviceAdminStatus();
  },

  requestDeviceAdmin: async (): Promise<boolean> => {
    if (!PermissionModule?.requestDeviceAdmin) return false;
    return PermissionModule.requestDeviceAdmin();
  },

  removeDeviceAdmin: async (): Promise<boolean> => {
    if (!PermissionModule?.removeDeviceAdmin) return false;
    return PermissionModule.removeDeviceAdmin();
  },

  checkAccessibilityStatus: async (): Promise<boolean> => {
    if (!PermissionModule?.checkAccessibilityStatus) return false;
    return PermissionModule.checkAccessibilityStatus();
  },

  openAccessibilitySettings: async (): Promise<boolean> => {
    if (!PermissionModule?.openAccessibilitySettings) return false;
    return PermissionModule.openAccessibilitySettings();
  },

  checkNotificationPolicyAccess: async (): Promise<boolean> => {
    if (!PermissionModule?.checkNotificationPolicyAccess) return false;
    return PermissionModule.checkNotificationPolicyAccess();
  },

  requestNotificationPolicyAccess: async (): Promise<boolean> => {
    if (!PermissionModule?.requestNotificationPolicyAccess) return false;
    return PermissionModule.requestNotificationPolicyAccess();
  },

  checkNotificationPermission: async (): Promise<boolean> => {
    if (!PermissionModule?.checkNotificationPermission) return false;
    return PermissionModule.checkNotificationPermission();
  },

  requestNotificationPermission: async (): Promise<boolean> => {
    if (!PermissionModule?.requestNotificationPermission) return false;
    return PermissionModule.requestNotificationPermission();
  },

  checkBatteryOptimizationStatus: async (): Promise<boolean> => {
    if (!PermissionModule?.checkBatteryOptimizationStatus) return false;
    return PermissionModule.checkBatteryOptimizationStatus();
  },

  requestIgnoreBatteryOptimization: async (): Promise<boolean> => {
    if (!PermissionModule?.requestIgnoreBatteryOptimization) return false;
    return PermissionModule.requestIgnoreBatteryOptimization();
  },

  getAllPermissionsStatus: async (): Promise<PermissionsStatus> => {
    if (!PermissionModule?.getAllPermissionsStatus) {
      return {
        overlay: false,
        deviceAdmin: false,
        accessibility: false,
        notificationPolicy: false,
        notifications: false,
        batteryOptimizationIgnored: false,
      };
    }
    return PermissionModule.getAllPermissionsStatus();
  },
};

