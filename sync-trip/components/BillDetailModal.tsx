import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    ScrollView,
    Alert,
  } from 'react-native';
import {
  Button,
  TextInput,
  Modal,
  Portal,
  Menu,
} from 'react-native-paper';
import { Bill } from '../types/Bill';
import { Collaborator } from '../types/User';
import { getUserById } from '../utils/userAPI';
import BillPaymentButton from './BillPaymentButton';

interface BillDetailModalProps {
  visible: boolean;
  bill: Bill | null;
  collaborators: Collaborator[];
  currentUserUid: string;
  onClose: () => void;
  onSave: (updated: Partial<Bill>) => void;
  onArchive: (id: string) => void;
  onDelete:  (id: string) => void;
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
  onArchive,
  onDelete
}) => {
  const [title, setTitle] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [distributionMode, setDistributionMode] = useState<'even' | 'custom'>('even');
  const [evenTotal, setEvenTotal] = useState<string>('');
  const [customAmounts, setCustomAmounts] = useState<{ [uid: string]: string }>({});
  const [showCollaboratorList, setShowCollaboratorList] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [menuVisible, setMenuVisible] = useState(false);
  const currencyOptions = ['USD', 'EUR', 'GBP', 'CNY', 'JPY'];


  useEffect(() => {
    if (bill) {
      setTitle(bill.title);
      setParticipants(bill.participants || []);
      setEvenTotal('');
      setCustomAmounts({});
      setCurrency(bill.currency || 'USD');
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
    const summary =
      distributionMode === 'even' ? computeEvenSummary() : computeCustomSummary();
    console.log("Computed summary:", summary);
    onSave({
      id: bill!.id,
      title,
      participants,
      summary,
      currency,
    });
    onClose();
  };

  if (!bill) return null;

  if (bill.archived) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onClose}
          contentContainerStyle={styles.overlay}
        >
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <Text style={styles.title}>Archived Bill</Text>
  
            <Text style={styles.detail}>Title: {bill.title}</Text>

            {bill.summary && (
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Summary:</Text>
                {Object.entries(bill.summary).map(
                  ([debtorUid, credits]) => (
                    <View key={debtorUid} style={{ marginBottom: 4 }}>
                      {Object.entries(
                        credits as Record<string, number>
                      ).map(([creditorUid, amount]) => (
                        <AsyncNameLine
                          key={debtorUid + creditorUid}
                          debtorUid={debtorUid}
                          creditorUid={creditorUid}
                          amount={amount}
                          collaborators={collaborators}
                        />
                      ))}
                    </View>
                  )
                )}
              </View>
            )}

            <Button
              mode="outlined"
              textColor="red"
              style={{ marginTop: 20, width: '100%' }}
              onPress={() =>
                Alert.alert('Delete Bill', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      onDelete(bill.id);
                      onClose();
                    },
                  },
                ])
              }
            >
              Delete Bill
            </Button>

            <Button
              style={[styles.closeButton, { marginTop: 12 }]}
              onPress={onClose}
            >
              Close
            </Button>
          </ScrollView>
        </Modal>
      </Portal>
    );
  }
  

  return (
    <Portal>
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={styles.overlay}
    >
      <ScrollView contentContainerStyle={styles.modalContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Bill Details</Text>

          {/* Title editor */}
          <Text style={styles.label}>Title:</Text>
          <TextInput
            mode="outlined"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

          {/* Details */}
          <Text style={styles.detail}>Currency: {currency}</Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                style={{ alignSelf: 'flex-start' }}
              >
                {currency}
              </Button>
            }
          >
            {currencyOptions.map(code => (
              <Menu.Item
                key={code}
                onPress={() => {
                  setCurrency(code);
                  setMenuVisible(false);
                }}
                title={code}
              />
            ))}
          </Menu>


          <Text style={styles.detail}>Participants:</Text>
          <Text style={styles.detail}>
            {participants.length
              ? participants
                  .map(uid => collaborators.find(c => c.uid === uid)?.name ?? uid)
                  .join(', ')
              : 'No participants'}
          </Text>


          {/* Select collaborator from list */}
          <Button
            mode="contained"
            style={{ marginVertical: 8 }}
            onPress={() => setShowCollaboratorList(!showCollaboratorList)}
          >
          Add/Remove Participants
          </Button>
          {showCollaboratorList && (
            <View style={{ height: 150, width: '100%' }}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {collaborators.map((item) => {
                  const selected = participants.includes(item.uid);
                  return (
                    <Button
                      key={item.uid}
                      style={[
                        styles.collaboratorItem,
                        selected && { backgroundColor: '#cceeff' },
                      ]}
                      onPress={() => handleToggleParticipant(item.uid)}
                    >
                      {item.name}
                    </Button>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.modeContainer}>
            <Button
              mode={distributionMode === 'even' ? 'contained' : 'outlined'}
              style={styles.modeButton}
              onPress={() => switchMode('even')}
            >
              Even Split
            </Button>
            <Button
              mode={distributionMode === 'custom' ? 'contained' : 'outlined'}
              onPress={() => switchMode('custom')}
              style={styles.modeButton}
            >
              Custom Split
            </Button>
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
          <BillPaymentButton
            bill={bill}
            currentUserUid={currentUserUid}
            //paypalBusinessAccount={itundefined}
            onArchive={() => {
              console.log('BillDetailModal: onArchive prop fired for', bill.id);
              onArchive(bill.id);
              onClose();
            }}
          />

          {/* Save button */}
          <Button style={styles.saveButton} onPress={handleSave}>
            Save Changes
          </Button>

          {/* Close button */}
          <Button
            style={styles.closeButton}
            onPress={onClose}
          >
            Close
          </Button>

          <Button
            mode="outlined"
            textColor="red"
            style={{ marginTop: 12 }}
            onPress={() =>
              Alert.alert('Delete Bill','Are you sure?',[
                { text:'Cancel',style:'cancel' },
                { text:'Delete',style:'destructive', onPress:()=>onDelete(bill.id) }
              ])
            }
          >
            Delete Bill
          </Button>
        </ScrollView>
    </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    alignSelf: 'center',
  },
  modalContainer: {
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
    marginVertical: 2,
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
    alignSelf: 'stretch',
    flex: 1,
    marginLeft: 8,
    marginBottom: 4,
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
  modeButtonSelected: {},
  summarySection: {
    width: '100%',
    marginTop: 12,
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