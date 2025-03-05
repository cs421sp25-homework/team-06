import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interactive Map</Text>
      <Text style={styles.placeholderText}>
        This is your interactive map placeholder. You can display your map as well as your travel
        routes here.
      </Text>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
});
