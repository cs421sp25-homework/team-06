import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CurrentTripScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Trip</Text>
      <Text style={styles.placeholderText}>
        This is your current trip placeholder. You can display an itinerary, upcoming reservations,
        or real-time travel details here.
      </Text>
    </View>
  );
};

export default CurrentTripScreen;

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
