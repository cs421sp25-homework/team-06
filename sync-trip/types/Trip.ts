import {Destination} from "./Destination";

export interface Trip {
    title: string;
    startDate: Date;
    endDate: Date;
    destinations: Destination[];
}