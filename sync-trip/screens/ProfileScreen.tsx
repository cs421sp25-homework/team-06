import { auth, firestore, getUserDocRef } from "../utils/firebase";
import { deleteDoc, onSnapshot, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, ScrollView } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Avatar,
  Snackbar,
  Menu,
  Divider,
  Portal,
  Dialog,
  Paragraph,
} from 'react-native-paper';

import { useAppNavigation } from '../navigation/useAppNavigation';

const ProfileScreen = () => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [travelPreferences, setTravelPreferences] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);

  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [avatarCenterY, setAvatarCenterY] = useState<number | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const offset = 100;
  // Use the hook to get navigation if needed:
  const navigation = useAppNavigation();

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

  // travel preference options
  const travelPreferenceOptions = [
    'N/A',
    'Leisurely',
    'Gastronomic',
    'Family-Friendly',
    'Eco-Friendly',
    'Luxury',
    'Budget-Conscious',
  ];


  useEffect(() => {
    if (!auth.currentUser) return;

    const userDocRef = getUserDocRef();

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists) {
          const data = docSnap.data();
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
        console.error(err);
        setSnackbarVisible(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // save profile
  const handleSaveProfile = async () => {
    if (name.trim() === '') {
      setError('Name is required');
      setSnackbarVisible(true);
      return;
    }

    try {
      const userDocRef = getUserDocRef();
      await setDoc(userDocRef, {
        ownerId: auth.currentUser.uid,
        name,
        bio,
        travelPreferences,
        profilePicture,
        updatedAt: serverTimestamp(),

      }, { merge: true });

      setSavedProfile({ name, bio, travelPreferences, profilePicture });
      setError('Profile saved successfully!');
      setSnackbarVisible(true);
      setIsEditing(false);
    } catch (err) {
      setError('Error saving profile: ' + (err as Error).message);
      setSnackbarVisible(true);
    }
  };

  // cancel editing
  const handleCancelEdit = () => {
    setName(savedProfile.name);
    setBio(savedProfile.bio);
    setTravelPreferences(savedProfile.travelPreferences);
    setProfilePicture(savedProfile.profilePicture);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.navigate('Login');
    } catch (err) {
      setError('Error logging out');
      console.log(err);
      setSnackbarVisible(true);
    }
  };

  // account deletion action
  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('No user logged in');
      setSnackbarVisible(true);
      return;
    }
    try {
      setDeleteDialogVisible(false);
      // delete stored date in firebase
      const userDocRef = getUserDocRef();
      await deleteDoc(userDocRef);
      // delete account
      await user.delete();
      // navigate to home once deletion successful
      navigation.navigate('Home');
    } catch (err) {
      setError('Error deleting account: ' + (err as Error).message);
      setSnackbarVisible(true);
    }
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  return (
    <ScrollView testID="profileScreen" contentContainerStyle={styles.outerContainer}>
      <View style={styles.root}>
        {/* background layer */}
        {avatarCenterY !== null && (
          <>
            <View style={[styles.topBackground, { height: avatarCenterY }]} />
            <View style={[styles.bottomBackground, { top: avatarCenterY }]} />
          </>
        )}

        {/* content layer */}
        <View style={styles.container}>
          {/* avatar container */}
          <View
            style={styles.avatarContainer}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              setAvatarCenterY(layout.y + layout.height / 2 + offset);
            }}>
            {isEditing ? (
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Avatar.Image
                  size={100}
                  source={profilePicture ? profilePicture : require('../assets/profile_pic.png')}
                />
              </TouchableOpacity>
            ) : (
              <Avatar.Image
                size={100}
                source={profilePicture ? profilePicture : require('../assets/profile_pic.png')}
              />
            )}
          </View>

          {isEditing ? (
            <>
              <TextInput testID="name" label="Name" value={name} onChangeText={setName} style={styles.input} />
              <TextInput
                testID="bio"
                label="Bio"
                value={bio}
                onChangeText={setBio}
                style={styles.input}
                multiline
              />
              {/* Travel Preferences drop down */}
              <View style={{ width: '100%' }}>
                <Menu
                  visible={menuVisible}
                  onDismiss={closeMenu}
                  anchor={
                    <TouchableOpacity onPress={openMenu}>
                      <TextInput
                        testID="travelPreferences"
                        label="Travel Preferences"
                        value={travelPreferences}
                        style={styles.input}
                        editable={false}
                        pointerEvents="none"
                      />
                    </TouchableOpacity>
                  }>
                  {travelPreferenceOptions.map((option) => (
                    <Menu.Item
                      key={option}
                      onPress={() => {
                        setTravelPreferences(option);
                        closeMenu();
                      }}
                      title={option}
                    />
                  ))}
                </Menu>
              </View>
              <Button
                testID="save_profile"
                mode="contained"
                onPress={handleSaveProfile}
                style={[styles.button, { marginTop: '4%' }]}>
                Save Profile
              </Button>
              <Button mode="outlined" onPress={handleCancelEdit} style={styles.button}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>Name:</Text>
                <Text style={styles.infoContent}>{name}</Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>Bio:</Text>
                <Text style={styles.infoContent}>{bio}</Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>Travel Preferences:</Text>
                <Text style={styles.infoContent}>{travelPreferences}</Text>
              </View>
              <Divider style={styles.divider} />
              <Button
                testID="profile_edit"
                mode="contained"
                onPress={() => setIsEditing(true)}
                style={[styles.button, { marginTop: '20%' }]}>
                Edit
              </Button>
            </>
          )}
          <Button testID="logout" mode="outlined" onPress={handleLogout} style={styles.button}>
            Log Out
          </Button>
          {/* delete account button */}
          <Button
            mode="contained"
            buttonColor="#D32F2F" // dark red button
            onPress={() => setDeleteDialogVisible(true)}
            style={styles.button}>
            Delete Account
          </Button>
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}>
            {error}
          </Snackbar>
          {/* Modal select avatar */}
          <Modal
            animationType="slide"
            transparent
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}>
            <View style={styles.modalView}>
              <FlatList
                data={availableImages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setProfilePicture(item.src);
                      setModalVisible(false);
                    }}>
                    <Avatar.Image size={100} source={item.src} style={styles.modalImage} />
                  </TouchableOpacity>
                )}
                numColumns={3}
              />
              <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            </View>
          </Modal>

          {/* Acc deletion dialog */}
          <Portal>
            <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
              <Dialog.Title style={styles.dialogTitle}>
                <Avatar.Icon icon="alert" size={24} style={styles.warningIcon} /> Confirm Account
                Deletion
              </Dialog.Title>
              <Dialog.Content>
                <Paragraph>
                  Are you sure you want to delete your account? This action cannot be undone.
                </Paragraph>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
                <Button onPress={handleDeleteAccount}>Confirm</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'gray',
  },
  bottomBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
    alignItems: 'center',
    marginTop: 100,
  },
  outerContainer: {
    padding: 0,
  },
  avatarContainer: {},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  infoTitle: {
    width: 200,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
    fontSize: 18,
  },
  input: {
    width: '100%',
    marginBottom: 5,
    marginTop: 5,
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
    padding: 10,
  },
  modalImage: {
    margin: 10,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 5,
  },
  dialogTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    marginRight: 8,
  },
});

export default ProfileScreen;
