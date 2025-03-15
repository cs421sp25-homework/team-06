import { firestore } from './firebase';
import {
    collection,
    doc,
    updateDoc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc, arrayUnion
} from '@react-native-firebase/firestore';
import { User } from '../types/User';
import {auth} from "./firebase";

// // Create a new user in Firestore
// export const createUser = async (userData: User): Promise<void> => {
//     const userRef = doc(firestore, 'users', userData.uid);
//     await setDoc(userRef, {
//         ...userData,
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//     });
// };

// Update user details in Firestore
export const updateUser = async (userId: string, updatedData: Partial<User>): Promise<void> => {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
    });
};

// Get current user data from Firestore
export const getCurrentUser = async ()=> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");
    const userRef = doc(collection(firestore, "users"), user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists) {
        return { uid: userSnap.id, ...userSnap.data() } as User;
    }
    return null;
};


// Set the currentTripId for a user
export const setCurrentTripId = async (userId: string, tripId: string | null): Promise<void> => {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
        currentTripId: tripId,
        updatedAt: serverTimestamp(),
    });
};

export const addTripToUser = async (userId: string, tripId: string): Promise<void> => {
    // const user = auth.currentUser;
    // if (!user) throw new Error("No authenticated user found");

    const userRef = doc(collection(firestore, "users"), userId);
    await updateDoc(userRef, {
        tripsId: arrayUnion(tripId), // Adds tripId to the array
        updatedAt: serverTimestamp(),
    });
};
