import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { Text, Card, List, Button, Title, IconButton, Portal, Dialog } from "react-native-paper";
import { useTrip } from "../context/TripContext";
import { useTabs } from "../navigation/useAppNavigation";
import { Destination } from "../types/Destination";

// Generate an array of dates from the start to the end date (inclusive)
const getDatesInRange = (start: Date, end: Date) => {
  const date = new Date(start);
  const dates = [];
  while (date <= end) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

const CurrentTripScreen = () => {
  const { currentTrip, setCurrentTrip, updateTrip, updateDestinationInTrip, subscribeToTrip } = useTrip();
  // Using local state to manage trip data; in production, update data through context or an API
  const {tabIndex, setTabIndex} = useTabs();
  // Control the assign date dialog and store the destination to be assigned
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [destinationToAssign, setDestinationToAssign] = useState(null);

  useEffect(() => {
    setCurrentTrip(currentTrip);
  }, [currentTrip]);

  if (!currentTrip) {
    return (
      <View style={styles.emptyContainer}>
        <Title>No Current Trip</Title>
        <Text>You haven't planned for a trip yet. Start planning now!</Text>
        <Button mode="contained" onPress={() => {setTabIndex(2);}} style={styles.emptyButton}>
          Create New Trip
        </Button>
      </View>
    );
  }

  // Get an array of dates for the trip
  const tripDates = getDatesInRange(currentTrip.startDate, currentTrip.endDate);
  // Filter out destinations that are not yet assigned a date
  const unassignedDestinations = currentTrip.destinations.filter(
    (dest) => !dest.date
  );

  // Open the assign dialog and store the destination that needs a date assignment
  const handleOpenAssignModal = (destination: Destination) => {
    setDestinationToAssign(destination);
    setAssignModalVisible(true);
  };

  // When the user selects a date in the dialog, update the destination's date
  const handleAssignDate = (date) => {
    const updatedDestinations = currentTrip.destinations.map((dest) => {
      if (dest === destinationToAssign) {
        return { ...dest, date: date };
      }
      return dest;
    });
    setCurrentTrip({ ...currentTrip, destinations: updatedDestinations });
    setAssignModalVisible(false);
    setDestinationToAssign(null);
  };

  // Remove (unassign) a destination by setting its date to null
  const handleRemoveDestination = (destination) => {
    const updatedDestinations = currentTrip.destinations.map((dest) => {
      if (dest === destination) {
        return { ...dest, date: null };
      }
      return dest;
    });
    setCurrentTrip({ ...currentTrip, destinations: updatedDestinations });
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{currentTrip.title}</Title>
            <Text>
              <Text style={styles.bold}>From: </Text>
              {new Date(currentTrip.startDate).toLocaleDateString()}
            </Text>
            <Text>
              <Text style={styles.bold}>To: </Text>
              {new Date(currentTrip.endDate).toLocaleDateString()}
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
          const destinationsForDate = currentTrip.destinations.filter(
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyButton: {
    marginTop: 16,
  },
});

export default CurrentTripScreen;
