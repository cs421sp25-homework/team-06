// src/navigation/BottomTabsNavigator.tsx
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomNavigation, FAB } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import CurrentTripScreen from '../screens/CurrentTripScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MapScreen from '../screens/MapScreen'; // New screen for map view
import NewTripScreen from '../screens/NewTripScreen';
import ProfileScreen from '../screens/ProfileScreen';

export default function BottomTabsNavigator() {
  const [index, setIndex] = useState<number>(0);
  const [routes] = useState([
    { key: 'dashboard', title: 'Dashboard', icon: 'view-dashboard' },
    { key: 'trip', title: 'Trip', icon: 'clipboard-list' },
    { key: 'plus', title: 'New Trip', icon: 'plus' }, // Plus route
    { key: 'map', title: 'Map', icon: 'map-marker' }, // Changed from History to Map
    { key: 'profile', title: 'Profile', icon: 'account' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    dashboard: DashboardScreen,
    trip: CurrentTripScreen,
    map: MapScreen,
    profile: ProfileScreen,
    plus: NewTripScreen,
  });

  const renderIcon = ({ route, color, focused }: any) => (
    <MaterialCommunityIcons name={route.icon} color={color} size={focused ? 28 : 24} />
  );

  return (
    <View style={styles.container}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        renderIcon={renderIcon}
        shifting={false}
        barStyle={styles.barStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  barStyle: { backgroundColor: '#ffffff' },
  fab: {
    position: 'absolute',
    bottom: 60, // Adjust as needed so the FAB doesn't crowd the tabs
    alignSelf: 'center',
    backgroundColor: '#6200ee',
  },
});
