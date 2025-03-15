import React, { useEffect, useState } from 'react';
import { View, SectionList } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useUser } from '../context/UserContext';
import { useTrip } from '../context/TripContext';
import { Trip } from '../types/Trip';
import {fetchTripsByIds} from "../utils/tripAPI";

const DashboardScreen = () => {
  const { setCurrentTrip } = useTrip();
  const { currentUser } = useUser();
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const tripIdList = currentUser?.tripsId||[];
        const userTrips = await fetchTripsByIds(tripIdList);
        setTrips(userTrips);
      } catch (error) {
        console.error("Error fetching trips:", error);
      }
    };

    loadTrips();
  }, []);

  const sections = [
    { title: 'Planning', data: trips.filter(trip => trip.status === 'planning') },
    { title: 'Ongoing', data: trips.filter(trip => trip.status === 'ongoing') },
    { title: 'Completed', data: trips.filter(trip => trip.status === 'completed') },
  ];

  const renderItem = ({ item }: { item: Trip }) => (
      <View style={{ padding: 10 }}>
        <Text>{item.title}</Text>
          <Button mode="contained" onPress={() => setCurrentTrip(item)}>
              Set as Current Trip
          </Button>
      </View>
  );

  return (
      <View style={{ flex: 1, padding: 20 }}>
        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id || item.title}
            renderItem={renderItem}
            renderSectionHeader={({ section }) => (
                <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{section.title}</Text>
            )}
        />
      </View>
  );
};

export default DashboardScreen;
