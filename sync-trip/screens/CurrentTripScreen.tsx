import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Dialog, IconButton, List, Portal, Text, Title } from "react-native-paper";
import { useTrip } from "../context/TripContext";
import { useTabs } from "../navigation/useAppNavigation";
import { Destination } from "../types/Destination";
import { convertTimestampToDate, deleteDestinationInTrip } from "../utils/tripAPI";

// Helper to generate an array of dates from start to end (inclusive)
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
    const { currentTrip, setCurrentTrip, updateDestinationInTrip } = useTrip();
    const { setTabIndex } = useTabs();

    // For showing the assign date dialog
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [destinationToAssign, setDestinationToAssign] = useState<Destination | null>(null);

    // Convert timestamps to Date objects if necessary
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

    if (!currentTrip) {
        return (
            <View style={styles.emptyContainer}>
                <Title>No Current Trip</Title>
                <Text>You haven't planned for a trip yet.</Text>
                <Text>Start planning now by:</Text>
                <Text>1. Creating a new plan</Text>
                <Text>2. Subscribing to an existing plan!</Text>
                <Button mode="contained" onPress={() => setTabIndex(2)} style={styles.emptyButton}>
                    Create New Trip
                </Button>
            </View>
        );
    }

    // Open assign dialog for a destination without a date
    const handleOpenAssignModal = (destination: Destination) => {
        setDestinationToAssign(destination);
        setAssignModalVisible(true);
    };

    // When a user selects a date in the dialog, update the destination
    const handleAssignDate = async (date: Date) => {
        if (!destinationToAssign || !destinationToAssign.id) {
            Alert.alert("Error", "Destination not found or missing ID.");
            return;
        }
        try {
            await updateDestinationInTrip(destinationToAssign.id, { date });
            setAssignModalVisible(false);
            setDestinationToAssign(null);
        } catch (error) {
            console.error("Error assigning date:", error);
            Alert.alert("Error", "Failed to assign date.");
        }
    };

    // Remove an assigned date by setting it to null
    const handleRemoveDestinationDate = async (destination: Destination) => {
        if (!destination.id) {
            Alert.alert("Error", "Destination missing ID.");
            return;
        }
        try {
            await updateDestinationInTrip(destination.id, { date: null });
        } catch (error) {
            console.error("Error removing destination date:", error);
            Alert.alert("Error", "Failed to remove destination date.");
        }
    };

    const handleDeleteDestination = (destination: Destination) => {
        Alert.alert(
            "Delete Destination",
            "Are you sure you want to delete this destination?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => {
                        if (!currentTrip.id || !destination.id) throw new Error("currentTrip missing ID, or destination missing id.");
                        deleteDestinationInTrip(currentTrip.id, destination.id);
                        console.log("Delete destination:", destination.id);
                    }
                }
            ]
        );
    }

    return (
        <>
            <ScrollView style={styles.container}>
                <Card style={styles.card}>
                    <Card.Content style={{alignItems: 'center'}}>
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

                <Text style={styles.sectionTitle}>Destinations</Text>
                {currentTrip.destinations.length === 0 ? (
                    <Text>No destinations added yet.</Text>
                ) : (
                    currentTrip.destinations.map((destination) => (
                        <View style={styles.container}>
                            <List.Item
                                key={destination.id}
                                title={destination.description}
                                description={destination.address}
                            />

                            <View style={styles.buttonContainer}>
                                {destination.date ? (
                                    <View style={styles.dateWrapper}>
                                        <Text style={styles.dateText}>{new Date(destination.date).toLocaleDateString()}</Text>
                                        <IconButton
                                            icon="calendar-remove"
                                            onPress={() => handleRemoveDestinationDate(destination)}
                                        />
                                    </View>
                                ) : (
                                    <Button mode="outlined" onPress={() => handleOpenAssignModal(destination)}>
                                        Assign Date
                                    </Button>
                                )}

                                <IconButton
                                    icon="trash-can"
                                    onPress={() => handleDeleteDestination(destination)}
                                />
                            </View>
                        </View>

                    ))
                )}

                {/* TODO: handle trip deletion and edit */}
                {/*<Button mode="contained" onPress={() => {  }} style={styles.button}>*/}
                {/*    Edit Trip*/}
                {/*</Button>*/}
                {/*<Button mode="contained" buttonColor="#D32F2F" onPress={() => {  }} style={styles.button}>*/}
                {/*    Delete Trip*/}
                {/*</Button>*/}
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
                    <Dialog.Title>Select a Date to Assign</Dialog.Title>
                    <Dialog.Content>
                        {/* Generate a list of dates based on the trip's date range */}
                        {getDatesInRange(new Date(currentTrip.startDate), new Date(currentTrip.endDate)).map((date, idx) => (
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
    card: {
        margin: 15,
    },
    container: {
        backgroundColor: 'white',
        padding: 15,
        marginVertical: 5,
        borderRadius: 8,
        elevation: 3,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 0,
    },
    dateWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f4f4f4',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
    },
    dateText: {
        marginRight: 5,
        fontSize: 14,
        color: '#333',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginVertical: 16,
    },
    bold: {
        fontWeight: "bold",
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
