import React, { createContext, useContext, useState, ReactNode } from "react";
import { Trip } from "../types/Trip"
import {Destination} from "../types/Destination";


interface TripContextType {
    currentTrip: Trip | null;
    setCurrentTrip: (trip: Trip) => void;
    addDestinationToTrip: (marker: Destination) => void;
    updateDestinationInTrip: (marker: Destination, index: number) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

    const addDestinationToTrip = (destination: Destination) => {
        if (currentTrip) {
            setCurrentTrip({
                ...currentTrip,
                destinations: [...currentTrip.destinations, destination],
            });
        }
    };

    const updateDestinationInTrip = (updatedMarker: Destination, index: number) => {
        if (!currentTrip) return;

        const updatedDestinations = [...currentTrip.destinations];
        updatedDestinations[index] = updatedMarker;

        setCurrentTrip({
            ...currentTrip,
            destinations: updatedDestinations,
        });
    };

    return (
        <TripContext.Provider value={{currentTrip, setCurrentTrip, addDestinationToTrip , updateDestinationInTrip }}>
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