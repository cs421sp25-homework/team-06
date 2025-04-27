import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Button,
  IconButton,
  Card,
  Dialog,
  Paragraph,
  Portal,
  SegmentedButtons,
  Text,
  Title,
  TextInput,
} from "react-native-paper";
import Markdown from 'react-native-markdown-display';
import { useUser } from "../context/UserContext";
import { useTrip } from "../context/TripContext";
import { addCollaboratorByEmail, setCurrentTripId, getUserById } from "../utils/userAPI";
import { TripStatus } from "../types/Trip";
import { doc, onSnapshot, updateDoc } from "@react-native-firebase/firestore";
import { firestore } from "../utils/firebase";
import { useTabs } from "../navigation/useAppNavigation";
import { convertTimestampToDate } from '../utils/dateUtils';

const DashboardScreen = () => {
  const { currentUser, getCurrentUserId } = useUser();
  const [trips, setTrips] = useState<any[]>([]);
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [tripIdForInvite, setTripIdForInvite] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState("Active");
  const { setTabIndex } = useTabs();
  const [uidToNameMap, setUidToNameMap] = useState<{ [uid: string]: string }>({});

  const {
      currentTrip,
      setCurrentTrip,
      updateTrip,
      announcements,
      createAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
  } = useTrip();
  
  // Announcement Dialog states
  const [isEditAnnouncementVisible, setEditAnnouncementVisible] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  // get all the collaborators
  useEffect(() => {
    // collect every ownerId + collaboratorId from all trips
    const allIds = trips.flatMap(t => [t.ownerId, ...(t.collaborators||[])]);
    const uniqueIds = Array.from(new Set(allIds));
    // only fetch the ones we haven’t resolved yet
    const toFetch = uniqueIds.filter(id => !uidToNameMap[id]);
    if (!toFetch.length) return;

    (async () => {
      const users = await Promise.all(toFetch.map(uid => getUserById(uid)));
      const newEntries = users.reduce((acc, u, i) => {
        acc[toFetch[i]] = u.name || "Unknown";
        return acc;
      }, {} as Record<string,string>);
      setUidToNameMap(m => ({ ...m, ...newEntries }));
    })();
  }, [trips]);

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

  const sortCurrentTripFirst = (trips: any[]) => {
    return [...trips].sort((a, b) => {
      const aIsCurrent = a.id === currentUser?.currentTripId;
      const bIsCurrent = b.id === currentUser?.currentTripId;
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      // If neither is the current trip, sort by startDate ascending
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateA.getTime() - dateB.getTime();
    });
  };

  // For active trips, further categorize them by status and place the current trip at the top
  const categorizedTrips = {
    planning: sortCurrentTripFirst(activeTrips.filter((trip) => trip.status === TripStatus.PLANNING)),
    ongoing: sortCurrentTripFirst(activeTrips.filter((trip) => trip.status === TripStatus.ONGOING)),
    completed: sortCurrentTripFirst(activeTrips.filter((trip) => trip.status === TripStatus.COMPLETED)),
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
      //alert(`Error inviting collaborator: ${error.message}`);
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

  // const CollaboratorsNames = ({ collaboratorIds }: { collaboratorIds: string[] }) => {
  //   useEffect(() => {
  //     const fetchAllNames = async () => {
  //       const newMap: { [uid: string]: string } = {};
  //       const promises = collaboratorIds.map(async (uid) => {
  //         if (!newMap[uid]) {
  //           try {
  //             const user = await getUserById(uid);
  //             newMap[uid] = user.name || "Unknown";
  //           } catch (error) {
  //             newMap[uid] = "Unknown";
  //           }
  //         }
  //       });
  //       await Promise.all(promises);
  //       setUidToNameMap(prev => ({ ...prev, ...newMap }));
  //     };
  //
  //     fetchAllNames();
  //   }, [collaboratorIds]);

  //   const names = collaboratorIds.map(uid => uidToNameMap[uid]);
  //   //console.log("map:",uidToNameMap)
  //   return (
  //     <Text>{`Members: ${names.join(", ")}`}</Text>
  //   );
  // };

  // Render each trip as a Card.
  const renderItem = ({ item }: { item: any }) => {
    const isCurrentTrip = item.id === currentUser?.currentTripId;
    const startDate = convertTimestampToDate(item.startDate).toLocaleDateString();
    const endDate = convertTimestampToDate(item.endDate).toLocaleDateString();
    const names = [item.ownerId, ...(item.collaborators||[])]
      .map(uid => uidToNameMap[uid] || "…")
      .join(", ");
    return (
      <Card style={styles.card} elevation={3}>
        <Card.Title title={item.title} />
        <Card.Content>
          <Text>{`Start Date: ${startDate}`}</Text>
          <Text>{`End Date: ${endDate}`}</Text>
          <Text>{ isCurrentTrip ? `Members: ${names}` : `Members: ${names.split(",").length}` }</Text>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          {!isCurrentTrip && (
            <Button mode="contained" onPress={() => handleSetCurrentTrip(item)}>
              Set as Current
            </Button>
          )}
          {isCurrentTrip && (
            <Button mode="contained" onPress={() => handleJumpToTrip(item)}>
              Edit
            </Button>
          )}
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
          <Text style={styles.emptyText}>No {title} Trip Here</Text>
        )}
      </>
    );
  };

  // Announcement Section
  const groupedAnnouncements = announcements.reduce((groups, announcement) => {
    const dateStr = announcement.updatedAt.toLocaleDateString();
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(announcement);
    return groups;
  }, {} as { [date: string]: typeof announcements });

  const sortedAnnouncementDates = Object.keys(groupedAnnouncements).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const handleEditAnnouncement = async () => {
    if (!editingAnnouncementId) {
      try {
        await createAnnouncement(announcementText);
        setEditAnnouncementVisible(false);
        setAnnouncementText("");
      } catch (err: any) {
        console.error("Error adding announcement:", err);
      }
    }
    else {
      try {
        await updateAnnouncement(editingAnnouncementId, announcementText);
        setEditAnnouncementVisible(false);
        setAnnouncementText("");
        setEditingAnnouncementId(null);
      } catch (err: any) {
        console.error("Error updating announcement:", err);
      }
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      await deleteAnnouncement(announcementId);
    } catch (err: any) {
      console.error("Error deleting announcement:", err);
    }
  };

  return (
    <View testID="dashboardScreen" style={styles.container}>
      {/* Announcements Section */}
      <View style={styles.announcementSection}>
        <View style={styles.annoucementTitle}>
          <Title style={styles.announcementHeader}>Announcements</Title>
          <Button
            testID="addAnnouncement"
            icon="plus"
            onPress={() => {
              setAnnouncementText("");
              setEditingAnnouncementId(null);
              setEditAnnouncementVisible(true);
            }}
          >
            Note
          </Button>
        </View>

        {sortedAnnouncementDates.length === 0 ? (
          <Text style={styles.emptyText}>
            This trip does not have any announcement yet.{"\n"}
            Try to create one for your partner!
          </Text>
        ) : (
          sortedAnnouncementDates.map((dateStr) => (
            <View key={dateStr}>
              <Text style={styles.dateHeader}>{dateStr}</Text>
              {groupedAnnouncements[dateStr].map((announcement, index) => (
                <View key={announcement.id}>
                  <Card style={styles.announcementCard}>
                    <Card.Title
                      title={
                        <Text style={styles.announcementAuthor}>
                          {`${uidToNameMap[announcement.authorID]} says:`}
                        </Text>
                      }
                    />
                    <Card.Content>
                      <Markdown>{announcement.message}</Markdown>
                      <Text style={styles.emptyText}>
                        {`Last Updated at ${announcement.updatedAt.toLocaleDateString()}`}
                      </Text>
                    </Card.Content>
                    <Card.Actions>
                      <IconButton
                        testID="editAnnouncement"
                        icon="pencil"
                        size={16}
                        onPress={() => {
                          setEditingAnnouncementId(announcement.id);
                          setAnnouncementText(announcement.message);
                          setEditAnnouncementVisible(true);
                        }}
                      />
                      <IconButton
                        testID="deleteAnnouncement"
                        icon="trash-can"
                        size={16}
                        onPress={() => handleDeleteAnnouncement(announcement.id)}
                      />
                    </Card.Actions>
                  </Card>
                  {index < groupedAnnouncements[dateStr].length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </View>

      {/* Announcement Dialog */}
      <Portal>
        <Dialog
          visible={isEditAnnouncementVisible}
          onDismiss={() => setEditAnnouncementVisible(false)}
        >
          <Dialog.Title>Your Announcement</Dialog.Title>
          <Dialog.Content>
            <TextInput
              //label="Announcement Message"
              value={announcementText}
              onChangeText={setAnnouncementText}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <IconButton
              testID="confirmAnnoucement"
              icon="check"
              size={16}
              onPress={() => {
                handleEditAnnouncement()
              }}
            />
            <IconButton
              testID="cancelEditAnnoucement"
              icon="close"
              size={16}
              iconColor="red"
              onPress={() => {
                setEditAnnouncementVisible(false)
              }}
            />
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
              autoCapitalize="none"
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
  emptyText: {
    textAlign: "center",
    marginTop: 10,
    color: 'gray',
    fontStyle: 'italic',
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  segmentedControlContainer: {
    marginTop: "auto",
    marginBottom: 0,
  },
  announcementAuthor: {
    fontSize: 14,
    color: 'gray',
    fontStyle: 'italic',
  },
  announcementHeader: {
    fontWeight: 'bold'
  },
  annoucementTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  announcementSection: {
    marginTop: 0,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
    marginHorizontal: 0,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 8,
    color: "#555",
  },
  announcementCard: {
    marginVertical: 0,
  },
  separator: {
    borderBottomColor: "gray",
    borderBottomWidth: 1,
    borderStyle: "dashed",
    marginVertical: 8,
  },
});

export default DashboardScreen;
