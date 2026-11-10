import { NativeModules } from 'react-native';
import { AlertAction, AlertCapabilities } from '../types';

const { AlertKeyModule } = NativeModules;

export interface AlertActionParams {
  soundType?: string;
  title?: string;
  message?: string;
  packageName?: string;
  phoneNumber?: string;
  type?: string;
}

export const AlertKey = {
  executeAlertAction: async (
    action: AlertAction,
    params?: AlertActionParams
  ): Promise<any> => {
    if (!AlertKeyModule?.executeAlertAction) {
      console.warn('AlertKeyModule not available');
      return false;
    }
    return AlertKeyModule.executeAlertAction(action, params || null);
  },

  getCapabilities: async (): Promise<AlertCapabilities> => {
    if (!AlertKeyModule?.getAlertCapabilities) {
      return {
        ringerMode: 'normal',
        hasDndPermission: false,
        isDndActive: false,
      };
    }
    return AlertKeyModule.getAlertCapabilities();
  },

  playAlertSound: async (soundType: string = 'beep'): Promise<boolean> => {
    if (!AlertKeyModule?.playAlertSound) return false;
    return AlertKeyModule.playAlertSound(soundType);
  },

  triggerHapticFeedback: async (type: string = 'click'): Promise<boolean> => {
    if (!AlertKeyModule?.triggerHapticFeedback) return false;
    return AlertKeyModule.triggerHapticFeedback(type);
  },
};

