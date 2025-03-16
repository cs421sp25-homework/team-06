import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View, Alert } from "react-native";
import { Text, Card, List, Button, Title, IconButton, Portal, Dialog } from "react-native-paper";
import { useTrip } from "../context/TripContext";
import { useTabs } from "../navigation/useAppNavigation";
import { Destination } from "../types/Destination";
import { convertTimestampToDate } from "../utils/tripAPI";

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
  const { tabIndex, setTabIndex } = useTabs();
  // Control the assign date dialog and store the destination to be assigned
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [destinationToAssign, setDestinationToAssign] = useState<Destination | null>(null);

  useEffect(() => {
    if (currentTrip) {
      let needUpdate = false;
      const startDateConverted =
        currentTrip.startDate instanceof Date
          ? currentTrip.startDate
          : (needUpdate = true, convertTimestampToDate(currentTrip.startDate));
      const endDateConverted =
        currentTrip.endDate instanceof Date
          ? currentTrip.endDate
          : (needUpdate = true, convertTimestampToDate(currentTrip.endDate));

      const destinationsConverted = currentTrip.destinations.map((dest: any) => {
        if (dest.date && !(dest.date instanceof Date)) {
          needUpdate = true;
          return { ...dest, date: convertTimestampToDate(dest.date) };
        }
        return dest;
      });

      if (needUpdate) {
        setCurrentTrip({
          ...currentTrip,
          startDate: startDateConverted,
          endDate: endDateConverted,
          destinations: destinationsConverted,
        });
      }
    }
  }, [currentTrip]);
  // console.log("Current trip:", currentTrip);


  if (!currentTrip) {
    return (
      <View style={styles.emptyContainer}>
        <Title>No Current Trip</Title>
        <Text>You haven't planned for a trip yet.</Text>
        <Text> Start planning now by: </Text>
        <Text> 1. Creating a new plan </Text>
        <Text> 2. Subscribe to an existing plan!</Text>
        <Button mode="contained" onPress={() => { setTabIndex(2); }} style={styles.emptyButton}>
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
  const handleAssignDate = async (date: Date) => {
    if (!destinationToAssign || !(destinationToAssign as any).id) {
      Alert.alert("Error", "Destination not found or missing ID.");
      return;
    }
    try {
      await updateDestinationInTrip((destinationToAssign as any).id, { date });
      setAssignModalVisible(false);
      setDestinationToAssign(null);
    } catch (error) {
      console.error("Error assigning date:", error);
      Alert.alert("Error", "Failed to assign date.");
    }
  };

  // Remove (unassign) a destination by setting its date to null
  const handleRemoveDestinationDate = async (destination: Destination) => {
    if (!currentTrip) return;
    // // For the destination to "remove" its assigned date, set its date to null.
    // const updatedDestinations = currentTrip.destinations.map((dest: any) => {
    //   if ((dest.id || "") === (destination.id || "")) {
    //     return { ...dest, date: null };
    //   }
    //   return dest;
    // });


    try {

      const destinationId = destination.id;
      if (!destinationId) {
        throw new Error("Destination missing ID.");
      }
      await updateDestinationInTrip(destinationId, {date: null});
    } catch (error) {
      console.error("Error removing destination:", error);
      Alert.alert("Error", "Failed to remove destination.");
    }
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
            (dest) => {
              if (!dest.date) return false;
              const destDate = dest.date instanceof Date ? dest.date : convertTimestampToDate(dest.date);
              return destDate.toDateString() === date.toDateString();
            });
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
                        onPress={() => handleRemoveDestinationDate(destination)}
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
