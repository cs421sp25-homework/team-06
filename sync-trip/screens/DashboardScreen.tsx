import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Button, Paragraph, Portal, Dialog, TextInput } from "react-native-paper";
import { FlatList } from "react-native";
import { useUser } from "../context/UserContext";
import { useTrip } from "../context/TripContext";
import { addCollaboratorByEmail, setCurrentTripId } from "../utils/userAPI";
import {TripStatus} from "../types/Trip";
import {doc, onSnapshot} from "@react-native-firebase/firestore";
import {firestore} from "../utils/firebase";

const DashboardScreen = () => {
    const { currentUser, getCurrentUserId } = useUser();
    // const { setCurrentTrip } = useTrip();
    const [trips, setTrips] = useState<any[]>([]);
    const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [tripIdForInvite, setTripIdForInvite] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser || !currentUser.tripsIdList) return;

        // Array to hold unsubscribe functions
        const unsubscribeFuncs: Array<() => void> = [];

        // Object to accumulate trips data
        const tripsMap: { [key: string]: any } = {};

        // Listener for each trip
        currentUser.tripsIdList.forEach((tripId: string) => {
            const tripRef = doc(firestore, "trips", tripId);
            const unsubscribe = onSnapshot(tripRef, (docSnap) => {
                if (docSnap.exists) {
                    tripsMap[tripId] = { id: tripId, ...docSnap.data() };
                    // Update trips state whenever any trip updates
                    setTrips(Object.values(tripsMap));
                }
            });
            unsubscribeFuncs.push(unsubscribe);
        });

        // Cleanup all listeners on unmount or when tripsIdList changes
        return () => {
            unsubscribeFuncs.forEach((unsubscribe) => unsubscribe());
        };
    }, [currentUser]);  // Updates automatically when current user changes (like currentUserId changes or tripsIdList changes)



    const categorizedTrips = {
        planning: trips.filter((trip) => trip.status === TripStatus.PLANNING),
        ongoing: trips.filter((trip) => trip.status === TripStatus.ONGOING),
        completed: trips.filter((trip) => trip.status === TripStatus.COMPLETED),
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

    // Render each trip as a Card.
    const renderItem = ({ item }: { item: any }) => {
        const isCurrentTrip = item.id === currentUser?.currentTripId;
        return (
            <Card style={styles.card} elevation={3}>
                <Card.Title title={item.title} subtitle={item.status} />
                <Card.Content>
                    {/*<Paragraph>{`Start: ${new Date(item.startDate).toLocaleDateString()}`}</Paragraph>*/}
                    {/*<Paragraph>{`End: ${new Date(item.endDate).toLocaleDateString()}`}</Paragraph>*/}
                    {/*<Paragraph>{`Destinations: ${item.destinations?.length || 0}`}</Paragraph>*/}
                    <Paragraph>{`members: ${item.collaborators?.length + 1 || 1}`}</Paragraph>
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                    {!isCurrentTrip && (
                        <Button mode="contained" onPress={() => handleSetCurrentTrip(item)}>
                            Set as Current
                        </Button>
                    )}
                    <Button mode="outlined" onPress={() => showInviteDialog(item.id)}>
                        Invite
                    </Button>
                </Card.Actions>
            </Card>
        );
    };

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
        <View style={styles.container}>
            {renderSection("Planning", categorizedTrips.planning)}
            {renderSection("Ongoing", categorizedTrips.ongoing)}
            {renderSection("Completed", categorizedTrips.completed)}

            <Portal>
                <Dialog visible={inviteDialogVisible} onDismiss={hideInviteDialog}>
                    <Dialog.Title>Invite Collaborator</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Email"
                            mode="outlined"
                            defaultValue={inviteEmail}
                            onChangeText={setInviteEmail}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideInviteDialog}>Cancel</Button>
                        <Button onPress={handleInviteCollaborator}>Invite</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: "#f5f5f5" },
    card: { marginBottom: 10 },
    cardActions: { justifyContent: "flex-end" },
    emptyText: { textAlign: "center", marginTop: 20 },
    sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
});


export default DashboardScreen;