import React, { useState } from 'react';
import {View} from 'react-native';
import { TextInput, Button, Dialog, Portal } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { useTrip } from "../context/TripContext";
import {CalendarDate} from "react-native-paper-dates/lib/typescript/Date/Calendar";
import { useMessageDialog } from '../components/MessageDialog'
import { useAppNavigation } from '../navigation/useAppNavigation';

const TripCreationScreen = () => {
    const navigation = useAppNavigation();
    const { showMessage } = useMessageDialog();

    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [visible, setVisible] = useState(false);

    const {setCurrentTrip} = useTrip();

    const onDismiss = () => setVisible(false);

    const onConfirm = (params: { startDate: CalendarDate ; endDate: CalendarDate }) => {
        setStartDate(params.startDate);
        setEndDate(params.endDate);
        setVisible(false);
    };

    const handleCreateTrip = () => {
        if (title && startDate && endDate) {
            setCurrentTrip({title, startDate, endDate, destinations:[]});
            navigation.navigate('App');
        } else {
            showMessage("please enter title and dates");
        }

    }

    return (
        <View style={{ padding: 20 }}>
            <TextInput label="Trip Title" value={title} onChangeText={setTitle} mode="outlined" />

            <Button onPress={() => setVisible(true)} mode="outlined">
                {startDate && endDate
                    ? `${startDate.toDateString()} - ${endDate.toDateString()}`
                    : 'Select Dates'}
            </Button>

            <Portal>
                <DatePickerModal
                    locale={"en"}
                    mode="range"
                    visible={visible}
                    onDismiss={onDismiss}
                    startDate={startDate}
                    endDate={endDate}
                    onConfirm={onConfirm}
                />
            </Portal>

            <Button mode="contained" style={{ marginTop: 20 }}
                    onPress={handleCreateTrip}>
                Create Trip
            </Button>
        </View>
    );
};

export default TripCreationScreen;
