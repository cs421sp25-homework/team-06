import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import {
  Text,
  Card,
  List,
  Button,
  Title,
  IconButton,
  Portal,
  Dialog,
} from "react-native-paper";
import { useTrip } from "../context/TripContext"; // 根据实际路径调整
import { Destination } from "../types/Destination"; // 根据实际路径调整

// 根据旅程开始与结束日期生成日期数组（包含首尾）
const getDatesInRange = (start, end) => {
  const date = new Date(start);
  const dates = [];
  while (date <= end) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

const MapScreen = () => {
  const { currentTrip } = useTrip();
  // 为了示例，使用本地 state 管理 trip 数据，实际项目中建议通过 context 或后端更新数据
  const [trip, setTrip] = useState(currentTrip);
  // 控制对话框显示状态以及记录当前选择的日期
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    setTrip(currentTrip);
  }, [currentTrip]);

  if (!trip) {
    return <Text>No current trip</Text>;
  }

  // 生成旅程日期数组
  const tripDates = getDatesInRange(trip.startDate, trip.endDate);
  // 未分配日期的目的地（假设未分配的 destination.date 为 null 或 undefined）
  const unassignedDestinations = trip.destinations.filter(
      (dest) => !dest.date
  );

  // 打开添加目的地对话框，并记录当前日期
  const handleOpenModal = (date) => {
    setSelectedDate(date);
    setModalVisible(true);
  };

  // 当用户选中某个未分配的目的地时，将其 date 更新为选中的日期
  const handleAssignDestination = (destination) => {
    const updatedDestinations = trip.destinations.map((dest) => {
      if (dest === destination) {
        return { ...dest, date: selectedDate };
      }
      return dest;
    });
    setTrip({ ...trip, destinations: updatedDestinations });
    setModalVisible(false);
  };

  // 删除（取消分配）目的地，即将目的地的 date 设为 null
  const handleRemoveDestination = (destination) => {
    const updatedDestinations = trip.destinations.map((dest) => {
      if (dest === destination) {
        return { ...dest, date: null };
      }
      return dest;
    });
    setTrip({ ...trip, destinations: updatedDestinations });
  };

  return (
      <>
        <ScrollView style={styles.container}>
          <Card style={styles.card}>
            <Card.Content>
              <Title>{trip.title}</Title>
              <Text>
                <Text style={styles.bold}>From: </Text>
                {new Date(trip.startDate).toLocaleDateString()}
              </Text>
              <Text>
                <Text style={styles.bold}>To: </Text>
                {new Date(trip.endDate).toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>

          <Text style={styles.sectionTitle}>Destinations by Date</Text>
          {tripDates.map((date, index) => {
            // 过滤出已分配到当前日期的目的地（只比较日期部分）
            const destinationsForDate = trip.destinations.filter(
                (dest) =>
                    dest.date &&
                    new Date(dest.date).toDateString() === date.toDateString()
            );
            return (
                <List.Accordion
                    key={index}
                    title={date.toLocaleDateString()}
                    style={styles.accordion}
                >
                  {destinationsForDate.length === 0 ? (
                      <List.Item title="No destinations for this day" />
                  ) : (
                      destinationsForDate.map((destination, idx) => (
                          <List.Item
                              key={idx}
                              title={destination.description}
                              description={destination.address}
                              right={() => (
                                  <IconButton
                                      icon="delete"
                                      onPress={() => handleRemoveDestination(destination)}
                                  />
                              )}
                          />
                      ))
                  )}
                  <Button
                      mode="outlined"
                      onPress={() => handleOpenModal(date)}
                      style={styles.addButton}
                  >
                    Add Destination
                  </Button>
                </List.Accordion>
            );
          })}

          <Button
              mode="contained"
              onPress={() => {
                /* Handle Edit Trip */
              }}
              style={styles.button}
          >
            Edit Trip
          </Button>
        </ScrollView>

        <Portal>
          <Dialog
              visible={modalVisible}
              onDismiss={() => setModalVisible(false)}
          >
            <Dialog.Title>Select a Destination</Dialog.Title>
            <Dialog.Content>
              {unassignedDestinations.length === 0 ? (
                  <Text>No unassigned destinations available</Text>
              ) : (
                  unassignedDestinations.map((destination, idx) => (
                      <List.Item
                          key={idx}
                          title={destination.description}
                          description={destination.address}
                          onPress={() => handleAssignDestination(destination)}
                      />
                  ))
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 16,
  },
  bold: {
    fontWeight: "bold",
  },
  button: {
    marginTop: 16,
  },
  accordion: {
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
  },
  addButton: {
    margin: 8,
  },
});

export default MapScreen;