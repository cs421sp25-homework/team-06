import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import SignUpScreen from '../screens/SignUpScreen';

export type RootStackParamList = {
    Home: undefined;
    SignUp: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
    </NavigationContainer>
);
};

export default AppNavigator;
