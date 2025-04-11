import React, { useState, useEffect, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useBillTransaction } from "../context/BillAndTransactionContext";
import { useTrip } from "../context/TripContext";
import { useUser } from "../context/UserContext";
import { getUserById } from "../utils/userAPI"; 
import { Bill } from "../types/Bill";
import TransactionModal from "../components/TransactionModal";
import { Collaborator } from "../types/user";

const BillScreen = () => {
  // Retrieve bills and transactions from the BillTransactionContext
  const { bills, createBill, createTransaction } = useBillTransaction();
  // Retrieve the current trip information from the TripContext
  const { currentTrip } = useTrip();
  const { currentUser } = useUser();

  const [modalVisible, setModalVisible] = useState(false);

  const [collaboratorsFull, setCollaboratorsFull] = useState<Collaborator[]>([]);

  useEffect(() => {
    async function fetchCollaborators() {
      if (currentTrip && Array.isArray(currentTrip.collaborators)) {
        try {
          const fetched: Collaborator[] = await Promise.all(
            currentTrip.collaborators.map(async (uid: string) => {
              const user = await getUserById(uid);
              // 如果 user.name 不存在，就使用 uid 作为 fallback
              return { uid, name: user.name || uid } as Collaborator;
            })
          );
          setCollaboratorsFull(fetched);
        } catch (error) {
          console.error("Error fetching collaborators:", error);
          setCollaboratorsFull([]);
        }
      } else {
        setCollaboratorsFull([]);
      }
    }
    fetchCollaborators();
  }, [currentTrip]);

  const { owesOthers, othersOweMe } = useMemo(() => {
    let owes = 0;
    let owed = 0;
    if (currentTrip && currentUser && currentTrip.summary) {
      const myId = currentUser.uid;
      if (currentTrip.summary[myId]) {
        Object.values(currentTrip.summary[myId]).forEach((amount: number) => {
          owes += amount;
        });
      }
      Object.keys(currentTrip.summary).forEach((userId) => {
        if (userId !== myId && currentTrip.summary[userId]?.[myId]) {
          owed += currentTrip.summary[userId][myId];
        }
      });
    }
    return { owesOthers: owes, othersOweMe: owed };
  }, [currentTrip, currentUser]);

  // Function to handle the creation of a new bill (to be implemented according to business logic)
  const handleCreateBill = async () => {
    if (!currentTrip) return;
    const newBill = {
      title: "New Bill",
      participants: [],
      summary: {},
      currency: "USD",
    } as Omit<Bill, "id">;
    try {
      await createBill(newBill);
      setModalVisible(true);
    } catch (error) {
      console.error("Failed to create new bill:", error);
    }
  };

  const handleTransactionSubmit = async (data: { collaborator: string; currency: string; amount: number; description: string }) => {
    try {
      // Here, set up the transaction details. Adjust 'debtor' or 'creditor' logic as needed.
      // 例如，假设当前用户欠给选中的协作者钱：
      await createTransaction({
        debtor: currentTrip.ownerId, // 或者使用当前用户 id，如果已经包含在上下文中
        creditor: data.collaboratorId,
        amount: data.amount,
        description: data.description,
        currency: data.currency,
      });
      // Close the modal upon successful submission
      setModalVisible(false);
    } catch (error) {
      console.error("Failed to create transaction:", error);
    }
  };

  const handleBillPress = (bill: Bill) => {
    console.log("Opening bill:", bill.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Bill Screen for Trip: {currentTrip?.title || "No Trip Selected"}
      </Text>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>I owe others: ${owesOthers.toFixed(2)}</Text>
        <Text style={styles.summaryText}>Others owe me: ${othersOweMe.toFixed(2)}</Text>
      </View>

      <FlatList
        data={bills}
        keyExtractor={(item, index) =>
            item.id && item.id.trim() !== "" ? item.id : `bill_${index}`
        }
        renderItem={({ item }: { item: Bill }) => (
          <TouchableOpacity onPress={() => handleBillPress(item)}>
            <View style={styles.billItem}>
              <Text style={styles.billTitle}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.button} onPress={handleCreateBill}>
        <Text style={styles.buttonText}>Create New Bill</Text>
      </TouchableOpacity>

      <TransactionModal
        visible={modalVisible}
        collaborators={collaboratorsFull}
        onSubmit={handleTransactionSubmit}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};


const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    header: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
    summaryContainer: { marginBottom: 16 },
    summaryText: { fontSize: 16, marginVertical: 4 },
    billItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#ccc" },
    billTitle: { fontSize: 16 },
    button: { marginTop: 20, padding: 12, backgroundColor: "#007aff", borderRadius: 5 },
    buttonText: { color: "#fff", textAlign: "center" },
});
  
export default BillScreen;