import React, {useEffect, useState} from 'react';
import {SectionList, View} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {useUser} from '../context/UserContext';
import {useTrip} from '../context/TripContext';
import {Trip, TripStatus} from '../types/Trip';
import {fetchTripsByIds} from "../utils/tripAPI";

const DashboardScreen = () => {
  const { setCurrentTrip } = useTrip();
  const { currentUser } = useUser();
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
      if (!currentUser || !currentUser.tripsIdList) return;

      // Fetch trips when user data updates
      const fetchTrips = async () => {
          const fetchedTrips = await fetchTripsByIds(currentUser.tripsIdList);
          setTrips(fetchedTrips);
      };

      fetchTrips();
  }, [currentUser?.tripsIdList]);  // Updates automatically when tripsIdList changes

  const sections = [
    { title: 'Planning', data: trips.filter(trip => trip.status === TripStatus.PLANNING) },
    { title: 'Ongoing', data: trips.filter(trip => trip.status === TripStatus.ONGOING) },
    { title: 'Completed', data: trips.filter(trip => trip.status === TripStatus.COMPLETED) },
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
