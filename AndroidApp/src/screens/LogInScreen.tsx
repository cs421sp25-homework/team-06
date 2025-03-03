import React, {useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, KeyboardAvoidingView, ScrollView } from 'react-native';
import { TextInput, Text, Button, Snackbar, ActivityIndicator, IconButton } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import loginStyles from '../styles/loginStyples';
import { useAppNavigation } from '../navigation/useAppNavigation';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const LogInScreen = ({ }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useAppNavigation();

    const handleLogIn = async () => {
        setLoading(true);

        try {
            const userCredential = await auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                await auth().signOut();
                setMessage('Please verify your email before logging in.');
                setSnackbarVisible(true);
                return;
            }

            setMessage('Login successful!');
            setSnackbarVisible(true);
            navigation.navigate('App'); // 导航到用户主页
        } catch (err) {
            setMessage((err as Error).message);
            console.error('Google Signin Error: ', err);
            setSnackbarVisible(true);
        }

        setLoading(false);
    };

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '902651100900-eira13inc6alf5d9jqs7t4q38v4hutjc.apps.googleusercontent.com', // Web Client ID from Firebase
        });
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            console.log('Checking Play Services...');
            await GoogleSignin.hasPlayServices();

            await GoogleSignin.signOut(); // Ensure fresh account selection

            console.log('Signing in...');
            const userInfo = await GoogleSignin.signIn();
            console.log('Google Sign-In response:', userInfo);

            // Extract the idToken from userInfo.data
            const idToken = userInfo.data?.idToken;
            if (!idToken) {
                throw new Error('No ID Token received');
            }

            const googleCredential = auth.GoogleAuthProvider.credential(idToken);
            console.log('Authenticating with Firebase...');
            await auth().signInWithCredential(googleCredential);

            console.log('Google Sign-In Successful!');
            setMessage('Google Sign-In Successful!');
            setSnackbarVisible(true);
            navigation.navigate('App');
        } catch (error: any) {
            console.error('Google Sign-In Error:', error);
            Alert.alert('Error', error.message || 'Unknown error');
            setMessage(error.message || 'Unknown error');
            setSnackbarVisible(true);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setMessage('Please enter your email first');
            setSnackbarVisible(true);
            return;
        }
        try {
            await auth().sendPasswordResetEmail(email);
            setMessage('A password reset email has been sent');
            setSnackbarVisible(true);
        } catch (error: any) {
            setMessage(error.message);
            setSnackbarVisible(true);
        }
    };

    return (
        <KeyboardAvoidingView style={loginStyles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <Image source={require('../assets/logInBackground.jpg')} style={loginStyles.backgroundImage} />

                <View style={loginStyles.overlay}>
                    <Text variant="headlineLarge" style={loginStyles.title}>
                        Let's <Text style={loginStyles.highlight}>Get</Text> Started!
                    </Text>

                    <Text variant="bodyMedium" style={loginStyles.subtitle}>
                        Discover the World with Every Sign In
                    </Text>

                    <TextInput
                        label="Email"
                        mode="outlined"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        theme={loginStyles.textInput}
                    />

                    <TextInput
                        label="Password"
                        mode="outlined"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        theme={loginStyles.textInput}
                    />

                    <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={loginStyles.forgotPassword}>Forgot password?</Text>
                    </TouchableOpacity>

                    {loading ? (
                        <ActivityIndicator animating={true} size="large" color="#007A8C" />
                    ) : (
                        <Button mode="contained" onPress={handleLogIn} style={loginStyles.signInButton}>
                            Sign In
                        </Button>
                    )}

                    <View style={loginStyles.dividerContainer}>
                        <View style={loginStyles.line} />
                        <Text style={loginStyles.orText}>or sign in with</Text>
                        <View style={loginStyles.line} />
                    </View>

                    <View style={loginStyles.socialIconsContainer}>
                        <TouchableOpacity style={loginStyles.iconWarpper} onPress={handleGoogleSignIn}>
                            <IconButton icon="google" size={30}/>
                        </TouchableOpacity>
                    </View>

                    <Text style={loginStyles.noAccount}>I don’t have an account?</Text>
                </View>

                <View>

                    <Button mode="outlined" onPress={() => navigation.navigate('SignUp')} style={loginStyles.signUpButton}>
                        <Text style={loginStyles.signUpText}>Sign Up</Text>
                    </Button>

                    <Snackbar
                        visible={snackbarVisible}
                        onDismiss={() => setSnackbarVisible(false)}
                        duration={3000}
                    >
                        {message}
                    </Snackbar>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default LogInScreen;
