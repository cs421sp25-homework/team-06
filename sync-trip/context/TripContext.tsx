import React, { createContext, useContext, useState, ReactNode } from "react";

interface Trip {
    title: string;
    startDate: Date;
    endDate: Date;
    locations: string[]; //TODO: make Location class and change the type.
}

interface TripContextType {
    currentTrip: Trip | null;
    setCurrentTrip: (trip: Trip) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

    return (
        <TripContext.Provider value={{currentTrip, setCurrentTrip }}>
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