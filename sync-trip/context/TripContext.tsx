import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {Trip} from "../types/Trip";
import {Destination} from "../types/Destination";
import {
    addDestinationToTrip as apiAddDestinationToTrip,
    createTrip as apiCreateTrip,
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
    logout: () => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({children}: { children: ReactNode }) => {
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

    const {currentUser, setCurrentUser, getCurrentUserId} = useUser();

    const currentTripId = currentUser?.currentTripId;


    useEffect(() => {
        if (!currentTripId) return;

        const tripRef = doc(firestore, "trips", currentTripId);
        const destinationsRef = collection(firestore, "trips", currentTripId, "destinations");

        console.log("Listening for Firestore changes on trip:", currentTripId);

        const unsubscribeTrip = onSnapshot(tripRef, async (docSnap) => {
            if (docSnap.exists) {
                console.log("Trip updated from Firestore:", docSnap.data());

                const updatedTrip = {id: currentTripId, ...docSnap.data()} as Trip;

                // Fetch the destinations after updating the trip
                const destinationsSnapshot = await getDocs(destinationsRef);
                const updatedDestinations = destinationsSnapshot.docs.map((doc) => ({
                    id: doc.id,  // Firestore document ID
                    ...doc.data(), // Actual document data
                })) as Destination[];

                // Update currentTrip with both trip data and destinations
                setCurrentTrip({...updatedTrip, destinations: updatedDestinations});

                console.log("Destinations updated from Firestore:", updatedDestinations);
            } else {
                console.warn("Trip document deleted.");
                setCurrentTrip(null);
            }
        });

        // Subscribe to the destinations sub-collection
        const unsubscribeDestinations = onSnapshot(destinationsRef, (snapshot) => {
            const updatedDestinations = snapshot.docs.map((doc) => ({
                id: doc.id,  // Firestore document ID
                ...doc.data(), // Actual document data
            })) as Destination[];

            setCurrentTrip((prevTrip) =>
                prevTrip ? {...prevTrip, destinations: updatedDestinations} : prevTrip
            );

            console.log("Destinations updated from Firestore:", updatedDestinations);
        });

        // Cleanup the listeners when the component is unmounted or currentTripId changes
        return () => {
            console.log("Unsubscribing from trip and destinations listeners.");
            unsubscribeTrip();
            unsubscribeDestinations();
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
            // dont need to update local status.
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
        } catch (error) {
            console.error("Error updating destination:", error);
            throw error;
        }
    };


    const logout = () => {
        setCurrentTrip(null); // Clear the current trip
        console.log('Trip context cleared');
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
                logout
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
