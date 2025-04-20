import * as Location from 'expo-location';
import Constants from 'expo-constants';
import React, { useEffect, useState, useRef } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Polyline, LongPressEvent, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { ActivityIndicator, Button, Card, Modal, Portal, Text, TextInput, IconButton } from 'react-native-paper';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Destination, DestinationInfo, LatLng } from "../types/Destination";
import { useTrip } from "../context/TripContext";
import { useTabs } from "../navigation/useAppNavigation";
import { useUser } from "../context/UserContext";
import { deleteDestinationInTrip } from '../utils/tripAPI'; // or wherever your timestamp => Date converter is
import { convertTimestampToDate } from '../utils/dateUtils';
import { getInfoFromPlaceId, getPlaceFromCoordinates, getRoute, decodePolyline, getAddressFromCoordinates, getCoordinatesFromAddress } from '../utils/map';

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
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [fetchedPlaceDetails, setFetchedPlaceDetails] = useState<DestinationInfo | null>(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false); // Viewing marker details
  const [currMarker, setCurrMarker] = useState<Destination | null>(null);

  // State for (re)setting marker details
  const [description, setDescription] = useState('');
  const [markerName, setMarkerName] = useState('');
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
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<DestinationInfo | null>(null);
  const [placeDetailsModalVisible, setPlaceDetailsModalVisible] = useState(false);

  // We'll store the trip's start/end date in local states
  const [tripStartDate, setTripStartDate] = useState<Date | null>(null);
  const [tripEndDate, setTripEndDate] = useState<Date | null>(null);

  const [origin, setOrigin] = useState<LatLng | null>(null)
  const [destination, setDestination] = useState<LatLng | null>(null)
  // 2) Travel mode: DRIVE, WALK, BICYCLE, or TRANSIT
  type TravelMode = 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT'
  const [travelMode, setTravelMode] = useState<TravelMode>('DRIVE')
  // 3) Departure time as ISO string (you can hook this up to a DatePicker)
  const [departureTime, setDepartureTime] = useState<string>('')
  // 4) Decoded route coordinates for your Polyline
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([])

  const mapRef = useRef<MapView | null>(null)
  const [routePlanningMode, setRoutePlanningMode] = useState(false)
  const [originText, setOriginText] = useState('')
  const [destinationText, setDestinationText] = useState('')

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

  useEffect(() => {
    if (routeCoords.length && mapRef.current) {
      mapRef.current.fitToCoordinates(routeCoords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true
      })
    }
  }, [routeCoords])

  // Navigate user to the 'New Trip' tab if they have no current trip
  const redirectToNewTrip = () => {
    setTabIndex(2);
    setDialogVisible(false);
  };

  const handlePlanRoute = async () => {
    // TODO: convert originText/destinationText into LatLng,
    // e.g. via a geocoding helper you already have.
    const origin: LatLng | null = await getCoordinatesFromAddress(originText)
    const destination: LatLng | null = await getCoordinatesFromAddress(destinationText)

    if (!origin || !destination) {
        Alert.alert('Error', 'Please enter valid origin and destination addresses.')
    }
    const encoded = await getRoute(origin, destination, travelMode)
    setRouteCoords(decodePolyline(encoded))
    setRoutePlanningMode(false)
  }

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
    const response = await getPlaceFromCoordinates(latitude, longitude);
    if (response != null) {
      // Instead of directly opening the add marker modal, store the fetched details
      setFetchedPlaceDetails(response);

      // Prepare a marker object
      setCurrMarker({
        latitude: response.latitude,
        longitude: response.longitude,
        place_id: response.place_id,
        address: response.address,
        name: '',
        description: '',
        createdByUid: getCurrentUserId()
      });
    }
    setDescription('');
    setMarkerName('');
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
      name: markerName,
      description: description,
      date: finalDate || null, // store the combined date/time
    };

    try {
      await addDestinationToTrip(newDestination);
      setModalVisible(false);
      setDescription('');
      setMarkerName('');
    } catch (error) {
      console.error("Error adding destination:", error);
      Alert.alert("Error", "Failed to add destination. Please try again.");
    }
  };

  const handleMarkDestination = () => {
    // Reset any marker-related inputs
    setMarkerName('');
    setDescription('');
    setMarkerDate(null);
    setMarkerTime(null);
    let marker = null;
    if (fetchedPlaceDetails) {
      marker = {
        latitude: fetchedPlaceDetails.latitude,
        longitude: fetchedPlaceDetails.longitude,
        place_id: fetchedPlaceDetails.place_id,
        address: fetchedPlaceDetails.address,
        description: '',
        createdByUid: getCurrentUserId()
      }
      setFetchedPlaceDetails(null);
    }
    if (selectedPlaceDetails) {
      marker = {
        latitude: selectedPlaceDetails.latitude,
        longitude: selectedPlaceDetails.longitude,
        place_id: selectedPlaceDetails.place_id,
        address: selectedPlaceDetails.address,
        description: '',
        createdByUid: getCurrentUserId()
      }
      setSelectedPlaceDetails(null);
    }
    setCurrMarker(marker);

    // Close the bottom sheet and open the marker creation modal
    setPlaceDetailsModalVisible(false);
    setBottomSheetVisible(false);
    setModalVisible(true);
  };

  const showDetailedInfo = async () => {
    if (currMarker != null) {
      const details = await getInfoFromPlaceId(currMarker.place_id);
      console.log("Place details:", details);
      setFetchedPlaceDetails(details)
      setModalVisible(false);
      setBottomSheetVisible(true);
    }
  };

  // Helper to get today's (or next day’s) opening hours text
  const getOpeningHoursForToday = (weekdayText: string[], open_now: boolean) => {
    // JavaScript getDay() returns 0 for Sunday, 1 for Monday, … 6 for Saturday.
    // Assuming weekdayText[0] corresponds to Monday, convert:
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    // If the place is open now, show today's hours; otherwise, show the next day's hours.
    const indexToShow = open_now ? todayIndex : (todayIndex + 1) % 7;
    return weekdayText[indexToShow] || "No hours available";
  };

  // Helper to render rating as stars (full, half, and empty)
  const renderStars = (rating: number | undefined) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<MaterialCommunityIcons key={`full-${i}`} name="star" size={20} color="#4CAF50" />);
    }
    if (halfStar) {
      stars.push(<MaterialCommunityIcons key="half" name="star-half" size={20} color="#4CAF50" />);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<MaterialCommunityIcons key={`empty-${i}`} name="star-outline" size={20} color="#4CAF50" />);
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
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
    setMarkerName(currMarker.name || '');
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
    if (!currMarker || !description.trim() || !markerName.trim()) {
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
        name: markerName,
        description: description,
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

    const handleDeleteDestination = async () => {
      const markerId = (currMarker as any).id;
      if (!markerId) {
        Alert.alert("Error", "Destination missing ID.");
        return;
      }
      Alert.alert(
        "Delete Destination",
        "Are you sure you want to delete this destination?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              if (!currentTrip.id) throw new Error("currentTrip missing ID");
              await deleteDestinationInTrip(currentTrip.id, markerId);
              setInfoModalVisible(false)
            },
          },
        ]
      );
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
      const response = await getInfoFromPlaceId(placeId);
      if (response != null) { }
      setMapRegion({
        latitude: response.latitude,
        longitude: response.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setSelectedPlaceDetails(response);
      setPlaceDetailsModalVisible(true);
      setSearchResults([]);
      setSearchQuery('');
    }
    catch (error) {
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
        ref={mapRef}
        testID="map"
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        onLongPress={handleMapLongPress}
        region={mapRegion}
      >
        {/* Existing destination markers */}
        {(currentTrip?.destinations || []).map((marker, index) => {
          const lat = Number(marker.latitude)
          const lng = Number(marker.longitude)
          if (isNaN(lat) || isNaN(lng)) {
            console.warn(`Skipping marker at index ${index} - invalid coords:`, marker)
            return null
          }
          const isCreatedByCurrentUser = marker.createdByUid === getCurrentUserId()
          const pinColor = isCreatedByCurrentUser ? 'red' : 'green'
          return (
            <Marker
              key={index}
              coordinate={{ latitude: lat, longitude: lng }}
              description={`${marker.description}\nDate: ${marker.date}`}
              pinColor={pinColor}
              onPress={() => handleMarkerPress(marker)}
            />
          )
        })}

        {routePlanningMode && (
          <View style={styles.routeInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Start point"
              value={originText}
              onChangeText={setOriginText}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Destination"
              value={destinationText}
              onChangeText={setDestinationText}
            />
            <View style={styles.buttonRow}>
              <IconButton icon="search" onPress={handlePlanRoute} />
              <IconButton
                icon="Cancel"
                onPress={() => setRoutePlanningMode(false)}
              />
            </View>
          </View>
        )}

        {/* Route polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="#3366FF"
            geodesic={true}
          />
        )}
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
            <Card.Title title="Add a New Marker" right={props => (
              <IconButton
                {...props}
                testID="closeInfo"
                icon="close"
                onPress={() => setModalVisible(false)}
              />
            )}
            />
            <Card.Content>
              <Text style={styles.addressText}>{currMarker?.address}</Text>
              <TextInput
                testID="markerName"
                label="Name"
                value={markerName}
                mode="outlined"
                onChangeText={setMarkerName}
                style={styles.input}
              />
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
                previous= 'Previous'
                next= {'Next', testID="nextMonth"}
                date={markerDate || tripStartDate}
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
              <IconButton icon="check" mode="contained" onPress={saveNewMarker}
              />
              <IconButton
                testID="showInfo" mode="contained" icon="information" onPress={showDetailedInfo}
              />

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
            <Card.Title
              title="Edit Destination"
              right={props => (
                <IconButton
                  {...props}
                  testID="closeInfo"
                  icon="close"
                  onPress={() => setModalVisible(false)}
                />
              )}
            />
            <Card.Content>
                  <Text style={styles.addressText}>{currMarker?.address}</Text>
                  <TextInput
                    testID="editMarkerName"
                    label="Name"
                    value={markerName}
                    mode="outlined"
                    onChangeText={setMarkerName}
                    style={styles.input}
                  />
                  <TextInput
                    testID="editDescription"
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
                date={markerDate || tripStartDate}
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
              <IconButton
                icon="check" testID="saveChanges" mode="contained" onPress={updateMarker}
              />

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
            <Card.Title title="Marker Details"
              right={props => (
                <IconButton
                  {...props}
                  testID="closeInfo"
                  icon="close"
                  onPress={() => setInfoModalVisible(false)}
                />
              )}
            />
            <Card.Content>
              <Text style={styles.addressText}>{currMarker?.address}</Text>
              <Text>Name: {currMarker?.name}</Text>
              <Text>Description: {currMarker?.description}</Text>
              {/* If marker has a date, show it */}
              {currMarker?.date && (
                <Text>Date: {new Date(currMarker.date).toLocaleString()}</Text>
              )}
            </Card.Content>
            <Card.Actions>
              <IconButton
                testID="showInfo" mode="contained" icon="information" onPress={showDetailedInfo}
              />
              <IconButton
                testID="editMarker" icon="pencil" onPress={showEditUI}
              />
              <IconButton
                testID="trash"
                icon="trash-can"
                onPress={() => handleDeleteDestination()}
              />
            </Card.Actions>
          </Card>
        </Modal>

        {/* Modal for detailed place information (from search) */}
        <Modal
          visible={placeDetailsModalVisible}
          onDismiss={() => setPlaceDetailsModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}
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
                <View style={styles.ratingContainer}>
                  {renderStars(selectedPlaceDetails.rating)}
                  <Text style={styles.ratingText}>{selectedPlaceDetails.rating.toFixed(1)}</Text>
                </View>
              )}
              {selectedPlaceDetails?.openingHours && (
                <View style={styles.openingHoursContainer}>
                  <Text style={{
                    color: selectedPlaceDetails.openingHours.open_now ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
                    {selectedPlaceDetails.openingHours.open_now ? 'Open Now' : 'Closed'}
                  </Text>
                  <Text style={styles.weekdayText}>
                    {getTodayOpeningHours(selectedPlaceDetails.openingHours.weekday_text)}
                  </Text>
                </View>
              )}
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => setPlaceDetailsModalVisible(false)}>
                Close
              </Button>
              <Button testID="markPlace" mode="outlined" onPress={handleMarkDestination}>
                Mark This Place
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
        <Modal
          visible={bottomSheetVisible}
          onDismiss={() => setBottomSheetVisible(false)}
          contentContainerStyle={[styles.modalContainer, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}
        >
          <Card style={styles.card}>
            <Card.Title title={fetchedPlaceDetails?.name || "Place Details"} />
            <Card.Content>
              <Text style={styles.addressText}>{fetchedPlaceDetails?.address}</Text>
              <Text style={styles.infoText}>Phone: {fetchedPlaceDetails?.phone || "N/A"}</Text>
              <Text style={styles.infoText}>Website: {fetchedPlaceDetails?.website || "N/A"}</Text>
              {fetchedPlaceDetails?.openingHours && (
                <View style={styles.openingHoursContainer}>
                  {fetchedPlaceDetails.openingHours.open_now ? (
                    <Text style={[styles.openStatus, { color: 'green' }]}>Open Now</Text>
                  ) : (
                    <Text style={[styles.openStatus, { color: 'red' }]}>Closed Now</Text>
                  )}
                  <Text style={styles.infoText}>
                    {getOpeningHoursForToday(fetchedPlaceDetails.openingHours.weekday_text, fetchedPlaceDetails.openingHours.open_now)}
                  </Text>
                </View>
              )}
              <View style={styles.ratingContainer}>
                {renderStars(fetchedPlaceDetails?.rating)}
                <Text style={styles.ratingText}>
                  {fetchedPlaceDetails?.rating ? fetchedPlaceDetails.rating.toFixed(1) : "No Rating"}
                </Text>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={handleMarkDestination}>
                Mark This Place
              </Button>
              <Button mode="outlined" onPress={() => setBottomSheetVisible(false)}>
                Cancel
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
  routeInputContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 4,
  },
  textInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
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
  infoText: {
    fontSize: 14,
    marginBottom: 5,
  },
  openingHoursContainer: {
    marginVertical: 5,
  },
  openStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
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
