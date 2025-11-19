import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TableScreen from './src/screens/TableScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ShopScreen from './src/screens/ShopScreen';
import AppearanceScreen from './src/screens/AppearanceScreen';
import LabelsScreen from './src/screens/LabelsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#9333ea',
            tabBarInactiveTintColor: '#6b7280',
          }}
        >
          <Tab.Screen
            name="Table"
            component={TableScreen}
            options={{
              tabBarLabel: 'Table',
              tabBarIcon: () => '🧪',
            }}
          />
          <Tab.Screen
            name="Inventory"
            component={InventoryScreen}
            options={{
              tabBarLabel: 'Inventory',
              tabBarIcon: () => '📦',
            }}
          />
          <Tab.Screen
            name="Shop"
            component={ShopScreen}
            options={{
              tabBarLabel: 'Shop',
              tabBarIcon: () => '🛒',
            }}
          />
          <Tab.Screen
            name="Appearance"
            component={AppearanceScreen}
            options={{
              tabBarLabel: 'Style',
              tabBarIcon: () => '✨',
            }}
          />
          <Tab.Screen
            name="Labels"
            component={LabelsScreen}
            options={{
              tabBarLabel: 'Labels',
              tabBarIcon: () => '🏷️',
            }}
          />
        </Tab.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

