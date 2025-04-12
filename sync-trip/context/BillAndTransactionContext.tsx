import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "@react-native-firebase/firestore";
import { firestore } from "../utils/firebase";
import { Bill } from "../types/Bill";
import { Transaction } from "../types/Transaction";
import {
  createBill as apiCreateBill,
  updateBill as apiUpdateBill,
  deleteBill as apiDeleteBill,
  subscribeToTransactions,
  createTransaction as apiCreateTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
  parseBill,
} from "../utils/billAndTransactionAPI";
import { useTrip } from "./TripContext"; // Import current trip context to get the currentTripId
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// Define the context type for bills and transactions
interface BillTransactionContextType {
  bills: Bill[];
  transactions: Transaction[];
  // Bill API functions
  createBill: (bill: Bill) => Promise<string>;
  updateBill: (billId: string, updatedBill: Partial<Bill>) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
  // Transaction API functions
  createTransaction: (transaction: Omit<Transaction, "transactionId">) => Promise<void>;
  updateTransaction: (transactionId: string, updatedData: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
}

const BillTransactionContext = createContext<BillTransactionContextType | undefined>(undefined);

export const BillTransactionProvider = ({ children }: { children: ReactNode }) => {
  // State for bills and transactions
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Get the current trip from TripContext
  const { currentTrip } = useTrip();
  const currentTripId = currentTrip?.id;

  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentTripId) return;
    loadArchivedIds(currentTripId).then(setArchivedIds);
  }, [currentTripId]);

  
  // Subscribe to the bills collection changes of the current trip.
  useEffect(() => {
    if (!currentTripId) return;

    // Reference to the bills collection under the current trip
    const billsRef = collection(firestore, "trips", currentTripId, "bills");
    const unsubscribeBills = onSnapshot(billsRef, (snapshot) => {
      // Map Firestore documents to Bill objects
      const billsData = snapshot.docs.map((docSnap) => (
        parseBill(
            docSnap.id,
            docSnap.data(),
        ))) as Bill[];
      setBills(billsData.map(b => ({ ...b, archived: archivedIds.has(b.id) })));
    });

    return () => {
      unsubscribeBills();
    };
  }, [currentTripId]);

  // Subscribe to the transactions collection changes of the current trip using the existing API helper
  useEffect(() => {
    if (!currentTripId) return;

    const unsubscribeTransactions = subscribeToTransactions(currentTripId, (transactionsData) => {
      setTransactions(transactionsData);
    });

    return () => {
      unsubscribeTransactions();
    };
  }, [currentTripId]);

  // Create a new bill using the API helper function
  const createBill = async (bill: Bill): Promise<void> => {
    if (!currentTripId) throw new Error("No current trip available.");
    await apiCreateBill(currentTripId, bill);
  };

  // Update an existing bill using the API helper function
  const updateBill = async (billId: string, updatedBill: Partial<Bill>): Promise<void> => {
    if (!currentTripId) throw new Error("No current trip available.");
    await apiUpdateBill(currentTripId, billId, updatedBill);
  };

  // Delete a bill using the API helper function
  const deleteBill = async (billId: string): Promise<void> => {
    if (!currentTripId) throw new Error("No current trip available.");
    await apiDeleteBill(currentTripId, billId);
  };

  // Create a new transaction using the API helper function
  const createTransaction = async (transaction: Omit<Transaction, "transactionId">): Promise<void> => {
    if (!currentTripId) throw new Error("No current trip available.");
    await apiCreateTransaction(currentTripId, transaction);
  };

  // Update an existing transaction using the API helper function
  const updateTransaction = async (transactionId: string, updatedData: Partial<Transaction>): Promise<void> => {
    if (!currentTripId) throw new Error("No current trip available.");
    await apiUpdateTransaction(currentTripId, transactionId, updatedData);
  };

  // Delete a transaction using the API helper function
  const deleteTransaction = async (transactionId: string): Promise<void> => {
    if (!currentTripId) throw new Error("No current trip available.");
    await apiDeleteTransaction(currentTripId, transactionId);
  };

  const storageKey = (tripId: string) => `archivedBills_${tripId}`;

  async function loadArchivedIds(tripId: string): Promise<Set<string>> {
    const raw = await AsyncStorage.getItem(storageKey(tripId));
    return new Set(raw ? JSON.parse(raw) : []);
  }
  async function saveArchivedIds(tripId: string, ids: Set<string>) {
    await AsyncStorage.setItem(storageKey(tripId), JSON.stringify([...ids]));
  }

  const archiveBill = async (billId: string) => {
    if (!currentTripId) return;
    const next = new Set(archivedIds).add(billId);
    setArchivedIds(next);
    await saveArchivedIds(currentTripId, next);
  };
  
  const restoreBill = async (billId: string) => {
    if (!currentTripId) return;
    const next = new Set(archivedIds);
    next.delete(billId);
    setArchivedIds(next);
    await saveArchivedIds(currentTripId, next);
  };

  return (
    <BillTransactionContext.Provider
      value={{
        bills,
        transactions,
        createBill,
        updateBill,
        deleteBill,
        archiveBill,
        restoreBill,
        createTransaction,
        updateTransaction,
        deleteTransaction,
      }}
    >
      {children}
    </BillTransactionContext.Provider>
  );
};

// Custom hook to use the BillTransactionContext
export const useBillTransaction = () => {
  const context = useContext(BillTransactionContext);
  if (!context) {
    throw new Error("useBillTransaction must be used within a BillTransactionProvider");
  }
  return context;
};