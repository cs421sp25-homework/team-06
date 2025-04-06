import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Dialog,
  Paragraph,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
} from "react-native-paper";
import { useUser } from "../context/UserContext";
import { addCollaboratorByEmail, setCurrentTripId } from "../utils/userAPI";
import { TripStatus } from "../types/Trip";
import { doc, onSnapshot, updateDoc } from "@react-native-firebase/firestore";
import { firestore } from "../utils/firebase";
import { useTabs } from "../navigation/useAppNavigation";

const DashboardScreen = () => {
  const { currentUser, getCurrentUserId } = useUser();
  const [trips, setTrips] = useState<any[]>([]);
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [tripIdForInvite, setTripIdForInvite] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState("Active");
  const { setTabIndex } = useTabs();

  useEffect(() => {
    if (!currentUser || !currentUser.tripsIdList) return;

    // Array to hold unsubscribe functions
    const unsubscribeFuncs: Array<() => void> = [];
    // Object to accumulate trips data by trip ID
    const tripsMap: { [key: string]: any } = {};

    // Listener for each trip
    currentUser.tripsIdList.forEach((tripId: string) => {
      const tripRef = doc(firestore, "trips", tripId);
      const unsubscribe = onSnapshot(tripRef, (docSnap) => {
        if (!docSnap || !docSnap.exists) {
          console.warn(`Trip document with ID ${tripId} does not exist.`);
          // Remove trip from the map if it was deleted
          delete tripsMap[tripId];
          setTrips(Object.values(tripsMap));
          return;
        }
        tripsMap[tripId] = { id: tripId, ...docSnap.data() };
        setTrips(Object.values(tripsMap));
      });
      unsubscribeFuncs.push(unsubscribe);
    });

    // Cleanup all listeners on unmount or when tripsIdList changes
    return () => {
      unsubscribeFuncs.forEach((unsubscribe) => unsubscribe());
    };
  }, [currentUser]);

  // Separate active and archived trips
  const activeTrips = trips.filter((trip) => trip.status !== TripStatus.ARCHIVED);
  const archivedTrips = trips.filter((trip) => trip.status === TripStatus.ARCHIVED);

  // For active trips, further categorize them by status
  const categorizedTrips = {
    planning: activeTrips.filter((trip) => trip.status === TripStatus.PLANNING),
    ongoing: activeTrips.filter((trip) => trip.status === TripStatus.ONGOING),
    completed: activeTrips.filter((trip) => trip.status === TripStatus.COMPLETED),
  };

  const handleJumpToTrip = (trip: any) => {
    setCurrentTripId(getCurrentUserId(), trip.id);
    setTabIndex(1);
  };

  // Function to handle setting a trip as the current trip
  const handleSetCurrentTrip = (trip: any) => {
    setCurrentTripId(getCurrentUserId(), trip.id);
  };

  // Open the invite dialog for a specific trip.
  const showInviteDialog = (tripId: string) => {
    setTripIdForInvite(tripId);
    setInviteDialogVisible(true);
  };

  // Close the invite dialog and reset state.
  const hideInviteDialog = () => {
    setInviteDialogVisible(false);
    setInviteEmail("");
    setTripIdForInvite(null);
  };

  // Send an invitation by email for the given trip.
  const handleInviteCollaborator = async () => {
    if (!inviteEmail.trim()) {
      alert("Please enter a valid email");
      return;
    }
    try {
      await addCollaboratorByEmail(tripIdForInvite!, inviteEmail.trim());
      alert(`Invitation sent to ${inviteEmail.trim()}`);
      hideInviteDialog();
    } catch (error: any) {
      alert(`Error inviting collaborator: ${error.message}`);
    }
  };

  const handleRestoreTrip = async (trip: any) => {
    try {
      const tripRef = doc(firestore, "trips", trip.id);
      await updateDoc(tripRef, { status: TripStatus.PLANNING });
      alert("Trip restored successfully!");
    } catch (error) {
      console.error("Error restoring trip: ", error);
      alert("Error restoring trip");
    }
  };

  // Render each trip as a Card.
  const renderItem = ({ item }: { item: any }) => {
    const isCurrentTrip = item.id === currentUser?.currentTripId;
    return (
      <Card style={styles.card} elevation={3}>
        <Card.Title title={item.title} />
        <Card.Content>
          <Paragraph>{`members: ${item.collaborators?.length + 1 || 1}`}</Paragraph>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          {!isCurrentTrip && (
            <Button mode="contained" onPress={() => handleSetCurrentTrip(item)}>
              Set as Current
            </Button>
          )}
          <Button mode="contained" onPress={() => handleJumpToTrip(item)}>
            Go to Trip
          </Button>
          {selectedSegment === "Archived" ? (
            <Button mode="outlined" onPress={() => handleRestoreTrip(item)}>
              Restore
            </Button>
          ) : (
            <Button mode="outlined" onPress={() => showInviteDialog(item.id)}>
              Invite
            </Button>
          )}
        </Card.Actions>
      </Card>
    );
  };

  // Render a section of trips with a title.
  const renderSection = (title: string, trips: any[]) => {
    return (
      <>
        <Text style={styles.sectionTitle}>{title}</Text>
        {trips.length > 0 ? (
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        ) : (
          <Text style={styles.emptyText}>No {title.toLowerCase()} trips</Text>
        )}
      </>
    );
  };

  return (
    <View testID="dashboardScreen" style={styles.container}>
      {selectedSegment === "Active" ? (
        <>
          {renderSection("Planning", categorizedTrips.planning)}
          {renderSection("Ongoing", categorizedTrips.ongoing)}
          {renderSection("Completed", categorizedTrips.completed)}
        </>
      ) : (
        renderSection("Archived", archivedTrips)
      )}

      <Portal>
        <Dialog visible={inviteDialogVisible} onDismiss={hideInviteDialog}>
          <Dialog.Title>Invite Collaborator</Dialog.Title>
          <Dialog.Content>
            <TextInput
              testID="inviteEmailInput"
              label="Email"
              mode="outlined"
              defaultValue={inviteEmail}
              onChangeText={setInviteEmail}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideInviteDialog}>Cancel</Button>
            <Button testID="confirmInvitation" onPress={handleInviteCollaborator}>
              Invite
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* SegmentedButtons placed at the bottom */}
      <View style={styles.segmentedControlContainer}>
        <SegmentedButtons
          value={selectedSegment}
          onValueChange={setSelectedSegment}
          buttons={[
            { value: "Active", label: "Active" },
            { value: "Archived", label: "Archived" },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f5f5f5" },
  card: { marginBottom: 10 },
  cardActions: { justifyContent: "flex-end" },
  emptyText: { textAlign: "center", marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  segmentedControlContainer: {
    marginTop: "auto",
    marginBottom: 10,
  },
});

export default DashboardScreen;