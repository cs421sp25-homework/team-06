import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';

import HomeScreen from '../screens/HomeScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LogInScreen from '../screens/LogInScreen';
import BottomTabsNavigator from './BottomTabsNavigator';
import HistoryScreen from '../screens/HistoryScreen';
import ArchivedHistoryScreen from '../screens/ArchivedHistoryScreen';
import { RootStackParamList } from './useAppNavigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="App" component={BottomTabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LogInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Trip Log' }} />
        <Stack.Screen name="ArchivedHistory" component={ArchivedHistoryScreen} options={{ title: 'Archived Trips' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
