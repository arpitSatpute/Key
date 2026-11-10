import { NativeModules } from 'react-native';
import { OverlayConfig } from '../types';

const { FloatingKeyModule } = NativeModules;

export const FloatingKeys = {
  startOverlay: async (): Promise<boolean> => {
    if (!FloatingKeyModule?.startOverlay) return false;
    return FloatingKeyModule.startOverlay();
  },

  stopOverlay: async (): Promise<boolean> => {
    if (!FloatingKeyModule?.stopOverlay) return false;
    return FloatingKeyModule.stopOverlay();
  },

  isOverlayRunning: async (): Promise<boolean> => {
    if (!FloatingKeyModule?.isOverlayRunning) return false;
    return FloatingKeyModule.isOverlayRunning();
  },

  showOverlay: async (): Promise<boolean> => {
    if (!FloatingKeyModule?.showOverlay) return false;
    return FloatingKeyModule.showOverlay();
  },

  hideOverlay: async (): Promise<boolean> => {
    if (!FloatingKeyModule?.hideOverlay) return false;
    return FloatingKeyModule.hideOverlay();
  },

  toggleOverlay: async (): Promise<boolean> => {
    if (!FloatingKeyModule?.toggleOverlay) return false;
    return FloatingKeyModule.toggleOverlay();
  },

  toggleVolumeDial: async (): Promise<boolean> => {
    if (!FloatingKeyModule?.toggleVolumeDial) return false;
    return FloatingKeyModule.toggleVolumeDial();
  },

  updateOverlayConfiguration: async (config: OverlayConfig): Promise<boolean> => {
    if (!FloatingKeyModule?.updateOverlayConfiguration) return false;
    const jsonString = JSON.stringify(config);
    return FloatingKeyModule.updateOverlayConfiguration(jsonString);
  },

  getOverlayConfiguration: async (): Promise<OverlayConfig | null> => {
    if (!FloatingKeyModule?.getOverlayConfiguration) return null;
    try {
      const raw = await FloatingKeyModule.getOverlayConfiguration();
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse overlay configuration', e);
      return null;
    }
  },

  resetOverlayConfiguration: async (): Promise<OverlayConfig | null> => {
    if (!FloatingKeyModule?.resetOverlayConfiguration) return null;
    try {
      const raw = await FloatingKeyModule.resetOverlayConfiguration();
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse reset overlay configuration', e);
      return null;
    }
  },
};
