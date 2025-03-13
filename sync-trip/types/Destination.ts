import { Trip } from "./Trip";
import { CalendarDate } from 'react-native-paper-dates/lib/typescript/Date/Calendar';


export interface Destination {
    id?: string;
    latitude: number;
    longitude: number;
    trip?: Trip
    address?: string;
    description?: string;
    date?: Date;
    name?: string
}
