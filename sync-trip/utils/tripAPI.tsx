import { firestore } from './firebase';
import { collection, doc, addDoc, updateDoc, onSnapshot, serverTimestamp, Timestamp, getDoc } from '@react-native-firebase/firestore';
import { Trip } from '../types/Trip';
import { Destination } from '../types/Destination';


export const fetchTripsByIds = async (tripIds: string[]): Promise<Trip[]> => {
    // If there are no IDs, return an empty array.
    if (tripIds.length === 0) return [];

    const tripPromises = tripIds.map(async (id) => {
        const tripRef = doc(firestore, 'trips', id);
        const tripSnap = await getDoc(tripRef);
        return tripSnap.exists
            ? ({ id: tripSnap.id, ...tripSnap.data() } as Trip)
            : null;
    });
    const tripResults = await Promise.all(tripPromises);
    // Filter out any null values (in case a trip was not found)
    return tripResults.filter((trip) => trip !== null) as Trip[];
};

// Create a new trip and return its document ID.
export const createTrip = async (tripData: Trip): Promise<string> => {
    const tripRef = await addDoc(collection(firestore, 'trips'), {
        ...tripData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return tripRef.id;
};

// Update an existing trip.
export const updateTrip = async (tripId: string, updatedData: Partial<Trip>) => {
    const tripRef = doc(firestore, 'trips', tripId);
    await updateDoc(tripRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
    });
};

// Add a destination to a trip.
export const addDestinationToTrip = async (tripId: string, destination: any) => {
    const destinationsRef = collection(firestore, 'trips', tripId, 'destinations');
    const docRef = await addDoc(destinationsRef, {
        ...destination,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
};

// Get a trip with real-time updates.
export const subscribeToTrip = (tripId: string, callback: (data: any) => void) => {
    const tripRef = doc(firestore, 'trips', tripId);
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
    // If 'date' is provided and it's a Date, convert it to a Firestore Timestamp.
    if (updatedData.date instanceof Date) {
        updatedData.date = Timestamp.fromDate(updatedData.date) as any;
    }

    // Get a reference to the destination document in the subcollection 'destinations'
    const destinationRef = doc(firestore, 'trips', tripId, 'destinations', destinationId);
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
