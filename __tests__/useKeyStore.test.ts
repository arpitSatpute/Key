import { useKeyStore, DEFAULT_CONFIG } from '../src/store/useKeyStore';
import { FloatingKeys } from '../src/modules/FloatingKeys';
import { Permissions } from '../src/modules/Permissions';

jest.mock('../src/modules/FloatingKeys', () => ({
  FloatingKeys: {
    isOverlayRunning: jest.fn().mockResolvedValue(false),
    getOverlayConfiguration: jest.fn().mockResolvedValue(null),
    updateOverlayConfiguration: jest.fn().mockResolvedValue(true),
    startOverlay: jest.fn().mockResolvedValue(true),
    stopOverlay: jest.fn().mockResolvedValue(true),
    resetOverlayConfiguration: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../src/modules/Permissions', () => ({
  Permissions: {
    getAllPermissionsStatus: jest.fn().mockResolvedValue({
      overlay: true,
      deviceAdmin: true,
      accessibility: true,
      notificationPolicy: true,
      notifications: true,
      batteryOptimizationIgnored: true,
    }),
  },
}));

describe('useKeyStore', () => {
  beforeEach(() => {
    useKeyStore.setState({
      isOverlayActive: false,
      isLoading: false,
      config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
      permissions: {
        overlay: true,
        deviceAdmin: true,
        accessibility: true,
        notificationPolicy: true,
        notifications: true,
        batteryOptimizationIgnored: true,
      },
    });
    jest.clearAllMocks();
  });

  test('has correct default configuration', () => {
    const state = useKeyStore.getState();
    expect(state.config.edge).toBe('right');
    expect(state.config.buttonSize).toBe('medium');
    expect(state.config.buttonShape).toBe('circle');
    expect(state.config.keys.power.enabled).toBe(true);
    expect(state.config.keys.volume_up.enabled).toBe(true);
    expect(state.config.keys.volume_down.enabled).toBe(true);
    expect(state.config.keys.alert.enabled).toBe(true);
  });

  test('toggles overlay service when overlay permission is granted', async () => {
    const { toggleOverlayService } = useKeyStore.getState();
    const result = await toggleOverlayService();
    expect(result).toBe(true);
    expect(FloatingKeys.startOverlay).toHaveBeenCalled();
    expect(useKeyStore.getState().isOverlayActive).toBe(true);
  });

  test('updates key configuration and syncs with native overlay', async () => {
    const { updateKey } = useKeyStore.getState();
    await updateKey('power', { color: '#00FF00', singleTap: 'power_menu' });

    const updatedPowerKey = useKeyStore.getState().config.keys.power;
    expect(updatedPowerKey.color).toBe('#00FF00');
    expect(updatedPowerKey.singleTap).toBe('power_menu');
    expect(FloatingKeys.updateOverlayConfiguration).toHaveBeenCalled();
  });

  test('toggles key enabled status', async () => {
    const { toggleKey } = useKeyStore.getState();
    expect(useKeyStore.getState().config.keys.alert.enabled).toBe(true);

    await toggleKey('alert');
    expect(useKeyStore.getState().config.keys.alert.enabled).toBe(false);

    await toggleKey('alert');
    expect(useKeyStore.getState().config.keys.alert.enabled).toBe(true);
  });

  test('reorders keys correctly', async () => {
    const { reorderKeys } = useKeyStore.getState();
    await reorderKeys(['alert', 'volume_down', 'volume_up', 'power']);

    const { keys } = useKeyStore.getState().config;
    expect(keys.alert.order).toBe(0);
    expect(keys.volume_down.order).toBe(1);
    expect(keys.volume_up.order).toBe(2);
    expect(keys.power.order).toBe(3);
  });

  test('resets configuration to default', async () => {
    const { updateConfig, resetToDefaults } = useKeyStore.getState();
    await updateConfig({ edge: 'left', buttonSize: 'large' });
    expect(useKeyStore.getState().config.edge).toBe('left');

    await resetToDefaults();
    expect(useKeyStore.getState().config.edge).toBe('right');
    expect(useKeyStore.getState().config.buttonSize).toBe('medium');
    expect(FloatingKeys.resetOverlayConfiguration).toHaveBeenCalled();
  });
});

