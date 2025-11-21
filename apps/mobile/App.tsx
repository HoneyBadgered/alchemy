import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import TableScreen from './src/screens/TableScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ShopScreen from './src/screens/ShopScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import AppearanceScreen from './src/screens/AppearanceScreen';
import LabelsScreen from './src/screens/LabelsScreen';

const Tab = createBottomTabNavigator();
const ShopStack = createNativeStackNavigator();
const queryClient = new QueryClient();

function ShopStackNavigator() {
  return (
    <ShopStack.Navigator>
      <ShopStack.Screen
        name="ShopList"
        component={ShopScreen}
        options={{ headerShown: false }}
      />
      <ShopStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ headerShown: false }}
      />
    </ShopStack.Navigator>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
              component={ShopStackNavigator}
              options={{
                tabBarLabel: 'Shop',
                tabBarIcon: () => '🛒',
                headerShown: false,
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
    </QueryClientProvider>
  );
}

