import { create } from 'zustand';
import { FloatingKeys } from '../modules/FloatingKeys';
import { Permissions } from '../modules/Permissions';
import { KeyId, IndividualKeyConfig, OverlayConfig, PermissionsStatus } from '../types';

export const DEFAULT_CONFIG: OverlayConfig = {
  edge: 'right',
  posYPercent: 0.4,
  posXPercent: 1.0,
  spacing: 10,
  buttonSize: 'medium',
  buttonShape: 'circle',
  opacity: 0.9,
  hapticFeedback: true,
  showLabels: false,
  compactMode: false,
  theme: 'dark',
  keys: {
    power: {
      id: 'power',
      name: 'Power Key',
      enabled: true,
      singleTap: 'lock_screen',
      doubleTap: 'power_menu',
      longPress: 'power_menu',
      color: '#FFFFFF',
      icon: 'power',
      label: 'Power',
      order: 0,
      edge: 'right',
      posYPercent: 0.18,
    },
    volume_up: {
      id: 'volume_up',
      name: 'Volume Up',
      enabled: true,
      singleTap: 'volume_up',
      doubleTap: 'volume_max',
      longPress: 'volume_up_continuous',
      step: 1,
      stream: 'media',
      showUi: true,
      color: '#FFFFFF',
      icon: 'volume_up',
      label: 'Vol +',
      order: 1,
      edge: 'right',
      posYPercent: 0.32,
    },
    volume_down: {
      id: 'volume_down',
      name: 'Volume Down',
      enabled: true,
      singleTap: 'volume_down',
      doubleTap: 'volume_mute',
      longPress: 'volume_down_continuous',
      step: 1,
      stream: 'media',
      showUi: true,
      color: '#FFFFFF',
      icon: 'volume_down',
      label: 'Vol -',
      order: 2,
      edge: 'right',
      posYPercent: 0.46,
    },
    alert: {
      id: 'alert',
      name: 'Custom Alert',
      enabled: true,
      singleTap: 'toggle_silent',
      doubleTap: 'toggle_dnd',
      longPress: 'play_sound',
      alertSound: 'beep',
      customAppPackage: '',
      emergencyNumber: '911',
      color: '#FFFFFF',
      icon: 'bell',
      label: 'Alert',
      order: 3,
      edge: 'right',
      posYPercent: 0.62,
    },
  },
};

interface KeyStoreState {
  isOverlayActive: boolean;
  isLoading: boolean;
  permissions: PermissionsStatus;
  config: OverlayConfig;

  // Actions
  loadInitialData: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  toggleOverlayService: () => Promise<boolean>;
  updateConfig: (patch: Partial<OverlayConfig>) => Promise<void>;
  updateKey: (keyId: KeyId, patch: Partial<IndividualKeyConfig>) => Promise<void>;
  updateKeyPosition: (keyId: KeyId, edge: 'left' | 'right', posYPercent: number) => Promise<void>;
  toggleKey: (keyId: KeyId) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  reorderKeys: (orderedIds: KeyId[]) => Promise<void>;
}

export const useKeyStore = create<KeyStoreState>((set, get) => ({
  isOverlayActive: false,
  isLoading: true,
  permissions: {
    overlay: false,
    deviceAdmin: false,
    accessibility: false,
    notificationPolicy: false,
    notifications: false,
    batteryOptimizationIgnored: false,
  },
  config: DEFAULT_CONFIG,

  loadInitialData: async () => {
    set({ isLoading: true });
    try {
      const [perms, running, savedConfig] = await Promise.all([
        Permissions.getAllPermissionsStatus(),
        FloatingKeys.isOverlayRunning(),
        FloatingKeys.getOverlayConfiguration(),
      ]);

      set({
        permissions: perms,
        isOverlayActive: running,
        config: savedConfig ? { ...DEFAULT_CONFIG, ...savedConfig } : DEFAULT_CONFIG,
        isLoading: false,
      });
    } catch (e) {
      console.warn('Error loading initial store data', e);
      set({ isLoading: false });
    }
  },

  refreshPermissions: async () => {
    try {
      const perms = await Permissions.getAllPermissionsStatus();
      set({ permissions: perms });
    } catch (e) {
      console.warn('Error refreshing permissions', e);
    }
  },

  toggleOverlayService: async () => {
    const { isOverlayActive, permissions, config } = get();
    if (isOverlayActive) {
      const stopped = await FloatingKeys.stopOverlay();
      if (stopped) {
        set({ isOverlayActive: false });
        return true;
      }
      return false;
    } else {
      if (!permissions.overlay) {
        return false;
      }
      // Ensure latest config is set before starting
      await FloatingKeys.updateOverlayConfiguration(config);
      const started = await FloatingKeys.startOverlay();
      if (started) {
        set({ isOverlayActive: true });
        return true;
      }
      return false;
    }
  },

  updateConfig: async (patch: Partial<OverlayConfig>) => {
    const current = get().config;
    const updated = { ...current, ...patch };
    set({ config: updated });
    await FloatingKeys.updateOverlayConfiguration(updated);
  },

  updateKey: async (keyId: KeyId, patch: Partial<IndividualKeyConfig>) => {
    const current = get().config;
    const updatedKey = { ...current.keys[keyId], ...patch };
    const updatedKeys = { ...current.keys, [keyId]: updatedKey };
    const updated = { ...current, keys: updatedKeys };
    set({ config: updated });
    await FloatingKeys.updateOverlayConfiguration(updated);
  },

  updateKeyPosition: async (keyId: KeyId, edge: 'left' | 'right', posYPercent: number) => {
    await get().updateKey(keyId, { edge, posYPercent });
  },

  toggleKey: async (keyId: KeyId) => {
    const current = get().config;
    const isCurrentlyEnabled = current.keys[keyId]?.enabled ?? true;
    await get().updateKey(keyId, { enabled: !isCurrentlyEnabled });
  },

  resetToDefaults: async () => {
    set({ config: DEFAULT_CONFIG });
    await FloatingKeys.resetOverlayConfiguration();
  },

  reorderKeys: async (orderedIds: KeyId[]) => {
    const current = get().config;
    const newKeys = { ...current.keys };
    orderedIds.forEach((id, index) => {
      if (newKeys[id]) {
        newKeys[id] = { ...newKeys[id], order: index };
      }
    });
    const updated = { ...current, keys: newKeys };
    set({ config: updated });
    await FloatingKeys.updateOverlayConfiguration(updated);
  },
}));

