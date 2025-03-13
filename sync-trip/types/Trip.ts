import { Destination } from "./Destination";

export interface Trip {
    id?: string;
    title: string;
    startDate: Date;
    endDate: Date;
    destinations: Destination[];
    ownerId: string;
    collaborators: string[];
    createdAt?: any;
    updatedAt?: any;

    constructor(data: {
        title: string;
        startDate: Date;
        endDate: Date;
        ownerId: string;
        collaborators?: string[];
        destinations?: Destination[];
    }) {
    this.title = data.title;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.ownerId = data.ownerId;
    this.collaborators = data.collaborators || [];
    this.destinations = data.destinations || [];
    }
}
