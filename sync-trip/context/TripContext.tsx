import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {Trip} from "../types/Trip";
import {Destination} from "../types/Destination";
import {
    addDestinationToTrip as apiAddDestinationToTrip,
    createTrip as apiCreateTrip,
    getATripById,
    subscribeToTrip as apiSubscribeToTrip,
    updateDestination as apiUpdateDestination,
    updateTrip as apiUpdateTrip,
} from "../utils/tripAPI";

import {useUser} from "./UserContext"

import {addTripToUser as apiAddTripToUser, setCurrentTripId as apiSetCurrentTripId,} from "../utils/userAPI";
import {firestore} from "../utils/firebase";
import {collection, doc, getDocs, onSnapshot} from "@react-native-firebase/firestore";

interface TripContextType {
    currentTrip: Trip | null;
    setCurrentTrip: (trip: Trip | null) => void;
    createTrip: (tripData: Trip) => Promise<void>;
    updateTrip: (updatedData: Partial<Trip>) => Promise<void>;
    addDestinationToTrip: (destination: Destination) => Promise<void>;
    updateDestinationInTrip: (destinationId: string, updatedData: Partial<Destination>) => Promise<void>;
    subscribeToTrip: (tripId: string, callback: (trip: Trip | null) => void) => () => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

    const { currentUser, setCurrentUser, getCurrentUserId } = useUser();

    const currentTripId = currentUser?.currentTripId;

    // Watch for changes in currentUser's currentTripId and set local currentTrip
    useEffect(() => {
        const fetchTrip = async () => {
            if (currentUser && currentTripId) {
                try {
                    console.log("current User's currentTripId has changed on firestore found, set new current Trip Context.");
                    const tripData  = await getATripById(currentTripId);
                    // setCurrentTrip(tripData);

                    // Fetch the initial destinations
                    const destinationsRef = collection(firestore, "trips", currentTripId, "destinations");
                    const snapshot = await getDocs(destinationsRef);
                    tripData.destinations = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Destination[];

                    setCurrentTrip(tripData);


                } catch (error) {
                    console.error("Error fetching trip:", error);
                }
            }
        };

        fetchTrip(); // Call the async function
    }, [currentTripId, setCurrentTrip]);  // Re-run when currentTripId changes


    //watch for changes in any field of the current Trip
    useEffect(() => {
        if (!currentTripId) return;

        const tripRef = doc(firestore, "trips", currentTripId);
        console.log("Listening for Firestore changes on trip:", currentTripId);

        const unsubscribe = onSnapshot(tripRef, (docSnap) => {
            if (docSnap.exists) {
                console.log("Trip updated from Firestore:", docSnap.data());
                setCurrentTrip({ id: currentTripId, ...docSnap.data() } as Trip);
            } else {
                console.warn("Trip document deleted.");
                setCurrentTrip(null);
            }
        });

        return () => {
            console.log("Unsubscribing from trip listener.");
            unsubscribe();
        };
    }, [currentTripId]); // Runs once per tripId change but listens to all field updates!

    // listen to sub collection of destinations in each trip.
    useEffect(() => {
        if (!currentTripId) return;

        // Listen to the "destinations" sub-collection under the current trip.
        const destinationsRef = collection(firestore, "trips", currentTripId, "destinations");

        console.log("Listening for Firestore changes on destinations for trip:", currentTripId);

        const unsubscribe = onSnapshot(destinationsRef, (snapshot) => {
            // Map over the documents in the destinations collection and include the document ID
            const updatedDestinations = snapshot.docs.map((doc) => ({
                id: doc.id,  // Firestore document ID
                ...doc.data(), // Actual document data
            })) as Destination[];

            setCurrentTrip((prevTrip) =>
                prevTrip ? { ...prevTrip, destinations: updatedDestinations } : prevTrip
            );

            console.log("Destinations updated from Firestore:", updatedDestinations);
        });

        return () => {
            console.log("Unsubscribing from destinations listener.");
            unsubscribe();
        };
    }, [currentTripId]); // Runs whenever currentTripId changes




    // Create a new trip document in Firestore and update local state.
    const createTrip = async (tripData: Trip) => {
        try {
            const tripId = await apiCreateTrip(tripData);
            console.log("Trip created with ID:", tripId);
            // Set the currentTrip with the new id.
            // const newTrip : Trip = { ...tripData, id: tripId };
            // setCurrentTrip(newTrip);

            //update firestore, and User Context will update by "snapshot" listener.
            await apiAddTripToUser(getCurrentUserId(), tripId);
            await apiSetCurrentTripId(getCurrentUserId(), tripId);

            console.log("trip created on firestore:", tripData);
        } catch (error) {
            console.error("Error creating trip:", error);
            throw error;
        }
    };

    // Update the current trip both in Firestore and local state.
    const updateTrip = async (updatedData: Partial<Trip>) => {
        if (!currentTrip || !currentTrip.id) return;
        try {
            await apiUpdateTrip(currentTrip.id, updatedData);
            // The Firestore snapshot listener will update the local state.
            // setCurrentTrip((prevTrip) => (prevTrip ? { ...prevTrip, ...updatedData } : prevTrip));
        } catch (error) {
            console.error("Error updating trip:", error);
            throw error;
        }
    };

    // Add a new destination to the current trip.
    const addDestinationToTrip = async (destination: Destination) => {
        if (!currentTrip || !currentTrip.id) {
            console.error("No current trip found:", currentTrip);
            return;
        }
        try {
            const destId = await apiAddDestinationToTrip(currentTrip.id, destination);
            // The Firestore snapshot listener will update the local state.
            // setCurrentTrip((prevTrip) =>
            //     prevTrip
            //         ? {
            //             ...prevTrip, destinations: [...prevTrip.destinations,
            //                 {
            //                     ...destination,
            //                     id: destId,
            //                 }]
            //         }
            //         : prevTrip
            // );
            console.log("Destination added with ID:", destId);
        } catch (error) {
            console.error("Error adding destination:", error);
            throw error;
        }
    };

    // Update a destination within the current trip.
    const updateDestinationInTrip = async (destinationId: string, updatedData: Partial<Destination>) => {
        if (!currentTrip || !currentTrip.id) {
            console.error("No current trip found:", currentTrip);
            return;
        }
        try {
            await apiUpdateDestination(currentTrip.id, destinationId, updatedData);
            // dont need to update local status.
            // const updatedDestinations = currentTrip.destinations.map((dest) => {
            //     // Assume each destination document has an "id" property.
            //     if ((dest as any).id === destinationId) {
            //         return { ...dest, ...updatedData };
            //     }
            //     return dest;
            // });
            // setCurrentTrip({ ...currentTrip, destinations: updatedDestinations });
        } catch (error) {
            console.error("Error updating destination:", error);
            throw error;
        }
    };

    // Expose subscribeToTrip for screens/components that need to subscribe manually.
    const subscribeToTrip = (tripId: string, callback: (trip: Trip | null) => void) => {
        return apiSubscribeToTrip(tripId, callback);
    };

    return (
        <TripContext.Provider
            value={{
                currentTrip,
                setCurrentTrip,
                createTrip,
                updateTrip,
                addDestinationToTrip,
                updateDestinationInTrip,
                subscribeToTrip,
            }}
        >
            {children}
        </TripContext.Provider>
    );
};

export const useTrip = () => {
    const context = useContext(TripContext);
    if (!context) {
        throw new Error("useTrip must be used within a TripProvider");
    }
    return context;
};
