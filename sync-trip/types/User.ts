export interface User {
    uid: string;
    name?: string;
    bio?: string;
    travelPreference?: string;
    currentTripId?: string;
    profilePicture?: string; //TODO: picture data type
    tripsIdList: string[];
}
