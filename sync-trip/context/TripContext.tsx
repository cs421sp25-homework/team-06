import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Trip } from "../types/Trip";
import { Destination } from "../types/Destination";
import { ChecklistItem } from "../types/Checklist";
import { Attention } from "../types/Attention";
import {
  addDestinationToTrip as apiAddDestinationToTrip,
  createTrip as apiCreateTrip,
  updateDestination as apiUpdateDestination,
  updateTrip as apiUpdateTrip,
  addChecklistItem as apiAddChecklistItem,
  updateChecklistItem as apiUpdateChecklistItem,
  deleteChecklistItem as apiDeleteChecklistItem,
  createAttention as apiCreateAttention,
  updateAttention as apiUpdateAttention,
  deleteAttention as apiDeleteAttention,
} from "../utils/tripAPI";
import { useUser } from "./UserContext";
import { addTripToUser as apiAddTripToUser, setCurrentTripId as apiSetCurrentTripId } from "../utils/userAPI";
import { firestore } from "../utils/firebase";
import { collection, doc, getDocs, onSnapshot } from "@react-native-firebase/firestore";

interface TripContextType {
  currentTrip: Trip | null;
  setCurrentTrip: (trip: Trip | null) => void;
  createTrip: (tripData: Trip) => Promise<void>;
  updateTrip: (updatedData: Partial<Trip>) => Promise<void>;
  addDestinationToTrip: (destination: Destination) => Promise<void>;
  updateDestinationInTrip: (destinationId: string, updatedData: Partial<Destination>) => Promise<void>;
  // Checklist functions
  checklists: Record<string, ChecklistItem[]>;
  addChecklistItem: (destId: string, text: string) => Promise<void>;
  updateChecklistItem: (destId: string, itemId: string, updates: Partial<ChecklistItem>) => Promise<void>;
  deleteChecklistItem: (destId: string, itemId: string) => Promise<void>;
  // Attention functions
  attentions: Attention[];
  createAttention: (text: string) => Promise<void>;
  updateAttention: (attentionId: string, newText: string) => Promise<void>;
  deleteAttention: (attentionId: string) => Promise<void>;
  logout: () => void;
  destinations: Destination[];
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});

  const [attentions, setAttentions] = useState<Attention[]>([]);

  const { currentUser, setCurrentUser, getCurrentUserId } = useUser();
  const currentTripId = currentUser?.currentTripId;

  // Listen to trip document and its destinations
  useEffect(() => {
    if (!currentTripId) return;

    const tripRef = doc(firestore, "trips", currentTripId);
    const destinationsRef = collection(firestore, "trips", currentTripId, "destinations");

    console.log("Listening for Firestore changes on trip:", currentTripId);

    const unsubscribeTrip = onSnapshot(tripRef, async (docSnap) => {
      if (docSnap.exists) {
        console.log("Trip updated from Firestore:", docSnap.data());
        const updatedTrip = { id: currentTripId, ...docSnap.data() } as Trip;
        const destinationsSnapshot = await getDocs(destinationsRef);
        const updatedDestinations = destinationsSnapshot
          ? destinationsSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Destination[]
          : [];
        setCurrentTrip({ ...updatedTrip, destinations: updatedDestinations });
        setDestinations(updatedDestinations);
      } else {
        console.warn("Trip document deleted.");
        setCurrentTrip(null);
      }
    });

    const unsubscribeDestinations = onSnapshot(destinationsRef, (snapshot) => {
      if (snapshot) {
        const updatedDestinations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Destination[];
        setDestinations(updatedDestinations);
        setCurrentTrip((prevTrip) =>
          prevTrip ? { ...prevTrip, destinations: updatedDestinations } : prevTrip
        );
      } else {
        setDestinations([]);
      }
    });

    return () => {
      console.log("Unsubscribing from trip and destinations listeners.");
      unsubscribeTrip();
      unsubscribeDestinations();
    };
  }, [currentTripId]);

  // Listen for checklist changes for each destination
  useEffect(() => {
    if (!currentTripId) return;
    const unsubscribeMap: Record<string, () => void> = {};

    destinations.forEach((dest) => {
      const checklistRef = collection(firestore, "trips", currentTripId, "destinations", dest.id, "checklists");
      const unsubscribe = onSnapshot(checklistRef, (snapshot) => {
        if (snapshot) {
          const items: ChecklistItem[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ChecklistItem[];
          setChecklists((prev) => ({ ...prev, [dest.id]: items }));
        } else {
          setChecklists((prev) => ({ ...prev, [dest.id]: [] }));
        }
      });
      unsubscribeMap[dest.id] = unsubscribe;
    });

    return () => {
      Object.values(unsubscribeMap).forEach((unsubscribe) => unsubscribe());
    };
  }, [currentTripId, destinations]);

  // Listen for Attention changes
  useEffect(() => {
    if (!currentTripId) return;
    const attentionRef = collection(firestore, "trips", currentTripId, "notices");
    const unsubscribeAttention = onSnapshot(attentionRef, (snapshot) => {
      if (snapshot) {
        const attentionsData: Attention[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            message: data.message,
            authorID: data.authorID,
            lastUpdatedBy: data.lastUpdatedBy,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
          } as Attention;
        });
        console.log("Attentions loaded:", attentionsData); // 可用于调试
        setAttentions(attentionsData);
      } else {
        setAttentions([]);
      }
    });
    return () => unsubscribeAttention();
  }, [currentTripId]);

  const createTrip = async (tripData: Trip) => {
    try {
      const tripId = await apiCreateTrip(tripData);
      console.log("Trip created with ID:", tripId);
      await apiAddTripToUser(getCurrentUserId(), tripId);
      await apiSetCurrentTripId(getCurrentUserId(), tripId);
      console.log("Trip created on Firestore:", tripData);
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

  // Checklist functions
  const addChecklistItem = async (destId: string, text: string) => {
    if (!currentTrip || !currentTrip.id) return;
    try {
      await apiAddChecklistItem(currentTrip.id, destId, text);
    } catch (error) {
      console.error("Error adding checklist item:", error);
      throw error;
    }
  };

  const updateChecklistItem = async (destId: string, itemId: string, updates: Partial<ChecklistItem>) => {
    if (!currentTrip || !currentTrip.id) return;
    try {
      await apiUpdateChecklistItem(currentTrip.id, destId, itemId, updates);
    } catch (error) {
      console.error("Error updating checklist item:", error);
      throw error;
    }
  };

  const deleteChecklistItem = async (destId: string, itemId: string) => {
    if (!currentTrip || !currentTrip.id) return;
    try {
      await apiDeleteChecklistItem(currentTrip.id, destId, itemId);
    } catch (error) {
      console.error("Error deleting checklist item:", error);
      throw error;
    }
  };
  
  // Attention functions
  const createAttention = async (text: string) => {
    if (!currentTrip || !currentTrip.id) return;
    try {
      await apiCreateAttention(currentTrip.id, text, currentUser.uid);
    } catch (error) {
      console.error("Error creating attention:", error);
      throw error;
    }
  };

  const updateAttention = async (attentionId: string, newText: string) => {
    if (!currentTrip || !currentTrip.id) return;
    try {
      await apiUpdateAttention(currentTrip.id, attentionId, newText, currentUser.uid);
    } catch (error) {
      console.error("Error updating attention:", error);
      throw error;
    }
  };

  const deleteAttention = async (attentionId: string) => {
    if (!currentTrip || !currentTrip.id) return;
    try {
      await apiDeleteAttention(currentTrip.id, attentionId);
    } catch (error) {
      console.error("Error deleting attention:", error);
      throw error;
    }
  };

  const logout = () => {
    setCurrentTrip(null);
    console.log("Trip context cleared");
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
        checklists,
        addChecklistItem,
        updateChecklistItem,
        deleteChecklistItem,
        attentions,
        createAttention,
        updateAttention,
        deleteAttention,
        logout,
        destinations,
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
