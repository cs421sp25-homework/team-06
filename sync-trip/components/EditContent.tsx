import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, TextInput, Button } from 'react-native-paper';

interface EditContentProps {
    address?: string;
    description: string;
    time: string;
    onChangeDescription: (text: string) => void;
    onChangeTime: (text: string) => void;
    onSave: () => void;
    onCancel: () => void;
}

const EditContent = React.memo(({
                                    address,
                                    description,
                                    time,
                                    onChangeDescription,
                                    onChangeTime,
                                    onSave,
                                    onCancel,
                                }: EditContentProps) => (
    <Card style={styles.card}>
        <Card.Title title="Edit Marker" />
        <Card.Content>
            <Text style={styles.addressText}>{address}</Text>
            <TextInput
                label="Description"
                value={description}
                mode="outlined"
                onChangeText={onChangeDescription}
                style={styles.input}
            />
            <TextInput
                label="Time (e.g., 10:30 AM)"
                value={time}
                mode="outlined"
                onChangeText={onChangeTime}
                style={styles.input}
            />
        </Card.Content>
        <Card.Actions>
            <Button mode="contained" onPress={onSave}>Save</Button>
            <Button mode="outlined" onPress={onCancel}>Cancel</Button>
        </Card.Actions>
    </Card>
));

const styles = StyleSheet.create({
    card: { width: '90%', padding: 10 },
    addressText: { fontSize: 14, marginBottom: 10, color: 'gray' },
    input: { marginBottom: 10 },
});

export default EditContent;
