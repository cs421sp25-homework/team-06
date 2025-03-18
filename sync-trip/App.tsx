import React from 'react';
import {Provider as PaperProvider} from 'react-native-paper';

import {MessageDialogProvider} from './components/MessageDialog';
import AppNavigator from './navigation/AppNavigator';

import {en, registerTranslation} from 'react-native-paper-dates';
import 'expo-dev-client';
import './utils/firebase';

registerTranslation('en', en);

const App = () => {
    return (
        <PaperProvider>
            <MessageDialogProvider>
                <AppNavigator/>
            </MessageDialogProvider>
        </PaperProvider>
    );
};

export default App;
