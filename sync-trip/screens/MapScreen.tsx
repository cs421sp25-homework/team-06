import * as Location from 'expo-location';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import MapView, { LongPressEvent, Marker, PROVIDER_GOOGLE, Region, } from 'react-native-maps';
import { ActivityIndicator, Button, Card, Modal, Portal, Text, TextInput, } from 'react-native-paper';
import { Destination } from "../types/Destination";
import { useTrip } from "../context/TripContext";
import { useTabs } from "../navigation/useAppNavigation";
import { useUser } from "../context/UserContext";

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMaps?.apiKey2;
const MapScreen = () => {
  const { currentTrip, addDestinationToTrip, updateDestinationInTrip } = useTrip();
  const { getCurrentUserId } = useUser();

  const [location, setLocation] = useState<any>(null);
  // const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]); //TODO: show route.
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);
  // this modal can edit an existing marker(destination)
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  // this modal can add a new marker(destination)
  const [modalVisible, setModalVisible] = useState(false);
  // info modal will show information of a marker
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(true);

  const [currMarker, setCurrMarker] = useState<Destination | null>(null);

  //for a new marker
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');

  const [loading, setLoading] = useState(true); // Loading state
  const { tabIndex, setTabIndex } = useTabs();


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

  useEffect(() => {
    if (!currentTrip && tabIndex === 3) {
      setDialogVisible(true);
    }
  }, [currentTrip, tabIndex]);

  const redirectToNewTrip = () => {
    setTabIndex(2);
    setDialogVisible(false);
  }

  const handleMapLongPress = async (event: LongPressEvent) => {
    if (!currentTrip) {
      // No current trip exists; show a dialog prompting trip creation
      Alert.alert(
        "No Trip Found",
        "You need to create a trip first.",
        [
          { text: "Start Creating Now", onPress: redirectToNewTrip },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    // TODO: make the location information auto filled by Google Map.
    const { latitude, longitude } = event.nativeEvent.coordinate;
    // console.log("[LongPress] Coordinates:", { latitude, longitude });
    let address = 'Unknown Location';

    /* 
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      console.log("[ReverseGeocode] Result:", reverseGeocode);
      if (reverseGeocode.length > 0) {
        //address = `${reverseGeocode[0].name || ''}, ${reverseGeocode[0].street || ''}, ${reverseGeocode[0].city || ''}`;
        address = reverseGeocode[0].formattedAddress || "Unknown Location";
        console.log("[ReverseGeocode] Parsed address:", address);
      }
    } catch (error) {
      console.log("[ReverseGeocode] Error getting address:", error);
    }
    */
    //using google map API for detailed information
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();
      console.log("[Geocode] Response Data:", geocodeData);

      if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
        const formattedAddress = geocodeData.results[0].formatted_address;
        console.log("[Geocode] Formatted Address:", formattedAddress);

        const placeId = geocodeData.results[0].place_id;
        console.log("[Geocode] Obtained Place ID:", placeId);

        const fields = "id,displayName,formattedAddress"//,formatted_phone_number,opening_hours,website,rating,photos";
        const placesUrl = `https://places.googleapis.com/v1/places/${placeId}?fields=${fields}&key=${GOOGLE_API_KEY}`;
        //console.log("[Places] Request URL:", placesUrl);

        const placesResponse = await fetch(placesUrl, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const placesData = await placesResponse.json();
        console.log("[Places] Response Data:", placesData);

        const placeName = placesData.displayName?.text || "Unknown Place";
        address = placesData.formattedAddress || "Unknown Place";
        console.log("[Places] Parsed Place Name:", placeName);
        console.log("[Places] Parsed Place Address:", address);
      } else {
        console.log("Geocoding API unable to return");
      }
    } catch (error) {
      console.log("[Error] Fetching geocode or place details failed:", error);
    }
        /**/
    setCurrMarker({ latitude, longitude, address, description: '', createdByUid: getCurrentUserId() });
    setModalVisible(true);
  };


  const handleMarkerPress = (marker: Destination) => {
    setCurrMarker(marker);
    setInfoModalVisible(true);
  };

  const saveNewMarker = async () => {
    if (!currMarker || !description) {
      Alert.alert('Incomplete', 'Please fill in all fields before saving.');
      return;
    }
    if (currentTrip) {
      currMarker.tripId = currentTrip.id;
    }
    const newDestination: Destination = {
      ...currMarker,
      description: description
    };
    // TODO: if more info added to Marker(Destination) editor, need to add here.

    try {
      await addDestinationToTrip(newDestination);
      setModalVisible(false);
      //setDescription('');
      //setTime('');
    } catch (error) {
      console.error("Error adding destination:", error);
      Alert.alert("Error", "Failed to add destination. Please try again.");
    }
  };

  const showEditUI = () => {
    setEditModalVisible(true);
    setInfoModalVisible(false);
  }

  const updateMarker = async () => {
    if (!currentTrip) {
      Alert.alert("Error", "current trip not found");
      throw new Error("Current trip does not exist");
    }
    if (!currMarker || !description.trim()) {
      Alert.alert('Incomplete', 'Please fill in all fields before saving.');
      return;
    }

    // Find the marker index by comparing IDs (if available), else by coordinates.
    const markerIndex = currentTrip.destinations.findIndex((marker) => {
      if ((marker as any).id && (currMarker as any).id) {
        return (marker as any).id === (currMarker as any).id;
      }
      return marker.latitude === currMarker.latitude && marker.longitude === currMarker.longitude;
    });

    if (markerIndex === -1) {
      Alert.alert("Error", "Marker not found in the current trip.");
      return;
    }

    // Assume updateDestinationInTrip expects (destinationId, updatedData).
    if ((currMarker as any).id) {
      try {
        await updateDestinationInTrip((currMarker as any).id, { description });
      } catch (error) {
        console.error("Error updating destination:", error);
        Alert.alert("Error", "Failed to update destination.");
        return;
      }
    } else {
      Alert.alert("Error", "Destination ID not found.");
      return;
    }

    setEditModalVisible(false);
    //setDescription('');
    //setTime('');
  };


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
        {(currentTrip?.destinations || []).map((marker, index) => {
          // Check that both latitude and longitude are defined and are numbers.
          const latitude = Number(marker.latitude);
          const longitude = Number(marker.longitude);
          if (isNaN(latitude) || isNaN(longitude)) {
            console.warn(`Skipping marker at index ${index} due to invalid coordinate`, marker);
            return null;
          }
          return (
            <Marker
              key={index}
              coordinate={{ latitude, longitude }}
              description={`${marker.description}\nDate: ${marker.date}`}
              onPress={() => handleMarkerPress(marker)}
            />
          );
        })}
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
