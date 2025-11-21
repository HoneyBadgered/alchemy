import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Text } from 'react-native';

import TableScreen from './src/screens/TableScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ShopScreen from './src/screens/ShopScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import AppearanceScreen from './src/screens/AppearanceScreen';
import LabelsScreen from './src/screens/LabelsScreen';
import { CartProvider, useCart } from './src/contexts/CartContext';

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
      <ShopStack.Screen
        name="Cart"
        component={CartScreen}
        options={{ headerShown: false }}
      />
      <ShopStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ headerShown: false }}
      />
      <ShopStack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ headerShown: false }}
      />
      <ShopStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: false }}
      />
    </ShopStack.Navigator>
  );
}

function ShopTabIcon() {
  const { itemCount } = useCart();
  return (
    <Text style={{ fontSize: 20 }}>
      🛒{itemCount > 0 ? ` (${itemCount > 9 ? '9+' : itemCount})` : ''}
    </Text>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <CartProvider>
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
                  tabBarIcon: () => <Text style={{ fontSize: 20 }}>🧪</Text>,
                }}
              />
              <Tab.Screen
                name="Inventory"
                component={InventoryScreen}
                options={{
                  tabBarLabel: 'Inventory',
                  tabBarIcon: () => <Text style={{ fontSize: 20 }}>📦</Text>,
                }}
              />
              <Tab.Screen
                name="Shop"
                component={ShopStackNavigator}
                options={{
                  tabBarLabel: 'Shop',
                  tabBarIcon: () => <ShopTabIcon />,
                  headerShown: false,
                }}
              />
              <Tab.Screen
                name="Appearance"
                component={AppearanceScreen}
                options={{
                  tabBarLabel: 'Style',
                  tabBarIcon: () => <Text style={{ fontSize: 20 }}>✨</Text>,
                }}
              />
              <Tab.Screen
                name="Labels"
                component={LabelsScreen}
                options={{
                  tabBarLabel: 'Labels',
                  tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏷️</Text>,
                }}
              />
            </Tab.Navigator>
            <StatusBar style="auto" />
          </NavigationContainer>
        </CartProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

