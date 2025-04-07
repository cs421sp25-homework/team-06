import {Trip} from "../types/Trip";
import {firestore} from "./firebase";
// import axios from 'axios';

export interface NotificationPayload {
  expoPushToken: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}


export async function sendTripUpdateNotification(
  trip: Trip,
  messageTitle: string,
  messageBody: string
) {
  const tokens: string[] = [];

  // Loop through collaborator emails
  for (const collaboratorEmail of trip.collaborators) {
    try {
      // Query the users collection to find the document with the given email.
      const querySnapshot = await firestore
        .collection('users')
        .where('email', '==', collaboratorEmail)
        .get();

      if (!querySnapshot.empty) {
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.expoPushToken) {
            tokens.push(data.expoPushToken);
          }
        });
      } else {
        console.warn(`No user found for email: ${collaboratorEmail}`);
      }
    } catch (error) {
      console.error('Error retrieving user for email:', collaboratorEmail, error);
    }
  }

  if (tokens.length === 0) {
    console.log('No push tokens found for the trip collaborators.');
    return;
  }

  // Build the notification message payload for each token.
  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title: messageTitle,
    body: messageBody,
    data: { tripId: trip.id },
  }));

  // Send notifications to each token via Expo's push endpoint.
  for (const message of messages) {

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      if (!response.ok) {
        throw new Error('Failed to send push notification');
      }
      console.log('Push notification sent successfully');
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }

  }
}


export async function sendPushNotification(expoPushToken: string, title: string, body: string, data = {}): Promise<void> {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    if (!response.ok) {
      throw new Error('Failed to send push notification');
    }
    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}
