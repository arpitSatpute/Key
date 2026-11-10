import { NativeModules } from 'react-native';
import { PowerCapabilities } from '../types';

const { PowerKeyModule } = NativeModules;

export const PowerKey = {
  lockScreen: async (): Promise<boolean> => {
    if (!PowerKeyModule?.lockScreen) {
      console.warn('PowerKeyModule not available');
      return false;
    }
    return PowerKeyModule.lockScreen();
  },

  openPowerMenu: async (): Promise<boolean> => {
    if (!PowerKeyModule?.openPowerMenu) {
      console.warn('PowerKeyModule not available');
      return false;
    }
    return PowerKeyModule.openPowerMenu();
  },

  getCapabilities: async (): Promise<PowerCapabilities> => {
    if (!PowerKeyModule?.getPowerCapabilities) {
      return {
        hasDeviceAdmin: false,
        hasAccessibility: false,
        canLockScreen: false,
        canOpenPowerMenu: false,
        androidVersion: 30,
      };
    }
    return PowerKeyModule.getPowerCapabilities();
  },
};

