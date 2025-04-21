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
  Dialog,
  Checkbox
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
  currentUserUid: string;
}

const AsyncNameLine: React.FC<NameLineProps> = ({
  debtorUid,
  creditorUid,
  amount,
  collaborators,
  currentUserUid,
}) => {
  const [debtorName, setDebtorName] = useState(debtorUid);
  const [creditorName, setCreditorName] = useState(creditorUid);

  useEffect(() => {
    (async () => {
      setDebtorName(await uidToName(debtorUid, collaborators));
      setCreditorName(await uidToName(creditorUid, collaborators));
    })();
  }, [debtorUid, creditorUid, collaborators]);

  const isReceiving = creditorUid === currentUserUid;
  const amountColor = isReceiving ? 'green' : 'red';

  return (
    <Text style={styles.detail}>
      {debtorName} owes {creditorName}:{' '} 
      <Text style={{ color: amountColor, fontWeight: 'bold' }}>
        {amount.toFixed(2)}
      </Text>
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
  const [currency, setCurrency] = useState('USD');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [currencyMenuVisible, setCurrencyMenuVisible] = useState(false);
  const currencyOptions = ['USD', 'EUR', 'GBP', 'CNY', 'JPY'];
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<Bill['category']>('');
  const [customCategoryDialogVisible, setCustomCategoryDialogVisible] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [addParticipantsDialogVisible, setAddParticipantsDialogVisible] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  

  useEffect(() => {
    if (bill) {
      setTitle(bill.title);
      setParticipants(bill.participants || []);
      setEvenTotal('');
      setCustomAmounts({});
      setCurrency(bill.currency || 'USD');
      setDescription(bill.description || '');
      setCategory(bill.category   || '');
    }
  }, [bill]);

  useEffect(() => {
    if (!bill) return;      
    const updated = new Set(bill.participants || []);
    collaborators.forEach(c => updated.add(c.uid));
    setParticipants(Array.from(updated));
  }, [bill, collaborators]);

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
    const otherParticipants = participants.filter(uid => uid !== currentUserUid);
    const share = total / participants.length;

    const summary: { [debtor: string]: { [creditor: string]: number } } = {};

    otherParticipants.forEach(uid => {
      summary[uid] = { [currentUserUid]: share };
    });
    return summary;
  };

  const computeCustomSummary = (): { [debtor: string]: { [creditor: string]: number } } => {
    const otherParticipants = participants.filter(uid => uid !== currentUserUid);

    const summary: { [debtor: string]: { [creditor: string]: number } } = {};
    otherParticipants.forEach(uid => {
      const amt = parseFloat(customAmounts[uid] || '0');
      if (!isNaN(amt)) {
        summary[uid] = { [currentUserUid]: amt };
      }
    });
    return summary;
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
      description,
      category,
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

            <Text style={styles.label}>Description:</Text>
            <TextInput
              mode="outlined"
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. dinner at Joe’s, taxi from airport…"
              multiline
              style={{ width: '100%', marginBottom: 12 }}
            />

            <Text style={styles.label}>Category:</Text>
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <Button mode="outlined" onPress={() => {setCategoryMenuVisible(true); setCurrencyMenuVisible(false);}}>
                  {category || 'Select…'}
                </Button>
              }
            >
              {['food','transport','lodging','activity'].map((opt) => (
                <Menu.Item
                  key={opt}
                  onPress={() => { setCategory(opt); setCategoryMenuVisible(false);}}
                  title={opt}
                />
              ))}

              <Menu.Item
                key="custom"
                title="+ Custom category"
                onPress={() => {
                  setCategoryMenuVisible(false);
                  setCustomCategoryInput("");
                  setCustomCategoryDialogVisible(true);
                }}
              />
            </Menu>

            <Text style={styles.detail}>
              Current category: {category || '—'}
            </Text>
  
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

        <Dialog
          visible={customCategoryDialogVisible}
          onDismiss={() => setCustomCategoryDialogVisible(false)}
        >
          <Dialog.Title>Add new category</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Category Name"
              value={customCategoryInput}
              onChangeText={setCustomCategoryInput}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCustomCategoryDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              onPress={() => {
                const name = customCategoryInput.trim();
                if (name) setCategory(name);
                setCustomCategoryDialogVisible(false);
              }}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
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
            testID="billTitle"
            mode="outlined"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Category:</Text>
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <Button mode="outlined" onPress={() => {setCategoryMenuVisible(true); setCurrencyMenuVisible(false);}}>
                  {category || 'Select…'}
                </Button>
              }
            >
              {['food','transport','lodging','activity'].map((opt) => (
                <Menu.Item
                  key={opt}
                  onPress={() => { setCategory(opt); setCategoryMenuVisible(false);}}
                  title={opt}
                />
              ))}

              <Menu.Item
                key="custom"
                title="+ Custom category"
                onPress={() => {
                  setCategoryMenuVisible(false);
                  setCustomCategoryInput("");
                  setCustomCategoryDialogVisible(true);
                }}
              />
            </Menu>

            <Text style={styles.detail}>
              Current category: {category || '—'}
           </Text>

          {/* Details */}
          <Text style={styles.detail}>Currency: {currency}</Text>
          <Menu
            visible={currencyMenuVisible}
            onDismiss={() => setCurrencyMenuVisible(false)}
            anchor={
              <Button
                testID="currencyButton"
                mode="outlined"
                onPress={() => { setCategoryMenuVisible(false);setCurrencyMenuVisible(true); }}
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
                  setCurrencyMenuVisible(false);
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
            testID="participantAdd"
            mode="contained"
            style={{ marginVertical: 8 }}
            onPress={() => {
              setSelectedParticipants(new Set(participants));
              setAddParticipantsDialogVisible(true);
            }}
          >
          Add/Remove Participants
          </Button>

          <View style={styles.modeContainer}>
            <Button
              testID="evenSplit"
              mode={distributionMode === 'even' ? 'contained' : 'outlined'}
              style={styles.modeButton}
              onPress={() => switchMode('even')}
            >
              Even Split
            </Button>
            <Button
              testID="customSplit"
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
                testID="enterTotalBill"
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
              
              {participants
                .filter(uid => uid !== currentUserUid)
                .map((uid) => (
                <View key={uid} style={styles.customRow}>
                  <Text style={styles.customLabel}>
                    {collaborators.find(c => c.uid === uid)?.name || uid}
                    </Text>
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
            testID="payBill"
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
          <Button testID="saveBill" style={styles.saveButton} onPress={handleSave}>
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

    <Dialog
      visible={customCategoryDialogVisible}
      onDismiss={() => setCustomCategoryDialogVisible(false)}
    >
      <Dialog.Title>Add new category</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Category Name"
          value={customCategoryInput}
          onChangeText={setCustomCategoryInput}
          mode="outlined"
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={() => setCustomCategoryDialogVisible(false)}>
          Cancel
        </Button>
        <Button
          onPress={() => {
            const name = customCategoryInput.trim();
            if (name) setCategory(name);
            setCustomCategoryDialogVisible(false);
          }}
        >
          Confirm
        </Button>
      </Dialog.Actions>
    </Dialog>

    <Dialog
      visible={addParticipantsDialogVisible}
      onDismiss={() => setAddParticipantsDialogVisible(false)}
    >
      <Dialog.Title>Select Participants</Dialog.Title>
      <Dialog.ScrollArea style={{ maxHeight: 300 }}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
          {collaborators.map((item) => (
            <Checkbox.Item
              key={item.uid}
              testID={`participantCheckbox-${item.uid}`}
              label={item.name}
              status={selectedParticipants.has(item.uid) ? 'checked' : 'unchecked'}
              onPress={() => {
                setSelectedParticipants(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(item.uid)) {
                    newSet.delete(item.uid);
                  } else {
                    newSet.add(item.uid);
                  }
                  return newSet;
                });
              }}
            />
          ))}
        </ScrollView>
      </Dialog.ScrollArea>

      <Dialog.Actions>
        <Button
          testID="cancelParticipantSelection"
          onPress={() => setAddParticipantsDialogVisible(false)}
        >
          Cancel
        </Button>
        <Button
          testID="confirmParticipantSelection"
          onPress={() => {
            setParticipants(Array.from(selectedParticipants));
            setAddParticipantsDialogVisible(false);
          }}
        >
          Confirm
        </Button>
      </Dialog.Actions>
    </Dialog>


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
  collaboratorList: {
    maxHeight: 300,
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
    marginVertical: 12,
    justifyContent: 'space-between',
    width: '100%'
  },
  modeButton: {
    flex: 1,
    marginHorizontal: 4,
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  payButton: {
    backgroundColor: '#007aff',
    marginTop: 20,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#00aaff',
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