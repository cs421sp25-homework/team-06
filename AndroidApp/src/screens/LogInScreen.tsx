import React, {useState} from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Snackbar, ActivityIndicator } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

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
        <View style={styles.container}>

            <Text style={styles.title}> Log in </Text>

            <TextInput
                label="Email"
                mode="outlined"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
            />

            <TextInput
                label="Password"
                mode="outlined"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
            />


            {loading ? (
                <ActivityIndicator animating={true} size="large" />
            ) : (
                <Button mode="contained" onPress={handleLogIn} style={styles.button}>
                    Log In
                </Button>
            )}

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
            >
                {message}
            </Snackbar>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        marginBottom: 15,
    },
    button: {
        marginTop: 10,
    }
});

export default LogInScreen;