import * as Location from 'expo-location';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { LongPressEvent, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { ActivityIndicator, Button, Card, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import { Destination } from "../types/Destination";
import { useTrip } from "../context/TripContext";
import { useTabs } from "../navigation/useAppNavigation";
import { useUser } from "../context/UserContext";
import {
  convertTimestampToDate
} from '../utils/tripAPI'; // or wherever your timestamp => Date converter is

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMaps?.apiKey2;

const MapScreen = () => {
  const { currentTrip, addDestinationToTrip, updateDestinationInTrip } = useTrip();
  const { getCurrentUserId } = useUser();
  const { tabIndex, setTabIndex } = useTabs();

  // User location & map region
  const [location, setLocation] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // States for adding/editing markers
  const [modalVisible, setModalVisible] = useState(false);       // For adding a new marker
  const [editModalVisible, setEditModalVisible] = useState(false); // For editing an existing marker
  const [infoModalVisible, setInfoModalVisible] = useState(false); // Viewing marker details
  const [currMarker, setCurrMarker] = useState<Destination | null>(null);

  // State for (re)setting marker details
  const [description, setDescription] = useState('');
  // We'll store date/time in these states for a marker
  const [markerDate, setMarkerDate] = useState<Date | null>(null);
  const [markerTime, setMarkerTime] = useState<{ hours: number; minutes: number } | null>(null);
  const [markerDatePickerVisible, setMarkerDatePickerVisible] = useState(false);
  const [markerTimePickerVisible, setMarkerTimePickerVisible] = useState(false);

  // If user has no current trip
  const [dialogVisible, setDialogVisible] = useState(true);

  // For places search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<any>(null);
  const [placeDetailsModalVisible, setPlaceDetailsModalVisible] = useState(false);

  // We'll store the trip's start/end date in local states
  const [tripStartDate, setTripStartDate] = useState<Date | null>(null);
  const [tripEndDate, setTripEndDate] = useState<Date | null>(null);

  // Convert trip's start/end to Date objects
  useEffect(() => {
    if (currentTrip) {
      // parse start/end as Dates
      const startDateObj = currentTrip.startDate instanceof Date
        ? currentTrip.startDate
        : convertTimestampToDate(currentTrip.startDate);

      const endDateObj = currentTrip.endDate instanceof Date
        ? currentTrip.endDate
        : convertTimestampToDate(currentTrip.endDate);

      setTripStartDate(startDateObj);
      setTripEndDate(endDateObj);
    }
  }, [currentTrip]);

  // =======================
  // Request location permission and set initial region
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
    // If user is on the 'Map' tab but no current trip is found, show a dialog
    if (!currentTrip && tabIndex === 3) {
      setDialogVisible(true);
    }
  }, [currentTrip, tabIndex]);

  // Navigate user to the 'New Trip' tab if they have no current trip
  const redirectToNewTrip = () => {
    setTabIndex(2);
    setDialogVisible(false);
  };

  // Called when user long-presses on the map to add a new marker
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

    // (Optional) Reverse geocode with expo-location or Google
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();
      console.log("[Geocode] Response Data:", geocodeData);

      if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
        address = geocodeData.results[0].formatted_address || "Unknown Place";
      }
    } catch (error) {
      console.log("[Error] Fetching geocode/place details failed:", error);
    }

    // Prepare a marker object
    setCurrMarker({
      latitude,
      longitude,
      address,
      description: '',
      createdByUid: getCurrentUserId()
    });

    setDescription('');
    setMarkerDate(null);
    setMarkerTime(null);

    setModalVisible(true);
  };

  // Save a NEW marker (destination) to the trip
  const saveNewMarker = async () => {
    if (!currMarker || !description) {
      Alert.alert('Incomplete', 'Please provide a description before saving.');
      return;
    }
    // If we want date/time for new markers as well:
    let finalDate: Date | null = null;
    if (markerDate) {
      finalDate = new Date(markerDate.getTime());
      if (markerTime) {
        finalDate.setHours(markerTime.hours, markerTime.minutes, 0, 0);
      }
    }

    // Attach tripId
    if (currentTrip) {
      currMarker.tripId = currentTrip.id;
    }
    const newDestination: Destination = {
      ...currMarker,
      description,
      date: finalDate || null, // store the combined date/time
    };

    try {
      await addDestinationToTrip(newDestination);
      setModalVisible(false);
      setDescription('');
    } catch (error) {
      console.error("Error adding destination:", error);
      Alert.alert("Error", "Failed to add destination. Please try again.");
    }
  };

  // Called when user taps an existing marker
  const handleMarkerPress = (marker: Destination) => {
    setCurrMarker(marker);
    setInfoModalVisible(true);
  };

  // Switch from info modal to edit modal
  const showEditUI = () => {
    if (!currMarker) return;
    setEditModalVisible(true);
    setInfoModalVisible(false);

    // Pre-fill description
    setDescription(currMarker.description || '');

    // Pre-fill date/time if it exists
    if (currMarker.date) {
      const d = new Date(currMarker.date);
      setMarkerDate(d);
      setMarkerTime({ hours: d.getHours(), minutes: d.getMinutes() });
    } else {
      setMarkerDate(null);
      setMarkerTime(null);
    }
  };

  // =======================
  // Update an existing marker (destination)
  const updateMarker = async () => {
    if (!currentTrip) {
      Alert.alert("Error", "Current trip not found");
      return;
    }
    if (!currMarker || !description.trim()) {
      Alert.alert('Incomplete', 'Please fill in all fields before saving.');
      return;
    }

    // Combine date/time
    let finalDate: Date | null = null;
    if (markerDate) {
      finalDate = new Date(markerDate.getTime());
      if (markerTime) {
        finalDate.setHours(markerTime.hours, markerTime.minutes, 0, 0);
      }
    }

    // If marker has an ID, we can call updateDestinationInTrip
    const markerId = (currMarker as any).id;
    if (!markerId) {
      Alert.alert("Error", "Destination ID not found.");
      return;
    }

    try {
      await updateDestinationInTrip(markerId, {
        description,
        date: finalDate || null,
      });
    } catch (error) {
      console.error("Error updating destination:", error);
      Alert.alert("Error", "Failed to update destination.");
      return;
    }

    setEditModalVisible(false);
    setDescription('');
  };

  // --- Google Places Search (Autocomplete) ---
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
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

  const handleSelectPlace = async (placeId: string) => {
    try {
      const fields = "name,formatted_address,geometry,international_phone_number,website,rating,opening_hours";
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(detailsUrl);
      const data = await response.json();
      if (data.status === 'OK') {
        const details = data.result;
        const { lat, lng } = details.geometry.location;
        setMapRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
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
        setPlaceDetailsModalVisible(true);
        setSearchResults([]);
        setSearchQuery('');
      } else {
        console.error("Place details error:", data.status);
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };

  // Time & Date pickers for markers
  const onConfirmMarkerTime = ({ hours, minutes }: { hours: number; minutes: number }) => {
    setMarkerTime({ hours, minutes });
    setMarkerTimePickerVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          testID="searchPlaces"
          label="Search Places"
          value={searchQuery}
          onChangeText={handleSearch}
          mode="outlined"
          style={styles.searchInput}
        />
        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectPlace(item.place_id)}
                style={styles.searchResultItem}
              >
                <Text>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={styles.searchResultsList}
          />
        )}
      </View>

      <MapView
        testID="map"
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        onLongPress={handleMapLongPress}
        region={mapRegion}
      >
        {(currentTrip?.destinations || []).map((marker, index) => {
          // Convert lat/lng to numbers
          const lat = Number(marker.latitude);
          const lng = Number(marker.longitude);

          // Skip if lat/lng are invalid
          if (isNaN(lat) || isNaN(lng)) {
            console.warn(`Skipping marker at index ${index} - invalid coords:`, marker);
            return null;
          }

          return (
            <Marker
              key={index}
              coordinate={{ latitude: lat, longitude: lng }}
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
        {/* Modal for adding a new marker */}
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.card}>
            <Card.Title title="Add a New Marker" />
            <Card.Content>
              <Text style={styles.addressText}>{currMarker?.address}</Text>
              <TextInput
                testID="description"
                label="Description"
                value={description}
                mode="outlined"
                onChangeText={setDescription}
                style={styles.input}
              />

              {/* Optionally pick date/time for a new marker */}
              <Button testID="selectDate" onPress={() => setMarkerDatePickerVisible(true)}>
                {markerDate
                  ? `Date: ${markerDate.toDateString()}`
                  : "Select Date"
                }
              </Button>
              <DatePickerModal
                locale="en"
                mode="single"
                visible={markerDatePickerVisible}
                onDismiss={() => setMarkerDatePickerVisible(false)}
                date={markerDate || undefined}
                onConfirm={({ date }) => {
                  setMarkerDate(date);
                  setMarkerDatePickerVisible(false);
                }}
                // restrict selection to trip range if you want:
                validRange={{
                  startDate: tripStartDate || undefined,
                  endDate: tripEndDate || undefined,
                }}
              />

              <Button testID="selectTime" onPress={() => setMarkerTimePickerVisible(true)}>
                {markerTime
                  ? `Time: ${markerTime.hours}:${String(markerTime.minutes).padStart(2, '0')}`
                  : "Select Time"
                }
              </Button>
              <TimePickerModal
                testID="timePicker1"
                visible={markerTimePickerVisible}
                onDismiss={() => setMarkerTimePickerVisible(false)}
                onConfirm={onConfirmMarkerTime}
                hours={markerTime?.hours || 12}
                minutes={markerTime?.minutes || 0}
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
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.card}>
            <Card.Title title="Edit Destination" />
            <Card.Content>
              <Text style={styles.addressText}>{currMarker?.address}</Text>
              <TextInput
                label="Description"
                value={description}
                mode="outlined"
                onChangeText={setDescription}
                style={styles.input}
              />

              {/* Date/time pickers for editing */}
              <Button testID="editDate" onPress={() => setMarkerDatePickerVisible(true)}>
                {markerDate
                  ? `Date: ${markerDate.toDateString()}`
                  : "Select Date"
                }
              </Button>
              <DatePickerModal
                locale="en"
                mode="single"
                visible={markerDatePickerVisible}
                onDismiss={() => setMarkerDatePickerVisible(false)}
                date={markerDate || undefined}
                onConfirm={({ date }) => {
                  setMarkerDate(date);
                  setMarkerDatePickerVisible(false);
                }}
                validRange={{
                  startDate: tripStartDate || undefined,
                  endDate: tripEndDate || undefined,
                }}
              />

              <Button testID="editTime" onPress={() => setMarkerTimePickerVisible(true)}>
                {markerTime
                  ? `Time: ${markerTime.hours}:${String(markerTime.minutes).padStart(2, '0')}`
                  : "Select Time"
                }
              </Button>
              <TimePickerModal
                testID="timePicker2"
                visible={markerTimePickerVisible}
                onDismiss={() => setMarkerTimePickerVisible(false)}
                onConfirm={onConfirmMarkerTime}
                hours={markerTime?.hours || 12}
                minutes={markerTime?.minutes || 0}
              />
            </Card.Content>
            <Card.Actions>
              <Button testID="saveChanges" mode="contained" onPress={updateMarker}>
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
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.card}>
            <Card.Title title="Marker Details" />
            <Card.Content>
              <Text style={styles.addressText}>{currMarker?.address}</Text>
              <Text>Description: {currMarker?.description}</Text>
              {/* If marker has a date, show it */}
              {currMarker?.date && (
                <Text>Date: {new Date(currMarker.date).toLocaleString()}</Text>
              )}
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => setInfoModalVisible(false)}>
                Close
              </Button>
              <Button testID="editMarker" mode="outlined" onPress={showEditUI}>
                Edit
              </Button>
            </Card.Actions>
          </Card>
        </Modal>

        {/* Modal for detailed place information (from search) */}
        <Modal
          visible={placeDetailsModalVisible}
          onDismiss={() => setPlaceDetailsModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.card}>
            <Card.Title title={selectedPlaceDetails?.name || "Place Details"} />
            <Card.Content>
              <Text style={styles.addressText}>{selectedPlaceDetails?.address}</Text>
              {selectedPlaceDetails?.phone && (
                <Text>Phone: {selectedPlaceDetails.phone}</Text>
              )}
              {selectedPlaceDetails?.website && (
                <Text>Website: {selectedPlaceDetails.website}</Text>
              )}
              {selectedPlaceDetails?.rating && (
                <Text>Rating: {selectedPlaceDetails.rating}</Text>
              )}
            </Card.Content>
            <Card.Actions>
              <Button
                testID="closeInfoModal"
                mode="contained"
                onPress={() => setPlaceDetailsModalVisible(false)}
              >
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