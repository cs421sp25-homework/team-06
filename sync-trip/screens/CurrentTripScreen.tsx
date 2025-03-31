import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Dialog,
  IconButton,
  List,
  Portal,
  Text,
  Title,
  TextInput,
  SegmentedButtons
} from "react-native-paper";
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates";
import { useTrip } from "../context/TripContext";
import { useTabs } from "../navigation/useAppNavigation";
import { Destination } from "../types/Destination";
import {
  convertTimestampToDate,
  deleteDestinationInTrip,
  deleteTrip,
  updateDestination
} from "../utils/tripAPI";
import { TripStatus } from "../types/Trip";

const CurrentTripScreen = () => {
  const { currentTrip, setCurrentTrip, updateTrip } = useTrip();
  const { setTabIndex } = useTabs();

  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(currentTrip?.title);
  // Local trip date states (we ensure they are Date objects)
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [tripStatus, setTripStatus] = useState(currentTrip?.status || "");
  const [pickerVisible, setPickerVisible] = useState(false); // For trip date range

  const [destinationDialogVisible, setDestinationDialogVisible] = useState(false);
  const [editingDestinationId, setEditingDestinationId] = useState<string | null>(null);
  const [destinationName, setDestinationName] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationDate, setDestinationDate] = useState<Date | null>(null);
  const [destPickerVisible, setDestPickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  // Store hours/minutes. If the user hasn't picked a time yet, it remains null
  const [destinationTime, setDestinationTime] = useState<{ hours: number; minutes: number } | null>(null);

  useEffect(() => {
    // If the trip is archived, clear it and navigate away
    if (currentTrip && currentTrip.status === TripStatus.ARCHIVED) {
      setCurrentTrip(null);
      setTabIndex(0);
      return;
    }

    if (currentTrip) {
      let needUpdate = false;
      // Convert start and end dates
      const startDateConverted =
        currentTrip.startDate instanceof Date
          ? currentTrip.startDate
          : convertTimestampToDate(currentTrip.startDate);
      const endDateConverted =
        currentTrip.endDate instanceof Date
          ? currentTrip.endDate
          : convertTimestampToDate(currentTrip.endDate);

      // Check if conversion was needed for currentTrip dates
      if (!(currentTrip.startDate instanceof Date)) needUpdate = true;
      if (!(currentTrip.endDate instanceof Date)) needUpdate = true;

      // Convert each destination's date if needed
      const destinationsConverted = currentTrip.destinations.map((dest: any) => {
        if (dest.date && !(dest.date instanceof Date)) {
          needUpdate = true;
          return { ...dest, date: convertTimestampToDate(dest.date) };
        }
        return dest;
      });

      // Only update currentTrip if any conversion occurred
      if (needUpdate) {
        setCurrentTrip({
          ...currentTrip,
          startDate: startDateConverted,
          endDate: endDateConverted,
          destinations: destinationsConverted,
        });
      }
      // Always update local state so our DatePicker gets proper Date objects
      setStartDate(startDateConverted);
      setEndDate(endDateConverted);
    }
  }, [currentTrip]);

  if (!currentTrip) {
    return (
      <View style={styles.emptyContainer}>
        <Title>No Current Trip</Title>
        <Text>You haven't planned a trip yet.</Text>
        <Text>Start planning now by:</Text>
        <Text>1. Creating a new plan</Text>
        <Text>2. Subscribing to an existing plan!</Text>
        <Button mode="contained" onPress={() => setTabIndex(2)} style={styles.emptyButton}>
          Create New Trip
        </Button>
      </View>
    );
  }

  // ========== Edit Current Trip ==========
  const handleBeginEditCurrentTrip = () => {
    setTitle(currentTrip.title);
    setStartDate(
      currentTrip.startDate instanceof Date
        ? currentTrip.startDate
        : convertTimestampToDate(currentTrip.startDate)
    );
    setEndDate(
      currentTrip.endDate instanceof Date
        ? currentTrip.endDate
        : convertTimestampToDate(currentTrip.endDate)
    );
    setTripStatus(currentTrip.status);
    setEditMode(true);
  };

  const handleSaveTrip = async () => {
    if (!title || !startDate || !endDate || !tripStatus) {
      Alert.alert("Please enter a title and select dates.");
      return;
    }
    const status = tripStatus as TripStatus;
    try {
      await updateTrip({ title, startDate, endDate, status });
      setEditMode(false);
    } catch (error) {
      console.error("Error updating trip:", error);
      Alert.alert("Error", "Failed to update trip.");
    }
  };

  // ========== DELETE CURRENT TRIP ==========
  const handleDeleteTrip = async () => {
    if (!currentTrip.id) {
      Alert.alert("Error", "Trip is missing an ID.");
      return;
    }
    Alert.alert(
      "Delete Trip",
      "Are you sure you want to delete this entire trip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTrip(currentTrip.id);
              setCurrentTrip(null);
              setTabIndex(0);
            } catch (err) {
              console.error("Error deleting trip:", err);
              Alert.alert("Error", "Failed to delete trip.");
            }
          },
        },
      ]
    );
  };

  // ========== ARCHIVE CURRENT TRIP ==========
  const handleArchiveTrip = async () => {
    if (!currentTrip.id) {
      Alert.alert("Error", "Trip is missing an ID.");
      return;
    }
    Alert.alert(
      "Archive Trip",
      "Are you sure you want to archive this trip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          onPress: async () => {
            try {
              await updateTrip({
                title: currentTrip.title,
                startDate: currentTrip.startDate,
                endDate: currentTrip.endDate,
                status: TripStatus.ARCHIVED,
              });
              setCurrentTrip(null);
              setTabIndex(0);
            } catch (err) {
              console.error("Error archiving trip:", err);
              Alert.alert("Error", "Failed to archive trip.");
            }
          },
        },
      ]
    );
  };

  const openDestinationDialogForEdit = (destination: Destination) => {
    setEditingDestinationId(destination.id || null);
    setDestinationName(destination.description || "");
    setDestinationAddress(destination.address || "");
    if (destination.date) {
      const d = new Date(destination.date);
      setDestinationDate(d);
      // Pre-fill time from the date if we want
      setDestinationTime({ hours: d.getHours(), minutes: d.getMinutes() });
    } else {
      setDestinationDate(null);
      setDestinationTime(null);
    }
    setDestinationDialogVisible(true);
  };

  const handleSaveDestination = async () => {
    if (!editingDestinationId) {
      Alert.alert("Error", "No destination is being edited.");
      return;
    }
    if (!destinationName) {
      Alert.alert("Please provide a name for the destination.");
      return;
    }
    if (!destinationDate) {
      Alert.alert("Please select a date for the destination.");
      return;
    }

    // Combine date/time
    let finalDate = new Date(destinationDate.getTime());
    if (destinationTime) {
      finalDate.setHours(destinationTime.hours, destinationTime.minutes, 0, 0);
    }

    const updatedData: Partial<Destination> = {
      description: destinationName,
      address: destinationAddress,
      date: finalDate,
    };
    try {
      await updateDestination(currentTrip.id!, editingDestinationId, updatedData);
      setDestinationDialogVisible(false);
    } catch (error) {
      console.error("Error saving destination:", error);
      Alert.alert("Error", "Failed to save destination.");
    }
  };

  const handleDeleteDestination = async (destination: Destination) => {
    if (!destination.id) {
      Alert.alert("Error", "Destination missing ID.");
      return;
    }
    Alert.alert(
      "Delete Destination",
      "Are you sure you want to delete this destination?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!currentTrip.id) throw new Error("currentTrip missing ID");
            await deleteDestinationInTrip(currentTrip.id, destination.id);
          },
        },
      ]
    );
  };

  // ========== TIME PICKER CALLBACK ==========
  const onConfirmTime = ({ hours, minutes }: { hours: number; minutes: number }) => {
    setDestinationTime({ hours, minutes });
    setTimePickerVisible(false);
  };

  return (
    <>
      <ScrollView style={styles.scrollContainer}>
        {editMode ? (
          <View style={styles.form}>
            <TextInput
              label="Trip Title"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={{ marginBottom: 10 }}
            />
            <Button testID="changeDates" mode="outlined" onPress={() => setPickerVisible(true)}>
              {startDate && endDate
                ? `${startDate.toDateString()} - ${endDate.toDateString()}`
                : "Select Dates"}
            </Button>

            <SegmentedButtons
              value={tripStatus}
              onValueChange={setTripStatus}
              style={{ marginTop: 10 }}
              buttons={[
                { value: TripStatus.PLANNING, label: "plan" },
                { value: TripStatus.ONGOING, label: "ongoing" },
                { value: TripStatus.COMPLETED, label: "complete" },
              ]}
            />

            <DatePickerModal
              locale="en"
              mode="range"
              visible={pickerVisible}
              onDismiss={() => setPickerVisible(false)}
              startDate={startDate || undefined}
              endDate={endDate || undefined}
              onConfirm={({ startDate: newStartDate, endDate: newEndDate }) => {
                setStartDate(newStartDate);
                setEndDate(newEndDate);
                setPickerVisible(false);
              }}
            />
          </View>
        ) : (
          <Card style={styles.card}>
            <Card.Content style={{ alignItems: "center" }}>
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
        )}

        {editMode ? (
          <Button mode="contained" onPress={handleSaveTrip} style={{ margin: 15 }}>
            Save Changes
          </Button>
        ) : (
          <View style={styles.buttonRow}>
            <Button
              testID="editTrip"
              mode="contained"
              onPress={handleBeginEditCurrentTrip}
              style={styles.smallButton}
            >
              Edit Trip
            </Button>
            <Button
              mode="contained"
              onPress={handleArchiveTrip}
              style={styles.smallButton}
            >
              Archive Trip
            </Button>
            <Button
              mode="contained"
              onPress={handleDeleteTrip}
              buttonColor="#e53935"
              style={styles.smallButton}
            >
              Delete Trip
            </Button>
          </View>
        )}

        {/* --- Destinations Section --- */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginHorizontal: 15,
            marginVertical: 16
          }}
        >
          <Text style={styles.sectionTitle}>Destinations</Text>
        </View>

        {currentTrip.destinations.length === 0 ? (
          <Text style={{ marginHorizontal: 15 }}>No destinations added yet.</Text>
        ) : (
          currentTrip.destinations.map((destination) => (
            <View key={destination.id} style={styles.destinationCard}>
              <List.Item
                title={destination.description}
                description={() => (
                  <Text>
                    {destination.address ? destination.address + "\n" : ""}
                    {destination.date
                      ? new Date(destination.date).toLocaleString()
                      : "No date/time"}
                  </Text>
                )}
              />
              <View style={styles.buttonContainer}>
                <IconButton
                  testID="pencil"
                  icon="pencil"
                  onPress={() => openDestinationDialogForEdit(destination)}
                />
                <IconButton
                  testID="trash"
                  icon="trash-can"
                  onPress={() => handleDeleteDestination(destination)}
                />
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* ---- EDIT DESTINATION DIALOG ---- */}
      <Portal>
        <Dialog
          visible={destinationDialogVisible}
          onDismiss={() => setDestinationDialogVisible(false)}
        >
          <Dialog.Title>Edit Destination</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Event / Destination Name"
              value={destinationName}
              onChangeText={setDestinationName}
              mode="outlined"
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Address (optional)"
              value={destinationAddress}
              onChangeText={setDestinationAddress}
              mode="outlined"
              style={{ marginBottom: 8 }}
            />
            <Button onPress={() => setDestPickerVisible(true)}>
              {destinationDate
                ? `Date: ${destinationDate.toDateString()}`
                : "Select Date"}
            </Button>
            <DatePickerModal
              locale="en"
              mode="single"
              visible={destPickerVisible}
              onDismiss={() => setDestPickerVisible(false)}
              date={destinationDate || undefined}
              onConfirm={({ date }) => {
                setDestinationDate(date);
                setDestPickerVisible(false);
              }}
              validRange={{
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
              }}
            />

            {/* The time button shows the chosen time if available */}
            <Button onPress={() => setTimePickerVisible(true)} style={{ marginTop: 8 }}>
              {destinationTime
                ? `Time: ${destinationTime.hours}:${String(destinationTime.minutes).padStart(2, "0")}`
                : "Select Time"}
            </Button>
            <TimePickerModal
              visible={timePickerVisible}
              onDismiss={() => setTimePickerVisible(false)}
              onConfirm={onConfirmTime}
              // Provide an initial hours/minutes from state (or a default)
              hours={destinationTime?.hours ?? 12}
              minutes={destinationTime?.minutes ?? 0}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDestinationDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveDestination}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#fff"
  },
  card: {
    margin: 15
  },
  form: {
    backgroundColor: "white",
    padding: 9,
    borderRadius: 10,
    elevation: 3
  },
  bold: {
    fontWeight: "bold"
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold"
  },
  destinationCard: {
    backgroundColor: "white",
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 15,
    borderRadius: 8,
    elevation: 3
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  emptyButton: {
    marginTop: 16
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    margin: 10,
  },
  smallButton: {
    marginHorizontal: 1,
    paddingHorizontal: 2,
    width: 130
  }
});

export default CurrentTripScreen;
