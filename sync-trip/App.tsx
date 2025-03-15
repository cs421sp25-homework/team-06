import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { TripProvider } from "./context/TripContext";
import { UserProvider } from "./context/UserContext";

import { MessageDialogProvider } from './components/MessageDialog';
import AppNavigator from './navigation/AppNavigator';

import { en, registerTranslation } from 'react-native-paper-dates';
registerTranslation('en', en);

import 'expo-dev-client';
import './utils/firebase';

const App = () => {
    return (
        <PaperProvider>
            <MessageDialogProvider>
                <UserProvider>
                    <TripProvider>
                        <AppNavigator />
                    </TripProvider>
                </UserProvider>
            </MessageDialogProvider>
        </PaperProvider>
    );
};

export default App;
