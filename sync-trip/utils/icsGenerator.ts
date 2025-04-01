// file: utils/icsGenerator.ts
import { createEvents } from "ics";
import { Trip } from "../types/Trip";
import { Destination } from "../types/Destination";

/**
 * Generates an iCalendar (.ics) string from a Trip object.
 */
export async function generateICS(trip: Trip): Promise<string> {
  const events = trip.destinations.map((dest: Destination) => {
    const dateObj = dest.date instanceof Date ? dest.date : new Date(dest.date);
    return {
      title: dest.description || trip.title,
      start: [
        dateObj.getFullYear(),
        dateObj.getMonth() + 1,
        dateObj.getDate(),
        dateObj.getHours(),
        dateObj.getMinutes(),
      ],
      // Set an arbitrary 1-hour event duration.
      end: [
        dateObj.getFullYear(),
        dateObj.getMonth() + 1,
        dateObj.getDate(),
        dateObj.getHours() + 1,
        dateObj.getMinutes(),
      ],
      location: dest.address || "",
      description: `Trip: ${trip.title}`,
    };
  });

  const { value, error } = createEvents(events);
  if (error) {
    throw error;
  }
  return value;
}