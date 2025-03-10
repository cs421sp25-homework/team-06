import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, List, Button, Title } from "react-native-paper";
import { useTrip } from "../context/TripContext"; // Adjust path as necessary
import { Destination } from "../types/Destination"; // Adjust path as necessary

const MapScreen = () => {
  const { currentTrip } = useTrip();

  if (!currentTrip) {
    return <Text>No current trip</Text>;
  }

  return (
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{currentTrip.title}</Title>
            <Text>
              <Text style={styles.bold}>From: </Text>{' '}
              {currentTrip.startDate.toLocaleDateString()}
            </Text>
            <Text>
              <Text style={styles.bold}>To: </Text>{' '}
              {currentTrip.endDate.toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>

        <Text style={styles.sectionTitle}>Destinations</Text>
        {currentTrip.destinations.length === 0 ? (
            <Text>No destinations now, add some from map!</Text>
        ) : (
            currentTrip.destinations.map((destination: Destination, index: number) => (
                <Card key={index} style={styles.card}>
                  <Card.Content>
                    <Title>Destination {index + 1}</Title>
                    <Text>
                      <Text style={styles.bold}>Description: </Text>{destination.description}
                    </Text>
                    <Text>
                      <Text style={styles.bold}>Date: </Text>{destination.date?.toDateString()}
                    </Text>
                    {destination.address && (
                        <Text>
                          <Text style={styles.bold}>Address: </Text>{destination.address}
                        </Text>
                    )}
                  </Card.Content>
                </Card>
            ))
        )}

        <Button mode="contained" onPress={() => { /* Handle Edit Trip */ }} style={styles.button}>
          Edit Trip
        </Button>
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 16,
  },
  bold: {
    fontWeight: "bold",
  },
  button: {
    marginTop: 16,
  },
});

export default MapScreen;
