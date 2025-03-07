import React, { useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button, Dialog, Portal } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';

const TripCreationScreen = () => {
  const [title, setTitle] = useState('');
  const [dateRange, setDateRange] = useState<{ startDate?: Date; endDate?: Date }>({});
  const [visible, setVisible] = useState(false);

  const onDismiss = () => setVisible(false);

  const onConfirm = (params: { startDate: Date; endDate: Date }) => {
    setDateRange(params);
    setVisible(false);
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput label="Trip Title" value={title} onChangeText={setTitle} mode="outlined" />

      <Button onPress={() => setVisible(true)} mode="outlined">
        {dateRange.startDate && dateRange.endDate
          ? `${dateRange.startDate.toDateString()} - ${dateRange.endDate.toDateString()}`
          : 'Select Dates'}
      </Button>

      <Portal>
        <DatePickerModal
          locale="en"
          mode="range"
          visible={visible}
          onDismiss={onDismiss}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onConfirm={onConfirm}
        />
      </Portal>

      <Button mode="contained" style={{ marginTop: 20 }}>
        Create Trip
      </Button>
    </View>
  );
};

export default TripCreationScreen;
