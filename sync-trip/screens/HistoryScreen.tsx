import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HistoryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip History</Text>
      <Text style={styles.placeholderText}>
        This is your trip history placeholder. You can show past trips, archived itineraries, and
        expense summaries here.
      </Text>
    </View>
  );
};

export default HistoryScreen;

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
