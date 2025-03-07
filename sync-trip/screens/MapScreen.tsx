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
import {Destination} from "../types/Destination";
import {useTrip} from "../context/TripContext";

const MapScreen = () => {
  const { currentTrip, addDestinationToTrip, updateDestinationInTrip } = useTrip();

  const [location, setLocation] = useState<any>(null);
  // const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]); //TODO: show route.
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);
  // this modal can edit an existing marker(destination)
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  // this modal can add a new marker(destination)
  const [modalVisible, setModalVisible] = useState(false);
  // info modal will show information of a marker
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const [currMarker, setCurrMarker] = useState<Destination | null>(null);

  //for a new marker
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');

  const [loading, setLoading] = useState(true); // Loading state

  if(!currentTrip) {
    Alert.alert("currentTrip does not exist! create one first.");
    return;}
  //TODO: handle the situation without a valid currentTrip, maybe enforce user to create one.

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

  const handleMapLongPress = async (event: LongPressEvent) => {
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

    setCurrMarker({ latitude, longitude, address, description: '' });
    setModalVisible(true);
  };

  const handleMarkerPress = (marker: Destination) => {
    setCurrMarker(marker);
    setInfoModalVisible(true);
  };

  const saveNewMarker = () => {
    if (!currMarker || !description) {
      Alert.alert('Incomplete', 'Please fill in all fields before saving.');
      return;
    }
    
    if (currentTrip) {
      currMarker.trip=currentTrip;
    }
    currMarker.description=description;//TODO: if more info added to Marker(Destination) editor, need to add here.
    
    addDestinationToTrip(currMarker);
    setModalVisible(false);
    setDescription('');
    setTime('');
  };

  const showEditUI = () => {
    setEditModalVisible(true);
    setInfoModalVisible(false);
  }

  const updateMarker = () => {
    if (!currMarker || !description) {
      Alert.alert('Incomplete', 'Please fill in all fields before saving.');
      return;
    }

    const markerIndex = currentTrip.destinations.findIndex(
        (marker) =>
            marker.latitude === currMarker.latitude &&
            marker.longitude === currMarker.longitude
    );

    if (markerIndex === -1) {
      Alert.alert("Error", "Marker not found in the current trip.");
      return;
    }

    currMarker.description=description; //TODO: if more info added to Marker(Destination) editor, need to add here.
    const updatedMarker = {
      ...currentTrip.destinations[markerIndex],
      description: description, //TODO: and here
    };

    updateDestinationInTrip(updatedMarker, markerIndex);



    setEditModalVisible(false);
    setDescription('');
    setTime('');
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation // Enables the blue dot for the user's location
        showsMyLocationButton // Enables a button to recenter on the user
        onLongPress={handleMapLongPress}
        region={mapRegion}>
        {/* Show existing markers */}
        {(currentTrip?.destinations || []).map((marker, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            description={`${marker.description}\nDate: ${marker.date}`}
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
            <Card.Title title="Add a new Marker" />
            <Card.Content>
              <Text style={styles.addressText}>{currMarker?.address}</Text>
              <TextInput
                label="Description"
                defaultValue={description}
                mode="outlined"
                onChangeText={setDescription}
                style={styles.input}
              />
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={saveNewMarker}>
                Add
              </Button>
              <Button mode="outlined" onPress={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Card.Actions>
          </Card>
        </Modal>

        <Modal
            visible={editModalVisible}
            onDismiss={() => setEditModalVisible(false)}
            contentContainerStyle={styles.modalContainer}>
          <Card style={styles.card}>
            <Card.Title title="Edit the Destination" />
            <Card.Content>
              <Text style={styles.addressText}>{currMarker?.address}</Text>
              <TextInput
                  label="Description"
                  defaultValue={description}
                  mode="outlined"
                  onChangeText={setDescription}
                  style={styles.input}
              />
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={updateMarker}>
                Save Change
              </Button>
              <Button mode="outlined" onPress={() => setEditModalVisible(false)}>
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
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => setInfoModalVisible(false)}>
                Close
              </Button>
              <Button
                mode="outlined"
                onPress={showEditUI}
                  >
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
