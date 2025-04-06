/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
    ActivityIndicator,
    Card,
    Text,
    Title,
    Button,
    Portal,
    Dialog,
    TextInput,
  } from "react-native-paper";
import Markdown from "react-native-markdown-display";
import { useTrip } from "../context/TripContext";

const AttentionScreen = () => {
    const {
        currentTrip,
        attentions,
        createAttention,
        updateAttention,
        deleteAttention,
    } = useTrip();

    const [isAddDialogVisible, setAddDialogVisible] = useState(false);
    const [isEditDialogVisible, setEditDialogVisible] = useState(false);
    const [currentAttentionText, setCurrentAttentionText] = useState("");
    const [currentAttentionId, setCurrentAttentionId] = useState<string | null>(
    null
    );

    const [error, setError] = useState<string | null>(null);

    if (!currentTrip) {
        return (
          <View style={styles.centeredContainer}>
            <Title>No Current Trip</Title>
            <Text>Please select or create a trip.</Text>
          </View>
        );
    }

    const groupedAttentions = attentions.reduce((groups, attention) => {
        const dateStr = attention.updatedAt.toLocaleDateString();
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        groups[dateStr].push(attention);
        return groups;
      }, {} as { [date: string]: typeof attentions });

      const sortedDates = Object.keys(groupedAttentions).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

    const handleAddAttention = async () => {
        try {
            // 此处 authorID 参数你可根据实际传入
            await createAttention(currentTrip.id, currentAttentionText, currentTrip.id);
            setAddDialogVisible(false);
            setCurrentAttentionText("");
        } catch (err: any) {
            console.error("Error adding attention:", err);
            setError("Error adding attention.");
        }
    };

    const handleEditAttention = async () => {
        if (!currentAttentionId) return;
        try {
          await updateAttention(
            currentTrip.id,
            currentAttentionId,
            currentAttentionText,
            currentTrip.id
          );
          setEditDialogVisible(false);
          setCurrentAttentionText("");
          setCurrentAttentionId(null);
        } catch (err: any) {
          console.error("Error updating attention:", err);
          setError("Error updating attention.");
        }
      };
}    