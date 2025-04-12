import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    FlatList,
    Platform,
    ScrollView,
    Alert,
  } from 'react-native';
import { Bill } from '../types/Bill';
import { Collaborator } from '../types/User';
import { getUserById } from '../utils/userAPI';


interface BillDetailModalProps {
  visible: boolean;
  bill: Bill | null;
  collaborators: Collaborator[];
  currentUserUid: string;
  onClose: () => void;
  onSave: (updated: Partial<Bill>) => void;
}

const nameCache: Record<string, string> = {};

const uidToName = async (
  uid: string,
  collaborators: Collaborator[]
): Promise<string> => {

  if (nameCache[uid]) return nameCache[uid];

  const local = collaborators.find(c => c.uid === uid);
  if (local) {
    nameCache[uid] = local.name ?? uid;
    return nameCache[uid];
  }

  try {
    const user = await getUserById(uid);
    nameCache[uid] = (user.name ?? uid);
    return nameCache[uid];
  } catch {
    return uid;
  }
};
interface NameLineProps {
  debtorUid: string;
  creditorUid: string;
  amount: number;
  collaborators: Collaborator[];
}

const AsyncNameLine: React.FC<NameLineProps> = ({
  debtorUid,
  creditorUid,
  amount,
  collaborators,
}) => {
  const [debtorName, setDebtorName] = useState(debtorUid);
  const [creditorName, setCreditorName] = useState(creditorUid);

  useEffect(() => {
    (async () => {
      setDebtorName(await uidToName(debtorUid, collaborators));
      setCreditorName(await uidToName(creditorUid, collaborators));
    })();
  }, [debtorUid, creditorUid, collaborators]);

  return (
    <Text style={styles.detail}>
      {debtorName} → {creditorName}: {amount.toFixed(2)}
    </Text>
  );
};


const BillDetailModal: React.FC<BillDetailModalProps> = ({
  visible,
  bill,
  collaborators,
  currentUserUid,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [distributionMode, setDistributionMode] = useState<'even' | 'custom'>('even');
  const [evenTotal, setEvenTotal] = useState<string>('');
  const [customAmounts, setCustomAmounts] = useState<{ [uid: string]: string }>({});
  const [showCollaboratorList, setShowCollaboratorList] = useState(false);


  useEffect(() => {
    if (bill) {
      setTitle(bill.title);
      setParticipants(bill.participants || []);
      setEvenTotal('');
      setCustomAmounts({});
    }
  }, [bill]);

  const switchMode = (mode: 'even' | 'custom') => {
    setDistributionMode(mode);
    setEvenTotal('');
    setCustomAmounts({});
  };

  const handleToggleParticipant = (uid: string) => {
    setParticipants((prev) =>
      prev.includes(uid) ? prev.filter((p) => p !== uid) : [...prev, uid]
    );
  };

  const computeEvenSummary = (): { [debtor: string]: { [creditor: string]: number } } => {
    const total = parseFloat(evenTotal);
    if (isNaN(total) || participants.length === 0) {
      return {};
    }
    const share = total / participants.length;
    return { [currentUserUid]: participants.reduce((acc, uid) => {
      acc[uid] = share;
      return acc;
    }, {} as { [key: string]: number }) };
  };

  const computeCustomSummary = (): { [debtor: string]: { [creditor: string]: number } } => {
    return { [currentUserUid]: participants.reduce((acc, uid) => {
      const amt = parseFloat(customAmounts[uid] || '0');
      if (!isNaN(amt)) {
        acc[uid] = amt;
      }
      return acc;
    }, {} as { [key: string]: number }) };
  };


  const handleSave = () => {
    if (!currentUserUid) {
      Alert.alert('User information loading')
      return;
    }
    let summary = {};
    if (distributionMode === 'even') {
      summary = computeEvenSummary();
    } else {
      summary = computeCustomSummary();
    }
    console.log("Computed summary:", summary);
    onSave({
      id: bill.id,
      title,
      participants,
      summary,
    });
    onClose();
  };

  if (!bill) return null;

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent 
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.modalContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Bill Details</Text>

          {/* Title editor */}
          <Text style={styles.label}>Title:</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

          {/* Details */}
          <Text style={styles.detail}>Currency: {bill.currency}</Text>
          <Text style={styles.detail}>Participants:</Text>
          <Text style={styles.detail}>
            {participants.length > 0 ? participants.join(', ') : 'No participants'}
          </Text>


          {/* Select collaborator from list */}
          <TouchableOpacity
            style={styles.participantsButton}
            onPress={() => setShowCollaboratorList(!showCollaboratorList)}
          >
          <Text style={styles.participantsButtonText}>Add/Remove Participants</Text>
          </TouchableOpacity>
          {showCollaboratorList && (
            <View style={{ height: 150, width: '100%' }}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {collaborators.map((item) => {
                  const selected = participants.includes(item.uid);
                  return (
                    <TouchableOpacity
                      key={item.uid}
                      style={[
                        styles.collaboratorItem,
                        selected && { backgroundColor: '#cceeff' },
                      ]}
                      onPress={() => handleToggleParticipant(item.uid)}
                    >
                      <Text>{item.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                distributionMode === 'even' && styles.modeButtonSelected,
              ]}
              onPress={() => switchMode('even')}
            >
              <Text style={[
                styles.modeButtonText,
                distributionMode === 'even' && { color: '#fff' },
              ]}>Even Split</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                distributionMode === 'custom' && styles.modeButtonSelected,
              ]}
              onPress={() => switchMode('custom')}
            >
              <Text style={[
                styles.modeButtonText,
                distributionMode === 'custom' && { color: '#fff' },
              ]}>Custom Split</Text>
            </TouchableOpacity>
          </View>

          {distributionMode === 'even' ? (
            <>
              <Text style={styles.label}>Total Amount:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter total amount"
                keyboardType="numeric"
                value={evenTotal}
                onChangeText={setEvenTotal}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Enter amount for each participant:</Text>
              {participants.map((uid) => (
                <View key={uid} style={styles.customRow}>
                  <Text style={styles.customLabel}>{collaborators.find(c => c.uid === uid)?.name || uid}:</Text>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Amount"
                    keyboardType="numeric"
                    value={customAmounts[uid] || ''}
                    onChangeText={(text) =>
                      setCustomAmounts((prev) => ({ ...prev, [uid]: text }))
                    }
                  />
                </View>
              ))}
            </>
          )}

          {/* Show summary */}
          {bill.summary && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Summary:</Text>
              {Object.entries(bill.summary).map(([debtorUid, credits]) => (
                <View key={debtorUid} style={{ marginBottom: 4 }}>
                  {Object.entries(credits as Record<string, number>).map(
                    ([creditorUid, amount]) => (
                      <AsyncNameLine
                      key={debtorUid + creditorUid}
                      debtorUid={debtorUid}
                      creditorUid={creditorUid}
                      amount={amount}
                      collaborators={collaborators}
                    />
                    )
                  )}
                </View>
              ))} 
            </View>
          )}

          {/* Pay button */}
          <TouchableOpacity 
            style={styles.payButton} 
            onPress={() => console.log('Pay button clicked')}
          >
            <Text style={styles.payButtonText}>Pay</Text>
          </TouchableOpacity>

          {/* Save button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>

          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: Platform.OS === 'ios' ? 12 : 8,
    alignSelf: 'stretch',
    marginBottom: 8,
  },
  detail: {
    fontSize: 16,
    marginVertical: 4,
  },
  participantsButton: {
    backgroundColor: '#88bbee',
    padding: 10,
    borderRadius: 4,
    marginVertical: 8,
  },
  participantsButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  collaboratorList: {
    maxHeight: 150,
    width: '100%',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  collaboratorItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  customRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  customLabel: {
    fontSize: 16,
    width: '40%',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    width: '55%',
  },
  modeContainer: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  modeButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#007aff',
    borderRadius: 4,
  },
  modeButtonSelected: {
    backgroundColor: '#007aff',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#007aff',
  },
  summarySection: {
    width: '100%',
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  payButton: {
    backgroundColor: '#007aff',
    padding: 12,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#00aaff',
    padding: 12,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 12,
    padding: 10,
  },
  closeButtonText: {
    color: 'red',
    fontSize: 16,
  },
});

export default BillDetailModal;
