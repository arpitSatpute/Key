import { PowerKey } from '../src/modules/PowerKey';
import { VolumeKey } from '../src/modules/VolumeKey';
import { AlertKey } from '../src/modules/AlertKey';
import { Permissions } from '../src/modules/Permissions';
import { NativeModules } from 'react-native';

describe('Native Modules JavaScript Bridges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('PowerKey executes lockScreen and openPowerMenu', async () => {
    const locked = await PowerKey.lockScreen();
    expect(locked).toBe(true);
    expect(NativeModules.PowerKeyModule.lockScreen).toHaveBeenCalled();

    const opened = await PowerKey.openPowerMenu();
    expect(opened).toBe(true);
    expect(NativeModules.PowerKeyModule.openPowerMenu).toHaveBeenCalled();

    const caps = await PowerKey.getCapabilities();
    expect(caps.canLockScreen).toBe(true);
    expect(caps.androidVersion).toBe(34);
  });

  test('VolumeKey increases, decreases, and queries stream volume', async () => {
    const resUp = await VolumeKey.increaseVolume('media', true, 2);
    expect(resUp.currentVolume).toBe(8);
    expect(NativeModules.VolumeKeyModule.increaseVolume).toHaveBeenCalledWith('media', true, 2);

    const resDown = await VolumeKey.decreaseVolume('ring', false, 1);
    expect(resDown.currentVolume).toBe(6);
    expect(NativeModules.VolumeKeyModule.decreaseVolume).toHaveBeenCalledWith('ring', false, 1);

    const allLevels = await VolumeKey.getAllVolumeLevels();
    expect(allLevels.media.current).toBe(7);
    expect(allLevels.alarm.max).toBe(7);
  });

  test('AlertKey executes actions and triggers feedback', async () => {
    const result = await AlertKey.executeAlertAction('toggle_silent');
    expect(result).toBe(true);
    expect(NativeModules.AlertKeyModule.executeAlertAction).toHaveBeenCalledWith('toggle_silent', null);

    const sound = await AlertKey.playAlertSound('beep');
    expect(sound).toBe(true);

    const haptic = await AlertKey.triggerHapticFeedback('heavy');
    expect(haptic).toBe(true);
  });

  test('Permissions queries all system permission flags', async () => {
    const perms = await Permissions.getAllPermissionsStatus();
    expect(perms.overlay).toBe(true);
    expect(perms.accessibility).toBe(true);
    expect(perms.deviceAdmin).toBe(true);
  });
});
