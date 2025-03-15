import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
// import {
//     getCurrentUser as apiGetCurrentUser,
//     updateUser as apiUpdateUser,
//     setCurrentTrip as apiSetCurrentTrip,
//     addTripToUser as apiAddTripToUser,
// } from "../utils/userAPI";
import { User } from "../types/User";
import firebase from "firebase/compat";
import {auth, firestore} from "../utils/firebase";
import {doc, onSnapshot} from "@react-native-firebase/firestore";
// import { useTrip } from "./TripContext"
import {getATripById} from "../utils/tripAPI";


interface UserContextType {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    // refreshUser: () => Promise<void>;
    // updateCurrentTrip: (tripId: string) => Promise<void>;
    // updateUserInfo: (updatedData: Partial<User>) => Promise<void>;
    // addTripToUser: (tripId: string) => Promise<void>;
    getCurrentUserId: () => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    // const { setCurrentTrip} = useTrip();


    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;  // No user logged in, do nothing

        const userRef = doc(firestore, "users", user.uid);

        // Set up Firestore listener
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists) {
                setCurrentUser({ uid: docSnap.id, ...docSnap.data() } as User);
            } else {
                setCurrentUser(null);
            }
        });

        return () => unsubscribe();  // Cleanup listener when unmounting
    }, []);




    // // Refresh the current user from Firestore using getCurrentUser from userAPI.
    // const refreshUser = async () => {
    //     try {
    //         const userData = await apiGetCurrentUser();
    //         setCurrentUser(userData);
    //     } catch (error) {
    //         console.error("Error refreshing user:", error);
    //     }
    // };
    //
    // useEffect(() => {
    //     // Load user data when the provider mounts.
    //     refreshUser();
    // }, []);

    // // Update the currentTripId in Firestore and local state.
    // const updateCurrentTripId = async (tripId: string) => {
    //     if (!currentUser) return;
    //     try {
    //         await apiSetCurrentTrip(currentUser.uid, tripId);
    //         setCurrentUser({ ...currentUser, currentTripId: tripId });
    //     } catch (error) {
    //         console.error("Error updating current trip:", error);
    //     }
    // };
    //
    // // Update other user details.
    // const updateUserInfo = async (updatedData: Partial<User>) => {
    //     if (!currentUser) return;
    //     try {
    //         await apiUpdateUser(currentUser.uid, updatedData);
    //         setCurrentUser({ ...currentUser, ...updatedData });
    //     } catch (error) {
    //         console.error("Error updating user info:", error);
    //     }
    // };
    //
    // // Function to add a trip to the user's tripsId list
    // const addTripToUser = async (tripId: string) => {
    //     if (!currentUser) {
    //         throw new Error("Current user does not exist");
    //     }
    //     try {
    //         await apiAddTripToUser(tripId);
    //         setCurrentUser((prevUser) =>
    //             prevUser ? { ...prevUser, tripsId: [...(prevUser.tripsId || []), tripId] } : prevUser
    //         );
    //     } catch (error) {
    //         console.error("Error adding trip to user:", error);
    //     }
    // };

    const getCurrentUserId = (): string => {
        if (!currentUser) {
            throw new Error("Current user does not exist");
        }
        return currentUser.uid;
    }

    const value: UserContextType = {
        currentUser,
        setCurrentUser,
        // refreshUser,
        // updateCurrentTrip: updateCurrentTripId,
        // updateUserInfo,
        // addTripToUser,
        getCurrentUserId,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
