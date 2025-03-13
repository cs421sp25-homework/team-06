import { auth, firestore, getUserDocRef } from "../utils/firebase";
import { onSnapshot } from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';

import type { RootStackParamList } from '../navigation/useAppNavigation';

type DashboardNavigationProp = StackNavigationProp<RootStackParamList, 'App'>;

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const [username, setUsername] = useState<string>('User');

  // Retrieve the user's name from Firestore (adjust the collection/document as needed)
  useEffect(() => {
    const userDocRef = getUserDocRef();
    if (!userDocRef) return; // Ensure it's not null
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data?.name) {
            setUsername(data.name);
          }
        }
      },
      (err) => {
        console.error('Error fetching user data:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleViewTripHistory = () => {
    navigation.navigate('History'); // Navigates to the full trip history page
  };

  const handleArchivedHistory = () => {
    navigation.navigate('ArchivedHistory'); // Navigates to archived trips (ensure this route exists)
  };

  return (
    <ScrollView testID="dashboardScreen" contentContainerStyle={styles.container}>
      {/* Greeting Title */}
      <Title style={styles.title}>Hi {username}, enjoy your trip!</Title>

      {/* Bulletin Component */}
      <Card style={styles.card}>
        <Card.Title title="Bulletin" />
        <Card.Content>
          <Paragraph>
            • Buy tickets for museum {/* TODO: Replace with dynamic bulletin data */}
          </Paragraph>
          <Paragraph>
            • Confirm hotel reservation {/* TODO: Replace with dynamic bulletin data */}
          </Paragraph>
          <Paragraph>• Pack essentials {/* TODO: Replace with dynamic bulletin data */}</Paragraph>
        </Card.Content>
      </Card>

      {/* Today's Digest Component */}
      <Card style={styles.card}>
        <Card.Title title="Today's Digest" />
        <Card.Content>
          <Paragraph>
            TODO: Add digest content here {/* TODO: Replace with actual digest data */}
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Weather Component */}
      <Card style={styles.card}>
        <Card.Title title="Today's Weather" />
        <Card.Content>
          <Paragraph>Sunny, 25°C {/* TODO: Replace with real weather data */}</Paragraph>
        </Card.Content>
      </Card>

      {/* Trip History Preview */}
      <Card style={styles.card}>
        <Card.Title title="Last Completed Trip" subtitle="Trip to Paris" />
        <Card.Content>
          <Paragraph>Finished on: 2023-02-28 {/* TODO: Replace with actual trip date */}</Paragraph>
          <Paragraph>
            Highlights: Eiffel Tower, Louvre, Seine Cruise{' '}
            {/* TODO: Replace with actual trip highlights */}
          </Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button testID="viewMore" onPress={handleViewTripHistory}>View More</Button>
        </Card.Actions>
      </Card>

      {/* Archived History Button */}
      <View style={styles.archivedContainer}>
        <Button
          testID="archivedTrips"
          mode="contained"
          icon="archive"
          onPress={handleArchivedHistory}
          style={styles.archivedButton}>
          Archived Trips
        </Button>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
  },
  card: {
    width: '100%',
    marginVertical: 8,
  },
  archivedContainer: {
    marginVertical: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  archivedButton: {
    width: '80%',
  },
});
