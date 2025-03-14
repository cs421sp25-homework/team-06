import { Destination } from "./Destination";

export interface Trip {
    id?: string;
    title: string;
    startDate: Date;
    endDate: Date;
    destinations: Destination[];
    ownerId: string;
    collaborators: string[];
}
