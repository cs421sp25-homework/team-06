import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './navigation/AppNavigator.tsx';
import 'expo-dev-client';

const App = () => {
  return (
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
  );
};

export default App;
