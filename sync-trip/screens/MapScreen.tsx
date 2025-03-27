import * as Location from 'expo-location';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { LongPressEvent, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { ActivityIndicator, Button, Card, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { Destination } from "../types/Destination";
import { useTrip } from "../context/TripContext";
import { useTabs } from "../navigation/useAppNavigation";
import { useUser } from "../context/UserContext";

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMaps?.apiKey2;

const MapScreen = () => {
  const { currentTrip, addDestinationToTrip, updateDestinationInTrip } = useTrip();
  const { getCurrentUserId } = useUser();

  const [location, setLocation] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(true);
  const [currMarker, setCurrMarker] = useState<Destination | null>(null);
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);
  const { tabIndex, setTabIndex } = useTabs();

  // New states for search and detailed place information
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<any>(null);
  const [placeDetailsModalVisible, setPlaceDetailsModalVisible] = useState(false);

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
        longitudeDelta: 0.05,
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
  };

  const handleMapLongPress = async (event: LongPressEvent) => {
    if (!currentTrip) {
      Alert.alert(
        "No Trip Found",
        "Please create a trip first.",
        [
          { text: "Create Now", onPress: redirectToNewTrip },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }
    const { latitude, longitude } = event.nativeEvent.coordinate;
    let address = 'Unknown location';

    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
        address = geocodeData.results[0].formatted_address;
      }
    } catch (error) {
      console.log("[Error] Fetching address failed:", error);
    }
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

    try {
      await addDestinationToTrip(newDestination);
      setModalVisible(false);
    } catch (error) {
      console.error("Error adding destination:", error);
      Alert.alert("Error", "Failed to add destination. Please try again.");
    }
  };

  const showEditUI = () => {
    setEditModalVisible(true);
    setInfoModalVisible(false);
  };

  const updateMarker = async () => {
    if (!currentTrip) {
      Alert.alert("Error", "Current trip not found");
      return;
    }
    if (!currMarker || !description.trim()) {
      Alert.alert('Incomplete', 'Please fill in all fields before saving.');
      return;
    }

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
  };

  // Search functionality using Google Places Autocomplete API
  const handleSearch = async (query: string) => {
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }
    try {
      const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.status === 'OK') {
        setSearchResults(data.predictions);
      } else {
        console.error("Place autocomplete error:", data.status);
      }
    } catch (error) {
      console.error("Error searching places:", error);
    }
  };

  // Get detailed place information including extra fields (name, phone, website, rating, etc.)
  const handleSelectPlace = async (placeId: string) => {
    try {
      const fields = "name,formatted_address,geometry,international_phone_number,website,rating,opening_hours";
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(detailsUrl);
      const data = await response.json();
      if (data.status === 'OK') {
        const details = data.result;
        const { lat, lng } = details.geometry.location;
        // Update the map region to the place location
        setMapRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        // Set the detailed place info for display
        setSelectedPlaceDetails({
          name: details.name,
          address: details.formatted_address,
          phone: details.international_phone_number,
          website: details.website,
          rating: details.rating,
          openingHours: details.opening_hours,
          latitude: lat,
          longitude: lng,
        });
        // Open modal to display place details
        setPlaceDetailsModalVisible(true);
        // Clear search results and query
        setSearchResults([]);
        setSearchQuery('');
      } else {
        console.error("Place details error:", data.status);
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          label="Search Places"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            handleSearch(text);
          }}
          mode="outlined"
          style={styles.searchInput}
        />
        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelectPlace(item.place_id)} style={styles.searchResultItem}>
                <Text>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={styles.searchResultsList}
          />
        )}
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        onLongPress={handleMapLongPress}
        region={mapRegion}>
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
        {/* Modal for adding a new marker */}
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}>
          <Card style={styles.card}>
            <Card.Title title="Add a New Marker" />
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

        {/* Modal for editing a marker */}
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modalContainer}>
          <Card style={styles.card}>
            <Card.Title title="Edit Destination" />
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
                Save Changes
              </Button>
              <Button mode="outlined" onPress={() => setEditModalVisible(false)}>
                Cancel
              </Button>
            </Card.Actions>
          </Card>
        </Modal>

        {/* Modal for marker details (existing marker) */}
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
              <Button mode="outlined" onPress={showEditUI}>
                Edit
              </Button>
            </Card.Actions>
          </Card>
        </Modal>

        {/* Modal for detailed place information (from search) */}
        <Modal
          visible={placeDetailsModalVisible}
          onDismiss={() => setPlaceDetailsModalVisible(false)}
          contentContainerStyle={styles.modalContainer}>
          <Card style={styles.card}>
            <Card.Title title={selectedPlaceDetails?.name || "Place Details"} />
            <Card.Content>
              <Text style={styles.addressText}>{selectedPlaceDetails?.address}</Text>
              {selectedPlaceDetails?.phone && <Text>Phone: {selectedPlaceDetails.phone}</Text>}
              {selectedPlaceDetails?.website && <Text>Website: {selectedPlaceDetails.website}</Text>}
              {selectedPlaceDetails?.rating && <Text>Rating: {selectedPlaceDetails.rating}</Text>}
              {/* Optionally display opening hours or other details */}
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => setPlaceDetailsModalVisible(false)}>
                Close
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
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  // Search bar styles
  searchContainer: {
    position: 'absolute',
    top: 40,
    left: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
  },
  searchInput: {
    backgroundColor: 'white',
  },
  searchResultsList: {
    backgroundColor: 'white',
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});
