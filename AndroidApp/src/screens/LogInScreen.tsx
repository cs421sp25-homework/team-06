import React, { useState } from 'react';
import { View, Image, TouchableOpacity, KeyboardAvoidingView, ScrollView } from 'react-native';
import { TextInput, Text, Button, Snackbar, ActivityIndicator, IconButton } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import loginStyles from '../styles/loginStyples';
import { useAppNavigation } from '../navigation/useAppNavigation';


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
            setSnackbarVisible(true);
        }

        setLoading(false);
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
                        <TouchableOpacity style={loginStyles.iconWarpper} onPress={() => console.log('Google pressed')}>
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
