import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import auth from '@react-native-firebase/auth';

const FirebaseTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);

  // Sign-Up Function
  const signUp = async () => {
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      console.log('User signed up');
      setMsg('User' + email + ' signed up');
    } catch (err) {
      setMsg(err.message);
    }
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
