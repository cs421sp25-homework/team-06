import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';

import { MessageDialogProvider } from './components/MessageDialog';
import AppNavigator from './navigation/AppNavigator';
import 'expo-dev-client';

const App = () => {
  return (
    <PaperProvider>
      <MessageDialogProvider>
        <AppNavigator />
      </MessageDialogProvider>
    </PaperProvider>
  );
};

export default App;
