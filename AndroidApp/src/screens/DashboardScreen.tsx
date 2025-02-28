import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DashboardScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.placeholderText}>
                This is your dashboard placeholder. You can add trip summaries,
                upcoming activities, or any overview information you’d like to show here.
            </Text>
        </View>
    );
};

export default DashboardScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        marginBottom: 12,
    },
    placeholderText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#555',
    },
});
