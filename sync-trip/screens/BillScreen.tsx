import React, { useState, useEffect, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useBillTransaction } from "../context/BillAndTransactionContext";
import { useTrip } from "../context/TripContext";
import { useUser } from "../context/UserContext";
import { getUserById } from "../utils/userAPI"; 
import { Bill } from "../types/Bill";
import TransactionModal from "../components/TransactionModal";
import BillDetailModal from "../components/BillDetailModal";
import { Collaborator } from "../types/user";

const BillScreen = () => {
  // Retrieve bills and transactions from the BillTransactionContext
  const { bills, createBill, updateBill } = useBillTransaction();
  // Retrieve the current trip information from the TripContext
  const { currentTrip } = useTrip();
  const { currentUser } = useUser();

  const [billModalVisible, setBillModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [collaboratorsFull, setCollaboratorsFull] = useState<Collaborator[]>([]);

  useEffect(() => {
    async function fetchCollaborators() {
      if (currentTrip && Array.isArray(currentTrip.collaborators)) {
        try {
          const fetched: Collaborator[] = await Promise.all(
            currentTrip.collaborators.map(async (uid: string) => {
              const user = await getUserById(uid);
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

  // Function to handle the creation of a new bill (to be implemented according to business logic)
  const handleCreateBill = async () => {
    if (!currentTrip) return;
    const draft = bills.find(b => b.isDraft);
        if (draft) {
        setSelectedBill(draft);
        setBillModalVisible(true);
        return;
    }

    const newBill = {
      title: "New Bill",
      participants: [],
      summary: {},
      currency: "USD",
      isDraft: true,
    } as Omit<Bill, "id">;
    try {
      await createBill(newBill);
      const draftBill = bills.find(b => b.isDraft);
      setSelectedBill(draftBill || null);
      setModalVisible(true);
    } catch (error) {
      console.error("Failed to create new bill:", error);
    }
  };

  const handleBillPress = (bill: Bill) => {
    console.log("Opening bill:", bill.id);
    setSelectedBill(bill);
    setBillModalVisible(true);
  };

  const handleBillSave = async (updated: Partial<Bill>) => {
    if (!updated.id && selectedBill) {
      updated = { id: selectedBill.id, ...updated };
    }
    try {
      await updateBill(updated.id, {
        title: updated.title,
        participants: updated.participants,
      });
    } catch (error) {
      console.error("Failed to update bill:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Bill Screen for Trip: {currentTrip?.title || "No Trip Selected"}
      </Text>

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

      <BillDetailModal
        visible={billModalVisible}
        bill={selectedBill}
        collaborators={collaboratorsFull}
        onClose={() => setBillModalVisible(false)}
        onSave={handleBillSave}
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