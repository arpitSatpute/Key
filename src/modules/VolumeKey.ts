import { NativeModules } from 'react-native';
import { AllVolumeLevels, AudioStream } from '../types';

const { VolumeKeyModule } = NativeModules;

export interface VolumeResult {
  currentVolume: number;
  maxVolume: number;
  stream: AudioStream;
}

export const VolumeKey = {
  increaseVolume: async (
    streamType: AudioStream = 'media',
    showUi: boolean = true,
    step: number = 1
  ): Promise<VolumeResult> => {
    if (!VolumeKeyModule?.increaseVolume) {
      return { currentVolume: 5, maxVolume: 15, stream: streamType };
    }
    return VolumeKeyModule.increaseVolume(streamType, showUi, step);
  },

  decreaseVolume: async (
    streamType: AudioStream = 'media',
    showUi: boolean = true,
    step: number = 1
  ): Promise<VolumeResult> => {
    if (!VolumeKeyModule?.decreaseVolume) {
      return { currentVolume: 4, maxVolume: 15, stream: streamType };
    }
    return VolumeKeyModule.decreaseVolume(streamType, showUi, step);
  },

  setVolume: async (
    streamType: AudioStream = 'media',
    level: number = 5,
    showUi: boolean = true
  ): Promise<VolumeResult> => {
    if (!VolumeKeyModule?.setVolume) {
      return { currentVolume: level, maxVolume: 15, stream: streamType };
    }
    return VolumeKeyModule.setVolume(streamType, level, showUi);
  },

  getCurrentVolume: async (streamType: AudioStream = 'media'): Promise<VolumeResult> => {
    if (!VolumeKeyModule?.getCurrentVolume) {
      return { currentVolume: 7, maxVolume: 15, stream: streamType };
    }
    return VolumeKeyModule.getCurrentVolume(streamType);
  },

  getMaximumVolume: async (streamType: AudioStream = 'media'): Promise<number> => {
    if (!VolumeKeyModule?.getMaximumVolume) {
      return 15;
    }
    return VolumeKeyModule.getMaximumVolume(streamType);
  },

  getAllVolumeLevels: async (): Promise<AllVolumeLevels> => {
    if (!VolumeKeyModule?.getVolumeLevels) {
      return {
        media: { current: 7, max: 15 },
        ring: { current: 5, max: 7 },
        notification: { current: 5, max: 7 },
        alarm: { current: 6, max: 7 },
        voice: { current: 4, max: 5 },
      };
    }
    return VolumeKeyModule.getVolumeLevels();
  },
};

