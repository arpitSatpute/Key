import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CustomizeKeysScreen } from '../screens/CustomizeKeysScreen';
import { KeySettingsScreen } from '../screens/KeySettingsScreen';
import { PermissionsScreen } from '../screens/PermissionsScreen';
import { AppearanceScreen } from '../screens/AppearanceScreen';
import { GeneralSettingsScreen } from '../screens/GeneralSettingsScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Dashboard: undefined;
  CustomizeKeys: undefined;
  KeySettings: { keyId?: string } | undefined;
  Permissions: undefined;
  Appearance: undefined;
  GeneralSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="CustomizeKeys" component={CustomizeKeysScreen} />
        <Stack.Screen name="KeySettings" component={KeySettingsScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="Appearance" component={AppearanceScreen} />
        <Stack.Screen name="GeneralSettings" component={GeneralSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

