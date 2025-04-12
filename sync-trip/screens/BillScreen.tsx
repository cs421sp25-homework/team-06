import React, { useState, useEffect, useMemo } from "react";
import { 
  View, 
  FlatList,
  ScrollView, 
  StyleSheet 
} from "react-native";
import {
  Button,
  List,
  Text,
  SegmentedButtons,
} from 'react-native-paper';
import { useBillTransaction } from "../context/BillAndTransactionContext";
import { useTrip } from "../context/TripContext";
import { useUser } from "../context/UserContext";
import { getUserById } from "../utils/userAPI"; 
import { Bill } from "../types/Bill";
import TransactionModal from "../components/TransactionModal";
import BillDetailModal from "../components/BillDetailModal";
import { Collaborator } from "../types/User";

const BillScreen = () => {
  // Retrieve bills and transactions from the BillTransactionContext
  const { bills, createBill, updateBill, deleteBill, archiveBill, restoreBill } = useBillTransaction();
  // Retrieve the current trip information from the TripContext
  const { currentTrip } = useTrip();
  const { currentUser } = useUser();

  const [billModalVisible, setBillModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [collaboratorsFull, setCollaboratorsFull] = useState<Collaborator[]>([]);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  const [segment, setSegment] = useState<'active' | 'archived'>('active');

  const activeBills   = bills.filter(b => !archivedIds.has(b.id));
  const archivedBills = bills.filter(b => archivedIds.has(b.id));

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

  const handleArchive = async (id: string) => {
    setArchivedIds(prev => new Set(prev).add(id));
    await archiveBill(id);
    setBillModalVisible(false);
  };
  
  const handleRestore = async (id: string) => {
    await restoreBill(id);
  };

  const balanceForUser = (bill: Bill, uid: string): number => {      // CHANGED
    if (!bill.summary) return 0;
    let bal = 0;
    Object.entries(bill.summary).forEach(([debtorUid, credits]) => {
      Object.entries(credits as Record<string, number>).forEach(
        ([creditorUid, amount]) => {
          if (debtorUid === uid) bal -= amount;
          if (creditorUid === uid) bal += amount;
        },
      );
    });
    return bal;
  };

  // Function to handle the creation of a new bill (to be implemented according to business logic)
  const handleCreateBill = async () => {
    if (!currentTrip) return;
    //const draft = bills.find(b => b.isDraft);
    //    if (draft) {
    //    setSelectedBill(draft);
    //    setBillModalVisible(true);
    //    return;
    //}

    const newBill = {
      title: "New Bill",
      participants: [],
      summary: {},
      currency: "USD",
      isDraft: false,
      archived: false,
    } as Omit<Bill, "id">;
    try {
      await createBill(newBill);
      //const interval = setInterval(() => {
      //const found = bills.find(b => b.id === newBillId);
      //if (found) {
        //setSelectedBill(found);
      setBillModalVisible(true);
        //clearInterval(interval);
        //}
      //}, 100);

      //setTimeout(() => clearInterval(interval), 5000);

      //const draftBill = bills.find(b => b.isDraft);
      //setSelectedBill(draftBill || null);
      //setBillModalVisible(true);
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
        summary: updated.summary,
        currency: updated.currency,
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
        data={segment === 'active' ? activeBills : archivedBills}
        keyExtractor={(item, index) =>
            item.id && item.id.trim() !== '' ? item.id : `bill_${index}`
        }
        renderItem={({ item }) => {
          const bal = balanceForUser(item, currentUser?.uid ?? '');
          const bg =
            bal > 0
              ? '#e8ffea'
              : bal < 0
              ? '#ffecec'
              : undefined;

          return (
          <List.Item
            title={item.title}
            description={
              bal === 0
                ? undefined
                : bal > 0
                ? `You should receive ${bal.toFixed(2)}`
                : `You owe ${(-bal).toFixed(2)}`
            }
            onPress={() => handleBillPress(item)}
            style={[styles.billItem, bg && { backgroundColor: bg }]}
            left={props => <List.Icon {...props} icon="file-document-outline" />}
          />
          );
        }}
      />

      <Button 
        mode="contained"
        onPress={handleCreateBill}
        style={styles.createButton}
      >
        Create New Bill
      </Button>

      <SegmentedButtons
        value={segment}
        onValueChange={v => setSegment(v as any)}
        buttons={[
          { value: 'active',   label: 'Active' },
          { value: 'archived', label: 'Archived' },
        ]}
      />

      <BillDetailModal
        visible={billModalVisible}
        bill={selectedBill}
        collaborators={collaboratorsFull}
        currentUserUid={currentUser?.uid ?? ''}
        onClose={() => setBillModalVisible(false)}
        onSave={handleBillSave}
        onArchive={handleArchive}
        onDelete={async id => {
          await deleteBill(id);
          setBillModalVisible(false);
          }}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 16 },
  billItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  createButton: {
    marginTop: 20,
    alignSelf: 'center',
    width: 180,
  },
});
  
export default BillScreen;