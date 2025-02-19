import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import auth from '@react-native-firebase/auth';

const FirebaseTest = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState(null);

    // Sign-Up Function
    const signUp = async () => {
        auth()
            .createUserWithEmailAndPassword(email, password)
            .then(() => {
                console.log('User account created & signed in!');
            })
            .catch(error => {
                if (error.code === 'auth/email-already-in-use') {
                    console.log('That email address is already in use!');
                }

                if (error.code === 'auth/invalid-email') {
                    console.log('That email address is invalid!');
                }

                console.error(error);
            });
    };

        // Sign-In Function
        const signIn = async () => {
            try {
                await auth().signInWithEmailAndPassword(email, password);
                console.log('User signed in');
                setMsg('User ' + email + ' signed in');
            } catch (err) {
                setMsg(err.message);
            }
        };


        const getCurrentUser = async () => {
            auth().onAuthStateChanged((user) => {
                if (user) {
                    // docs for a list of available properties
                    // https://firebase.google.com/docs/reference/js/v8/firebase.User
                    var uid = user.uid;
                } else {
                    // User is signed out, actions needed
                }
            })
        }

        return (
            <View>
                <Text>Sign Up / Sign In</Text>
                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    placeholder="Password"
                    value={password}
                    secureTextEntry
                    onChangeText={setPassword}
                />
                <Button title="Sign Up" onPress={signUp} />
                <Button title="Sign In" onPress={signIn} />
                {msg && <Text>{msg}</Text>}
            </View>
        );
    };

    export default FirebaseTest;
