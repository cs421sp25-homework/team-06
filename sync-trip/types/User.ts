export interface User {
    uid: string;
    email: string;
    name?: string;
    bio?: string;
    travelPreference?: string;
    currentTripId?: string;
    profilePicture?: string; //picture link in firebase storage
    tripsIdList: string[];
    paypalEmail?: string;
}

export type Collaborator = Pick<User, 'uid' | 'name'>;