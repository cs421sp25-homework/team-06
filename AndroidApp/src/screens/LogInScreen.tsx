import React, {useEffect, useState} from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
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

    return (
        <View style={loginStyles.container}>
            <Image source={require('../assets/logInBackground.jpg')} style={loginStyles.backgroundImage} />

            <View style={loginStyles.overlay}>
                <Text variant="headlineLarge" style={loginStyles.title}>
                    Let's <Text style={loginStyles.highlight}>Get</Text> Started!
                </Text>

                {/*<Text variant="bodyMedium" style={loginStyles.subtitle}>*/}
                {/*    Discover the World with Every Sign In*/}
                {/*</Text>*/}

                <TextInput
                    label="Email"
                    mode="outlined"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={loginStyles.input}
                />

                <TextInput
                    label="Password"
                    mode="outlined"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={loginStyles.input}
                />

                <TouchableOpacity>
                    <Text style={loginStyles.forgotPassword}>Forgot password?</Text>
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator animating={true} size="large" color="#007A8C" />
                ) : (
                    <Button mode="contained" onPress={handleLogIn} style={loginStyles.signInButton}>
                        Sign In
                    </Button>
                )}

                <Text style={loginStyles.orText}>or sign in with</Text>

                <View style={loginStyles.socialIcons}>
                    <TouchableOpacity>
                        <IconButton icon="google" size={30} onPress={handleGoogleSignIn} />
                        <IconButton icon="github" size={30} onPress={() => {}} />
                    </TouchableOpacity>
                </View>

                <Text style={loginStyles.noAccount}>I don’t have an account?</Text>

                <Button mode="outlined" onPress={() => navigation.navigate('SignUp')} style={loginStyles.signUpButton}>
                    Sign Up
                </Button>

                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={3000}
                >
                    {message}
                </Snackbar>
            </View>
        </View>
    );
};

export default LogInScreen;
