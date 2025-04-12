import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';
import SignUpScreen from '../screens/SignUpScreen';
import LogInScreen from '../screens/LogInScreen';
import BottomTabsNavigator from './BottomTabsNavigator';
import {RootStackParamList} from './useAppNavigation';
import {UserProvider} from "../context/UserContext";
import {TripProvider} from "../context/TripContext";
import { BillTransactionProvider } from "../context/BillAndTransactionContext";

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                {/*<Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />*/}
                <Stack.Screen name="Login" component={LogInScreen} options={{headerShown: false}}/>
                <Stack.Screen name="SignUp" component={SignUpScreen} options={{headerShown: false}}/>

                <Stack.Screen
                    name="App"
                    component={() => (
                        <UserProvider>
                            <TripProvider>
                                <BillTransactionProvider>
                                    <BottomTabsNavigator/>
                                </BillTransactionProvider>
                            </TripProvider>
                        </UserProvider>
                    )}
                    options={{headerShown: false}}
                />
                {/*<Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Trip Log' }} />*/}
                {/*<Stack.Screen name="ArchivedHistory" component={ArchivedHistoryScreen} options={{ title: 'Archived Trips' }} />*/}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
