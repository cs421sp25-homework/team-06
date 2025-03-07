import {Trip} from "./Trip";


export interface Destination {
    latitude: number;
    longitude: number;
    trip?: Trip
    address?: string;
    description?: string;
    date?: Date;
}