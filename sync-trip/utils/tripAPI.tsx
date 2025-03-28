import {firestore} from './firebase';
import {
    addDoc,
    collection, deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    updateDoc
} from '@react-native-firebase/firestore';
import {Trip} from '../types/Trip';
import {Destination} from '../types/Destination';


export const getATripById = async (tripId: string): Promise<Trip> => {
    const tripRef = doc(firestore, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);
    if (!tripSnap.exists) {
        throw new Error(`Trip with ${tripId} doesn't exist`);
    }
    return {id: tripSnap.id, ...tripSnap.data()} as Trip;
}
// export const fetchTripsByIds = async (tripIdsList: string[]): Promise<Trip[]> => {
//     // If there are no IDs, return an empty array.
//     if (tripIdsList.length === 0) return [];
//
//     const tripPromises = tripIdsList.map(async (id) => {
//         const tripRef = doc(firestore, 'trips', id);
//         const tripSnap = await getDoc(tripRef);
//         return tripSnap.exists
//             ? ({ id: tripSnap.id, ...tripSnap.data() } as Trip)
//             : null;
//     });
//     const tripResults = await Promise.all(tripPromises);
//     // Filter out any null values (in case a trip was not found)
//     return tripResults.filter((trip) => trip !== null) as Trip[];
// };

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
    try {
        if (!tripId) throw new Error("Trip ID is missing");

        const destinationsRef = collection(firestore, 'trips', tripId, 'destinations');
        const docRef = await addDoc(destinationsRef, {
            ...destination,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // console.log("Destination added successfully on firestore with ID:", docRef.id, "in tripId:", tripId);
        return docRef.id;
    } catch (error) {
        console.error("Error adding destination:", error);
        throw error;
    }
};

export const deleteDestinationInTrip = async (tripId: string, destinationId:string) => {
    try {
        if (!tripId) throw new Error("Trip ID is missing");

        const destinationRef = doc(firestore, 'trips', tripId, 'destinations', destinationId);
        await deleteDoc(destinationRef);
        console.log(`Destination was deleted with ID ${destinationRef.id}`);

    } catch (error) {
        console.error("Error deleting destination:", error);
        throw error;
    }
}

// Get a trip with real-time updates.
export const subscribeToTrip = (tripId: string, callback: (data: any) => void) => {
    const tripRef = doc(firestore, 'trips', tripId);
    return onSnapshot(tripRef, (docSnap) => {
        if (docSnap.exists) {
            callback({id: docSnap.id, ...docSnap.data()});
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

export const deleteTrip = async (tripId: string): Promise<void> => {
  const tripRef = doc(firestore, "trips", tripId);
  await deleteDoc(tripRef);
};
