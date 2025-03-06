import * as Location from 'expo-location';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Region,
  LongPressEvent,
} from 'react-native-maps';
import {
  Modal,
  Portal,
  TextInput,
  Button,
  Card,
  Text,
  ActivityIndicator,
} from 'react-native-paper';

interface MarkerData {
  latitude: number;
  longitude: number;
  address?: string;
  // trip: string; //TODO: bundle trip with marker
  description: string;
  time: string;
}

const MapScreen = () => {
  const [location, setLocation] = useState<any>(null);
  // const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]); //TODO: show route.
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  // info modal will show information of a marker
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [currMarker, setCurrMarker] = useState<MarkerData | null>(null);

  //for a new marker
  // const [trip, setTrip] = useState(''); //TODO: bundle the trip with the marker
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');

  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        setLoading(false);
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation.coords);
      setMapRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05, // zoom level
      });

      setLoading(false);
    })();
  }, []);

  const handleMapPress = async (event: LongPressEvent) => {
    //TODO: make the location information auto filled by Google Map.
    const { latitude, longitude } = event.nativeEvent.coordinate;

    // Reverse geocode to get address
    let address = 'Unknown Location';
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseGeocode.length > 0) {
        address = `${reverseGeocode[0].name || ''}, ${reverseGeocode[0].city || ''}`;
      }
    } catch (error) {
      console.log('Error getting address:', error);
    }

    setCurrMarker({ latitude, longitude, address, description: '', time: '' });
    setModalVisible(true);
  };

  const handleMarkerPress = (marker: MarkerData) => {
    setCurrMarker(marker);
    setInfoModalVisible(true);
  };

  const saveMarker = () => {
    if (!currMarker || !description || !time) {
      Alert.alert('Incomplete Details', 'Please fill in all fields before saving.');
      return;
    }
    setMarkers([...markers, { ...currMarker, description, time }]);
    setModalVisible(false);
    setDescription('');
    setTime('');
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation // Enables the blue dot for the user's location
        showsMyLocationButton // Enables a button to recenter on the user
        onLongPress={handleMapPress}
        region={mapRegion}>
        {/* Show existing markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            description={`${marker.description}\nTime: ${marker.time}`}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      )}

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}>
          <Card style={styles.card}>
            <Card.Title title="Marker" />
            <Card.Content>
              <Text style={styles.addressText}>{currMarker?.address}</Text>
              <TextInput
                label="Description"
                defaultValue={description}
                mode="outlined"
                onChangeText={setDescription}
                style={styles.input}
              />
              <TextInput
                label="Time"
                defaultValue={time}
                mode="outlined"
                onChangeText={setTime}
                style={styles.input}
              />
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={saveMarker}>
                Save
              </Button>
              <Button mode="outlined" onPress={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Card.Actions>
          </Card>
        </Modal>

        <Modal
          visible={infoModalVisible}
          onDismiss={() => setInfoModalVisible(false)}
          contentContainerStyle={styles.modalContainer}>
          <Card style={styles.card}>
            <Card.Title title="Marker Details" />
            <Card.Content>
              <Text style={styles.addressText}>{currMarker?.address}</Text>
              <Text>Description: {currMarker?.description}</Text>
              <Text>Time: {currMarker?.time}</Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => setInfoModalVisible(false)}>
                Close
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  setModalVisible(true);
                  setInfoModalVisible(false);
                  setDescription(currMarker?.description || '');
                  setTime(currMarker?.time || '');
                  //TODO: need to modify when more attributes of marker added. Or create a explicit function to handle.
                }}>
                Edit
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '90%',
    padding: 10,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 10,
    color: 'gray',
  },
  input: {
    marginBottom: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, // covers the entire container
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)', // optional: to dim the background
  },
  callout: {
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 10,
    width: 200, // Adjust width as needed
  },
});
