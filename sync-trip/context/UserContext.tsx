import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";

import {User} from "../types/User";
import {auth, firestore} from "../utils/firebase";
import {doc, onSnapshot} from "@react-native-firebase/firestore";



interface UserContextType {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;

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
