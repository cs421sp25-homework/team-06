import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Portal } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { useTrip } from "../context/TripContext";
import { CalendarDate } from "react-native-paper-dates/lib/typescript/Date/Calendar";
import { useMessageDialog } from '../components/MessageDialog';
import { useAppNavigation, useTabs } from '../navigation/useAppNavigation';

const TripCreationScreen = () => {
    const navigation = useAppNavigation();
    const { showMessage } = useMessageDialog();

    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState<CalendarDate>(undefined);
    const [endDate, setEndDate] = useState<CalendarDate>(undefined);
    const [visible, setVisible] = useState(false);

    const { setCurrentTrip } = useTrip();
    const { setTabIndex } = useTabs();

    const onDismiss = () => setVisible(false);

    const openDatePicker = () => {
        setVisible(false); // Force reset
        setTimeout(() => setVisible(true), 10); // Small delay ensures state updates
    };

    const onConfirm = (params: { startDate: CalendarDate; endDate: CalendarDate }) => {
        setStartDate(params.startDate);
        setEndDate(params.endDate);
        setVisible(false);
    };

    const handleCreateTrip = () => {
        if (title && startDate && endDate) {
            setCurrentTrip({ title, startDate, endDate, destinations: [] });
            //navigation.navigate('App');
            setTabIndex(1);
        } else {
            showMessage("Please enter a title and select dates.");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.form}>
                <TextInput
                    label="Trip Title"
                    value={title}
                    onChangeText={setTitle}
                    mode="outlined"
                    style={styles.input}
                />

                <Button onPress={openDatePicker} mode="outlined" style={styles.input}>
                    {startDate && endDate
                        ? `${startDate.toDateString()} - ${endDate.toDateString()}`
                        : 'Select Dates'}
                </Button>

                {/*<Portal>*/}
                    <DatePickerModal
                        locale={"en"}
                        mode="range"
                        visible={visible}
                        onDismiss={onDismiss}
                        startDate={startDate}
                        endDate={endDate}
                        onConfirm={onConfirm}
                    />
                {/*</Portal>*/}

                <Button mode="contained" onPress={handleCreateTrip}>
                    Create Trip
                </Button>
            </View>
        </View>
    );
};

export default TripCreationScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9F9F9', // Light background for better contrast
    },
    form: {
        width: '90%',
        maxWidth: 400, // Keep it from getting too wide
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        elevation: 3, // Adds a shadow effect
    },
    input: {
        marginBottom: 15,
    },
});
