import { Trip } from "./Trip";
import { CalendarDate } from 'react-native-paper-dates/lib/typescript/Date/Calendar';


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
}
