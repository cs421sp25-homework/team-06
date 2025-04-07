import React from 'react';
import {Provider as PaperProvider} from 'react-native-paper';

import {MessageDialogProvider} from './components/MessageDialog';
import AppNavigator from './navigation/AppNavigator';

import {en, registerTranslation} from 'react-native-paper-dates';
import 'expo-dev-client';
import './utils/firebase';
import 'react-native-get-random-values';

import NotificationHandler from './utils/NotificationHandler';

import {NotificationProvider} from './context/NotificationContext';

registerTranslation('en', en);

const App = () => {
  return (
    <PaperProvider>
      <MessageDialogProvider>
        <NotificationProvider>
          <NotificationHandler/>
          <AppNavigator/>
        </NotificationProvider>
      </MessageDialogProvider>
    </PaperProvider>
  );
};

export default App;
