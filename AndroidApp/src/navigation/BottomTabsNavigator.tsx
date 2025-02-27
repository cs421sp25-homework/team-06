
import React from 'react';
import { BottomNavigation } from 'react-native-paper';

// Import your actual screen components
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
// If you have placeholders for Dashboard and History, import or create them too
// import DashboardScreen from '../screens/DashboardScreen';
// import HistoryScreen from '../screens/HistoryScreen';

// If you don't have placeholders yet, you can use inline components:
import { Text } from 'react-native';

const DashboardPlaceholder = () => <Text>Dashboard Screen</Text>;
const TripPlaceholder = () => <Text>Current Trip Screen</Text>;
const HistoryPlaceholder = () => <Text>History Screen</Text>;

const BottomTabsNavigator = () => {
    const [index, setIndex] = React.useState<number>(0);

    // Define the routes for your bottom navigation
    const [routes] = React.useState([
        { key: 'dashboard', title: 'Dashboard', icon: 'home' },
        { key: 'trip', title: 'Trip', icon: 'map' },
        { key: 'history', title: 'History', icon: 'history' },
        { key: 'profile', title: 'Profile', icon: 'account' },
    ]);

    // Map each route key to a component (screen) to render
    const renderScene = BottomNavigation.SceneMap({
        dashboard: DashboardPlaceholder, // Replace with your actual DashboardScreen
        trip: TripPlaceholder,          // Replace with your actual Current Trip Screen
        history: HistoryPlaceholder,    // Replace with your actual HistoryScreen
        profile: ProfileScreen,         
    });

    return (
        <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
        />
    );
};

export default BottomTabsNavigator;
