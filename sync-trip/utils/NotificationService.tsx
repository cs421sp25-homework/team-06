export interface NotificationPayload {
  expoPushToken: string;
  title: string;
  body: string;
  data?: Record<string, any>;
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
