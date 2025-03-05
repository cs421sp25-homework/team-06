import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';

export default function NewTripScreen({ navigation }: any) {
  const [tripName, setTripName] = useState<string>('');
  const [tripDescription, setTripDescription] = useState<string>('');
  const [tripDate, setTripDate] = useState<string>('');

  const handleCreateTrip = () => {
    // Handle the trip creation logic here (e.g., saving to Firebase or navigating to another screen)
    console.log('New Trip Created:', { tripName, tripDescription, tripDate });

    // Optionally, navigate back to a previous screen (e.g., Dashboard) after creating the trip
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create a New Trip</Text>

      <TextInput
        style={styles.input}
        placeholder="Trip Name"
        value={tripName}
        onChangeText={setTripName}
      />

      <TextInput
        style={styles.input}
        placeholder="Trip Description"
        value={tripDescription}
        onChangeText={setTripDescription}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="Trip Date"
        value={tripDate}
        onChangeText={setTripDate}
      />

      <Button title="Create Trip" onPress={handleCreateTrip} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 16,
  },
});
