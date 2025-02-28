import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomNavigation, FAB } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import DashboardScreen from '../screens/DashboardScreen';
import CurrentTripScreen from '../screens/CurrentTripScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';


export default function BottomTabsNavigator() {
    const [index, setIndex] = useState<number>(0);
    const [routes] = useState([
        { key: 'dashboard', title: 'Dashboard', icon: 'view-dashboard' },
        { key: 'trip', title: 'Trip', icon: 'map' },
        { key: 'history', title: 'History', icon: 'history' },
        { key: 'profile', title: 'Profile', icon: 'account' },
    ]);

    // Map each route to its corresponding screen
    const renderScene = BottomNavigation.SceneMap({
        dashboard: DashboardScreen,
        trip: CurrentTripScreen,
        history: HistoryScreen,
        profile: ProfileScreen,
    });

    // Custom renderIcon to ensure icons come from MaterialCommunityIcons
    const renderIcon = ({ route, color, focused }: any) => {
        // route.icon is the string we defined above (e.g., "map", "account", etc.)
        return (
            <MaterialCommunityIcons
                name={route.icon}
                color={color}
                size={focused ? 28 : 24}
            />
        );
    };

    // Handler for FAB press
    const handlePlusPress = () => {
        // TODO: Implement your create-new-trip feature
        console.log('Create new trip plan');
    };

    return (
        <View style={styles.container}>
            <BottomNavigation
                navigationState={{ index, routes }}
                onIndexChange={setIndex}
                renderScene={renderScene}
                renderIcon={renderIcon}
                // Optionally control shifting or barStyle
                shifting={true}
                barStyle={styles.barStyle}
            />
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={handlePlusPress}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    barStyle: {
        // You can adjust the bar style to create space or change color
        backgroundColor: '#ffffff',
    },
    fab: {
        position: 'absolute',
        // Increase bottom offset so the FAB sits above the bottom nav
        bottom: 60,
        alignSelf: 'center',
        backgroundColor: '#6200ee', // Customize the FAB color
    },
});
