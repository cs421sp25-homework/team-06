import React, {useState} from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { TextInput, Text, Button, Snackbar, ActivityIndicator, IconButton } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import loginStyles from '../styles/loginStyples';

type LogInScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LogInScreenNavigationProp;
};

const LogInScreen: React.FC<Props> = ({ navigation }) => {

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [snackbarVisible, setSnackbarVisible] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogIn = async () => {

        setLoading(true);

        try {
            await auth().signInWithEmailAndPassword(email, password);
            setMessage('Login successful!');
            setSnackbarVisible(true);

            navigation.navigate('Home');

        } catch (err) {
            setMessage( (err as Error).message );
            setSnackbarVisible(true);
        }

        setLoading(false);
    };

    return (
        <View style={loginStyles.container}>

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
                        <IconButton icon="google" size={30} onPress={() => {}} />
                        <IconButton icon="apple" size={30} onPress={() => {}} />
                        <IconButton icon="facebook" size={30} onPress={() => {}} />
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
