export interface User {
    uid: string;
    email: string;
    name?: string;
    bio?: string;
    travelPreference?: string;
    currentTripId?: string;
    profilePicture?: string; //picture link?
    tripsIdList: string[];
}
