import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";
// import {
//     getCurrentUser as apiGetCurrentUser,
//     updateUser as apiUpdateUser,
//     setCurrentTrip as apiSetCurrentTrip,
//     addTripToUser as apiAddTripToUser,
// } from "../utils/userAPI";
import {User} from "../types/User";
import {auth, firestore} from "../utils/firebase";
import {doc, onSnapshot} from "@react-native-firebase/firestore";

// import { useTrip } from "./TripContext"


interface UserContextType {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    // refreshUser: () => Promise<void>;
    // updateCurrentTrip: (tripId: string) => Promise<void>;
    // updateUserInfo: (updatedData: Partial<User>) => Promise<void>;
    // addTripToUser: (tripId: string) => Promise<void>;
    getCurrentUserId: () => string;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({children}: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    // const { setCurrentTrip} = useTrip();


    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;  // No user logged in, do nothing

        const userRef = doc(firestore, "users", user.uid);

        // Set up Firestore listener
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists) {
                console.log("user has changed on firestore found, set new user context.");
                setCurrentUser({uid: docSnap.id, ...docSnap.data()} as User);
            } else {
                setCurrentUser(null);
            }
        });

        return () => unsubscribe();  // Cleanup listener when unmounting
    }, []);

    const getCurrentUserId = (): string => {
        if (!currentUser) {
            throw new Error("Current user does not exist");
        }
        return currentUser.uid;
    }

    // Logout function to clear user data
    const logout = () => {
        setCurrentUser(null); // Clear currentUser in the context
        // Additional cleanup logic, e.g., clearing localStorage, Firebase auth sign-out
        console.log('User logged out');
    };

    const value: UserContextType = {
        currentUser,
        setCurrentUser,
        // refreshUser,
        // updateCurrentTrip: updateCurrentTripId,
        // updateUserInfo,
        // addTripToUser,
        getCurrentUserId,
        logout,
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
