import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';

interface ViewContentProps {
    address?: string;
    description: string;
    time: string;
    onEdit: () => void;
    onClose: () => void;
}

const ViewContent = React.memo(({
                                    address,
                                    description,
                                    time,
                                    onEdit,
                                    onClose,
                                }: ViewContentProps) => (
    <Card style={styles.card}>
        <Card.Title title="Marker Details" />
        <Card.Content>
            <Text style={styles.addressText}>{address}</Text>
            <Text>Description: {description || 'N/A'}</Text>
            <Text>Time: {time || 'N/A'}</Text>
        </Card.Content>
        <Card.Actions>
            <Button mode="contained" onPress={onEdit}>Edit</Button>
            <Button mode="outlined" onPress={onClose}>Close</Button>
        </Card.Actions>
    </Card>
));

const styles = StyleSheet.create({
    card: { width: '90%', padding: 10 },
    addressText: { fontSize: 14, marginBottom: 10, color: 'gray' },
});

export default ViewContent;
