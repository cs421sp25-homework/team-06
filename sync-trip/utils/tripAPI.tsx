import { firestore } from "./firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  getDocs,
} from "@react-native-firebase/firestore";
import { Trip } from "../types/Trip";
import { Destination } from "../types/Destination";
import { ChecklistItem } from "../types/Checklist";
import { Attention } from "../types/Attention";

export const getATripById = async (tripId: string): Promise<Trip> => {
  const tripRef = doc(firestore, "trips", tripId);
  const tripSnap = await getDoc(tripRef);
  if (!tripSnap.exists) {
    throw new Error(`Trip with ${tripId} doesn't exist`);
  }
  return { id: tripSnap.id, ...tripSnap.data() } as Trip;
};

// Create a new trip and return its document ID.
export const createTrip = async (tripData: Trip): Promise<string> => {
  const tripRef = await addDoc(collection(firestore, "trips"), {
    ...tripData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return tripRef.id;
};

// Update an existing trip.
export const updateTrip = async (tripId: string, updatedData: Partial<Trip>) => {
  const tripRef = doc(firestore, "trips", tripId);
  await updateDoc(tripRef, {
    ...updatedData,
    updatedAt: serverTimestamp(),
  });
};

// Add a destination to a trip.
export const addDestinationToTrip = async (tripId: string, destination: any) => {
  try {
    if (!tripId) throw new Error("Trip ID is missing");
    const destinationsRef = collection(firestore, "trips", tripId, "destinations");
    const docRef = await addDoc(destinationsRef, {
      ...destination,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding destination:", error);
    throw error;
  }
};

export const deleteDestinationInTrip = async (tripId: string, destinationId: string) => {
  try {
    if (!tripId) throw new Error("Trip ID is missing");
    const destinationRef = doc(firestore, "trips", tripId, "destinations", destinationId);
    await deleteDoc(destinationRef);
    console.log(`Destination was deleted with ID ${destinationRef.id}`);
  } catch (error) {
    console.error("Error deleting destination:", error);
    throw error;
  }
};

// Get a trip with real-time updates.
export const subscribeToTrip = (tripId: string, callback: (data: any) => void) => {
  const tripRef = doc(firestore, "trips", tripId);
  return onSnapshot(tripRef, (docSnap) => {
    if (docSnap.exists) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  });
};

export const updateDestination = async (
  tripId: string,
  destinationId: string,
  updatedData: Partial<Destination>
) => {
  if (updatedData.date instanceof Date) {
    updatedData.date = Timestamp.fromDate(updatedData.date) as any;
  }
  const destinationRef = doc(firestore, "trips", tripId, "destinations", destinationId);
  await updateDoc(destinationRef, {
    ...updatedData,
    updatedAt: serverTimestamp(),
  });
};


export const convertTimestampToDate = (ts: any): Date => {
    // If ts is an instance of Timestamp, use its toDate() method.
    if (ts instanceof Timestamp) {
        return ts.toDate();
    }
    // Otherwise, assume it has seconds and nanoseconds properties.
    return new Date(ts.seconds * 1000);
};

export const deleteTrip = async (tripId: string): Promise<void> => {
  const tripRef = doc(firestore, "trips", tripId);
  await deleteDoc(tripRef);
};

// Checklist API functions

export const addChecklistItem = async (
  tripId: string,
  destId: string,
  text: string,
  completed: boolean = false
): Promise<void> => {
  if (!tripId || !destId) throw new Error("Trip or Destination ID is missing");
  const checklistRef = collection(
    firestore,
    "trips",
    tripId,
    "destinations",
    destId,
    "checklists"
  );
  const docRef = await addDoc(checklistRef, {
    text,
    completed,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log("Checklist item added with ID:", docRef.id);
};

export const updateChecklistItem = async (
  tripId: string,
  destId: string,
  itemId: string,
  updates: Partial<Pick<ChecklistItem, "text" | "completed">>
): Promise<void> => {
  if (!tripId || !destId || !itemId) throw new Error("Missing IDs for checklist update");
  const itemRef = doc(
    firestore,
    "trips",
    tripId,
    "destinations",
    destId,
    "checklists",
    itemId
  );
  await updateDoc(itemRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteChecklistItem = async (
  tripId: string,
  destId: string,
  itemId: string
): Promise<void> => {
  if (!tripId || !destId || !itemId) throw new Error("Missing IDs for checklist deletion");
  const itemRef = doc(
    firestore,
    "trips",
    tripId,
    "destinations",
    destId,
    "checklists",
    itemId
  );
  await deleteDoc(itemRef);
  console.log(`Checklist item deleted with ID ${itemRef.id}`);
};


// create Attention
export const createAttention = async (
  tripId: string, 
  message: string,
  authorID: string 
): Promise<void> => { 
  if (!message) throw new Error("Attention text is missing");
  const attentionRef = collection(firestore, "trips", tripId, "notices");
  const docRef = await addDoc(attentionRef, {
    message: message,
    authorID: authorID,
    lastUpdatedBy: authorID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log("Attention added with ID:", docRef.id);
};

export const updateAttention = async (
  tripId: string,
  attentionId: string,
  newMessage: string,
  lastUpdatedBy: string
): Promise<void> => {
  if (!attentionId) throw new Error("Attention ID is missing");
  const attentionDocRef = doc(firestore, "trips", tripId, "notices", attentionId);
  await updateDoc(attentionDocRef, {
    message: newMessage,
    lastUpdatedBy: lastUpdatedBy,
    updatedAt: serverTimestamp(),
  });
};

export const deleteAttention = async (
  tripId: string,
  attentionId: string
): Promise<void> => {
  if (!attentionId) throw new Error("Attention ID is missing");
  const attentionDocRef = doc(firestore, "trips", tripId, "notices", attentionId);
  await deleteDoc(attentionDocRef);
  console.log(`Attention deleted with ID ${attentionDocRef.id}`);
};