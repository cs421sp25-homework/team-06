import { Trip } from "./Trip";


export interface Destination {
    id?: string,
    latitude: number;
    longitude: number;
    trip?: Trip
    address?: string;
    description?: string;
    date?: Date;
    name?: string
}
