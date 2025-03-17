export interface Destination {
    id?: string;
    latitude: number;
    longitude: number;
    tripId?: string;
    address?: string;
    description?: string;
    date?: Date | null;
    name?: string;
    createdByUid: string;
    coords?: string;
}
