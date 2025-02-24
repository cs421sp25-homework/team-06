import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { TextInput, Button, Text, Avatar, Snackbar } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const ProfileScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [travelPreferences, setTravelPreferences] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);

  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [savedProfile, setSavedProfile] = useState({
    name: '',
    bio: '',
    travelPreferences: '',
    profilePicture: null,
  });

  const availableImages = [
    { id: '1', src: require('../assets/profile_pic.png') },
    { id: '2', src: require('../assets/another_image.png') },
  ];

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();

            setName(data?.name || '');
            setBio(data?.bio || '');
            setTravelPreferences(data?.travelPreferences || '');
            setProfilePicture(data?.profilePicture || null);

            setSavedProfile({
              name: data?.name || '',
              bio: data?.bio || '',
              travelPreferences: data?.travelPreferences || '',
              profilePicture: data?.profilePicture || null,
            });

            if (data?.name) {
              setIsEditing(false);
            }
          }
        },
        (err) => {
          setError('Error fetching profile data');
          setSnackbarVisible(true);
        }
      );

    return () => unsubscribe();
  }, []);

  const handleSaveProfile = async () => {
    if (name.trim() === '') {
      setError('Name is required');
      setSnackbarVisible(true);
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      setError('User not logged in');
      setSnackbarVisible(true);
      return;
    }

    try {
      // If you plan to store a reference to the image, consider storing an identifier (e.g. image id)
      await firestore().collection('users').doc(user.uid).set(
        {
          name,
          bio,
          travelPreferences,
          profilePicture,
        },
        { merge: true }
      );

      setSavedProfile({
        name,
        bio,
        travelPreferences,
        profilePicture,
      });

      setError('Profile saved successfully!');
      setSnackbarVisible(true);
      setIsEditing(false);
    } catch (err) {
      setError('Error saving profile: ' + err.message);
      setSnackbarVisible(true);
    }
  };

  const handleCancelEdit = () => {
    setName(savedProfile.name);
    setBio(savedProfile.bio);
    setTravelPreferences(savedProfile.travelPreferences);
    setProfilePicture(savedProfile.profilePicture);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.navigate('Home');
    } catch (err) {
      setError('Error logging out');
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Avatar.Image
          size={100}
          source={
            profilePicture
              ? profilePicture
              : require('../assets/profile_pic.png')
          }
        />
      </TouchableOpacity>

      {isEditing ? (
        <>
          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            style={styles.input}
            multiline
          />
          <TextInput
            label="Travel Preferences"
            value={travelPreferences}
            onChangeText={setTravelPreferences}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSaveProfile}
            style={styles.button}
          >
            Save Profile
          </Button>

          <Button
            mode="outlined"
            onPress={handleCancelEdit}
            style={styles.button}
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Text style={styles.label}>Name: {name}</Text>
          <Text style={styles.label}>Bio: {bio}</Text>
          <Text style={styles.label}>Travel Preferences: {travelPreferences}</Text>

          <Button
            mode="contained"
            onPress={() => setIsEditing(true)}
            style={styles.button}
          >
            Edit
          </Button>
        </>
      )}

      <Button mode="outlined" onPress={handleLogout} style={styles.button}>
        Log Out
      </Button>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {error}
      </Snackbar>

      {/* Modal for selecting a profile picture from assets */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <FlatList
            data={availableImages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setProfilePicture(item.src);
                  setModalVisible(false);
                }}
              >
                <Avatar.Image
                  size={100}
                  source={item.src}
                  style={styles.modalImage}
                />
              </TouchableOpacity>
            )}
            numColumns={3}
          />
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
  label: {
    fontSize: 18,
    marginVertical: 5,
  },
  modalView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalImage: {
    margin: 10,
  },
});

export default ProfileScreen;