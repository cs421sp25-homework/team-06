import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { Trip } from "../types/Trip";
import { Destination } from "../types/Destination";
import {
    createTrip as apiCreateTrip,
    updateTrip as apiUpdateTrip,
    addDestinationToTrip as apiAddDestinationToTrip,
    updateDestination as apiUpdateDestination,
    subscribeToTrip as apiSubscribeToTrip,
} from "../utils/tripAPI";

import { useUser } from "./UserContext"

import {
    addTripToUser as apiAddTripToUser,
    setCurrentTripId as apiSetCurrentTripId,
} from "../utils/userAPI";

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

    const { getCurrentUserId } = useUser();

    // If a currentTrip exists, subscribe to its changes in Firestore:
    useEffect(() => {
        let unsubscribe: () => void;
        if (currentTrip?.id) {
            unsubscribe = apiSubscribeToTrip(currentTrip.id, (tripData) => {
                setCurrentTrip(tripData);
            });
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [currentTrip?.id]);

    // Create a new trip document in Firestore and update local state.
    const createTrip = async (tripData: Trip) => {
        try {
            const tripId = await apiCreateTrip(tripData);
            console.log("Trip created with ID:", tripId);
            // Set the currentTrip with the new id.
            const newTrip : Trip = { ...tripData, id: tripId };
            setCurrentTrip(newTrip);

            //update firestore, and User Context will update by "snapshot" listener.
            await apiAddTripToUser(getCurrentUserId(), tripId);
            await apiSetCurrentTripId(getCurrentUserId(), tripId);

            console.log("Current trip state updated:", newTrip);
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
            setCurrentTrip((prevTrip) => (prevTrip ? { ...prevTrip, ...updatedData } : prevTrip));
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
            setCurrentTrip((prevTrip) =>
                prevTrip
                    ? {
                        ...prevTrip, destinations: [...prevTrip.destinations,
                            {
                                ...destination, 
                                id: destId,
                            }]
                    }
                    : prevTrip
            );
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
            // Update local state by mapping over existing destinations.
            const updatedDestinations = currentTrip.destinations.map((dest) => {
                // Assume each destination document has an "id" property.
                if ((dest as any).id === destinationId) {
                    return { ...dest, ...updatedData };
                }
                return dest;
            });
            setCurrentTrip({ ...currentTrip, destinations: updatedDestinations });
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
