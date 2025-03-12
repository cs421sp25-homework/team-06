import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { Text, Card, List, Button, Title, IconButton, Portal, Dialog } from "react-native-paper";
import { useTrip } from "../context/TripContext"; // Adjust path as needed
import { Destination } from "../types/Destination"; // Adjust path as needed

// Generate an array of dates from the start to the end date (inclusive)
const getDatesInRange = (start, end) => {
  const date = new Date(start);
  const dates = [];
  while (date <= end) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

const CurrentTripScreen = () => {
  const { currentTrip } = useTrip();
  // Using local state to manage trip data; in production, update data through context or an API
  const [trip, setTrip] = useState(currentTrip);
  // Control the assign date dialog and store the destination to be assigned
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [destinationToAssign, setDestinationToAssign] = useState(null);

  useEffect(() => {
    setTrip(currentTrip);
  }, [currentTrip]);

  if (!trip) {
    return (
      <View style={styles.emptyContainer}>
        <Title>No Current Trip</Title>
        <Text>You haven't created a trip plan yet. Please create one to start adding destinations.</Text>
        <Button mode="contained" onPress={() => {/* Navigate to trip creation screen */ }} style={styles.emptyButton}>
          Create New Trip
        </Button>
      </View>
    );
  }

  // Get an array of dates for the trip
  const tripDates = getDatesInRange(trip.startDate, trip.endDate);
  // Filter out destinations that are not yet assigned a date
  const unassignedDestinations = trip.destinations.filter(
    (dest) => !dest.date
  );

  // Open the assign dialog and store the destination that needs a date assignment
  const handleOpenAssignModal = (destination) => {
    setDestinationToAssign(destination);
    setAssignModalVisible(true);
  };

  // When the user selects a date in the dialog, update the destination's date
  const handleAssignDate = (date) => {
    const updatedDestinations = trip.destinations.map((dest) => {
      if (dest === destinationToAssign) {
        return { ...dest, date: date };
      }
      return dest;
    });
    setTrip({ ...trip, destinations: updatedDestinations });
    setAssignModalVisible(false);
    setDestinationToAssign(null);
  };

  // Remove (unassign) a destination by setting its date to null
  const handleRemoveDestination = (destination) => {
    const updatedDestinations = trip.destinations.map((dest) => {
      if (dest === destination) {
        return { ...dest, date: null };
      }
      return dest;
    });
    setTrip({ ...trip, destinations: updatedDestinations });
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{trip.title}</Title>
            <Text>
              <Text style={styles.bold}>From: </Text>
              {new Date(trip.startDate).toLocaleDateString()}
            </Text>
            <Text>
              <Text style={styles.bold}>To: </Text>
              {new Date(trip.endDate).toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>

        {/* Display unassigned destinations */}
        <Text style={styles.sectionTitle}>Unassigned Destinations</Text>
        {unassignedDestinations.length === 0 ? (
          <Text>All destinations have been assigned</Text>
        ) : (
          unassignedDestinations.map((destination, idx) => (
            <List.Item
              key={idx}
              title={destination.description}
              description={destination.address}
              right={() => (
                <Button
                  mode="outlined"
                  onPress={() => handleOpenAssignModal(destination)}
                >
                  Assign Date
                </Button>
              )}
            />
          ))
        )}

        {/* Display destinations grouped by date */}
        <Text style={styles.sectionTitle}>Destinations by Date</Text>
        {tripDates.map((date, index) => {
          // Filter out destinations assigned to the current date (comparing only the date portion)
          const destinationsForDate = trip.destinations.filter(
            (dest) =>
              dest.date &&
              new Date(dest.date).toDateString() === date.toDateString()
          );
          return (
            <List.Accordion
              key={index}
              title={date.toLocaleDateString()}
              style={styles.accordion}
            >
              {destinationsForDate.length === 0 ? (
                <List.Item title="No destinations for this day" />
              ) : (
                destinationsForDate.map((destination, idx) => (
                  <List.Item
                    key={idx}
                    title={destination.description}
                    description={destination.address}
                    right={() => (
                      <IconButton
                        icon="delete"
                        onPress={() => handleRemoveDestination(destination)}
                      />
                    )}
                  />
                ))
              )}
              {/* Optional: Allow adding unassigned destinations under each date */}
            </List.Accordion>
          );
        })}

        <Button
          mode="contained"
          onPress={() => {
            /* Handle Edit Trip */
          }}
          style={styles.button}
        >
          Edit Trip
        </Button>
      </ScrollView>

      {/* Dialog for assigning a date to a destination */}
      <Portal>
        <Dialog
          visible={assignModalVisible}
          onDismiss={() => {
            setAssignModalVisible(false);
            setDestinationToAssign(null);
          }}
        >
          <Dialog.Title>Select a Date to Assign Destination</Dialog.Title>
          <Dialog.Content>
            {tripDates.map((date, idx) => (
              <List.Item
                key={idx}
                title={date.toLocaleDateString()}
                onPress={() => handleAssignDate(date)}
              />
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setAssignModalVisible(false);
                setDestinationToAssign(null);
              }}
            >
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
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
  accordion: {
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
  },
  addButton: {
    margin: 8,
  },
});

export default CurrentTripScreen;
