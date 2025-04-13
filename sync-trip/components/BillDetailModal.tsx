import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Button, TextInput, Modal, Portal, Menu } from 'react-native-paper';
import { WebView } from 'react-native-webview'; // For native platforms
import { Bill } from '../types/Bill';
import { Collaborator } from '../types/User';
import { getUserById } from '../utils/userAPI';

// ------------------
// Helper Functions & Components
// ------------------

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
    nameCache[uid] = user.name ?? uid;
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

// ------------------
// PayPal Integration Components
// ------------------

/*
  PayPalButton (Web):
  Loads the PayPal JS SDK directly and renders the button into a DOM element.
  This component works only in a web environment.
*/
const PayPalButton = ({
  amount,
  currency,
  onSuccess,
  onError,
}: {
  amount: string;
  currency: string;
  onSuccess: (order: any) => void;
  onError: (error: any) => void;
}) => {
  const paypalRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      console.warn('PayPal integration is only available in a web environment.');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=${currency}`;
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      window.paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount,
                },
              },
            ],
          });
        },
        onApprove: async (data: any, actions: any) => {
          try {
            const order = await actions.order.capture();
            onSuccess(order);
          } catch (error) {
            onError(error);
          }
        },
        onError: onError,
      }).render(paypalRef.current);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [amount, currency, onSuccess, onError]);

  if (Platform.OS !== 'web') {
    return null;
  }
  return React.createElement('div', { ref: paypalRef });
};

/*
  PayPalWebView (Native):
  Uses a WebView that loads an HTML snippet containing the PayPal JS SDK.
  This snippet renders the PayPal button and sends payment events back via postMessage.
*/
const PayPalWebView = ({
  amount,
  currency,
  onSuccess,
  onError,
  onCancel,
}: {
  amount: string;
  currency: string;
  onSuccess: (order: any) => void;
  onError: (error: any) => void;
  onCancel: () => void;
}) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=${currency}"></script>
    </head>
    <body>
      <div id="paypal-button-container"></div>
      <script>
        paypal.Buttons({
          createOrder: function(data, actions) {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: '${amount}'
                }
              }]
            });
          },
          onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', details: details }));
            });
          },
          onCancel: function (data) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'cancel' }));
          },
          onError: function(err) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'error', error: err.toString() }));
          }
        }).render('#paypal-button-container');
      </script>
    </body>
  </html>
  `;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      style={{ height: 300, width: '100%' }} // Ensure the WebView is visible
      onMessage={(event) => {
        try {
          const messageData = JSON.parse(event.nativeEvent.data);
          if (messageData.status === 'success') {
            onSuccess(messageData.details);
          } else if (messageData.status === 'cancel') {
            onCancel();
          } else if (messageData.status === 'error') {
            onError(messageData.error);
          }
        } catch (e) {
          console.error('Error parsing message from PayPal WebView', e);
          onError(e);
        }
      }}
    />
  );
};

// ------------------
// BillDetailModal Component
// ------------------

interface BillDetailModalProps {
  visible: boolean;
  bill: Bill | null;
  collaborators: Collaborator[];
  currentUserUid: string;
  onClose: () => void;
  onSave: (updated: Partial<Bill>) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

const BillDetailModal: React.FC<BillDetailModalProps> = ({
  visible,
  bill,
  collaborators,
  currentUserUid,
  onClose,
  onSave,
  onArchive,
  onDelete,
}) => {
  const [title, setTitle] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [distributionMode, setDistributionMode] = useState<'even' | 'custom'>('even');
  const [evenTotal, setEvenTotal] = useState<string>('');
  const [customAmounts, setCustomAmounts] = useState<{ [uid: string]: string }>({});
  const [showCollaboratorList, setShowCollaboratorList] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [menuVisible, setMenuVisible] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
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
      prev.includes(uid) ? prev.filter(p => p !== uid) : [...prev, uid]
    );
  };

  const computeEvenSummary = (): { [debtor: string]: { [creditor: string]: number } } => {
    const total = parseFloat(evenTotal);
    if (isNaN(total) || participants.length === 0) {
      return {};
    }
    const share = total / participants.length;
    return {
      [currentUserUid]: participants.reduce((acc, uid) => {
        acc[uid] = share;
        return acc;
      }, {} as { [key: string]: number }),
    };
  };

  const computeCustomSummary = (): { [debtor: string]: { [creditor: string]: number } } => {
    return {
      [currentUserUid]: participants.reduce((acc, uid) => {
        const amt = parseFloat(customAmounts[uid] || '0');
        if (!isNaN(amt)) {
          acc[uid] = amt;
        }
        return acc;
      }, {} as { [key: string]: number }),
    };
  };

  const handleSave = () => {
    if (!currentUserUid) {
      Alert.alert('User information loading');
      return;
    }
    const summary =
      distributionMode === 'even' ? computeEvenSummary() : computeCustomSummary();
    console.log('Computed summary:', summary);
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

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.overlay}>
        <ScrollView contentContainerStyle={styles.modalContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Bill Details</Text>

          {/* Title Editor */}
          <Text style={styles.label}>Title:</Text>
          <TextInput mode="outlined" style={styles.input} value={title} onChangeText={setTitle} />

          {/* Currency Selection */}
          <Text style={styles.detail}>Currency: {currency}</Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMenuVisible(true)} style={{ alignSelf: 'flex-start' }}>
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

          {/* Participants */}
          <Text style={styles.detail}>Participants:</Text>
          <Text style={styles.detail}>
            {participants.length
              ? participants.map(uid => collaborators.find(c => c.uid === uid)?.name ?? uid).join(', ')
              : 'No participants'}
          </Text>
          <Button mode="contained" style={{ marginVertical: 8 }} onPress={() => setShowCollaboratorList(!showCollaboratorList)}>
            Add/Remove Participants
          </Button>
          {showCollaboratorList && (
            <View style={{ height: 150, width: '100%' }}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {collaborators.map(item => {
                  const selected = participants.includes(item.uid);
                  return (
                    <Button
                      key={item.uid}
                      style={[styles.collaboratorItem, selected && { backgroundColor: '#cceeff' }]}
                      onPress={() => handleToggleParticipant(item.uid)}
                    >
                      {item.name}
                    </Button>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Split Mode Selection */}
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
              style={styles.modeButton}
              onPress={() => switchMode('custom')}
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
              {participants.map(uid => (
                <View key={uid} style={styles.customRow}>
                  <Text style={styles.customLabel}>
                    {collaborators.find(c => c.uid === uid)?.name || uid}:
                  </Text>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Amount"
                    keyboardType="numeric"
                    value={customAmounts[uid] || ''}
                    onChangeText={text => setCustomAmounts(prev => ({ ...prev, [uid]: text }))}
                  />
                </View>
              ))}
            </>
          )}

          {/* Summary Display */}
          {bill.summary && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Summary:</Text>
              {Object.entries(bill.summary).map(([debtorUid, credits]) => (
                <View key={debtorUid} style={{ marginBottom: 4 }}>
                  {Object.entries(credits as Record<string, number>).map(([creditorUid, amount]) => (
                    <AsyncNameLine
                      key={debtorUid + creditorUid}
                      debtorUid={debtorUid}
                      creditorUid={creditorUid}
                      amount={amount}
                      collaborators={collaborators}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Payment Processing */}
          {showPayPal ? (
            <View style={styles.paypalContainer}>
              {Platform.OS === 'web' ? (
                <PayPalButton
                  amount={distributionMode === 'even' ? evenTotal : '0'} // Adjust as needed for custom amounts
                  currency={currency}
                  onSuccess={order => {
                    console.log('Payment successful', order);
                    onArchive(bill.id);
                    setShowPayPal(false);
                  }}
                  onError={err => {
                    console.error('Payment error', err);
                    Alert.alert('Payment failed', 'There was an error processing your payment.');
                    setShowPayPal(false);
                  }}
                />
              ) : (
                <PayPalWebView
                  amount={distributionMode === 'even' ? evenTotal : '0'}
                  currency={currency}
                  onSuccess={order => {
                    console.log('Payment successful', order);
                    onArchive(bill.id);
                    setShowPayPal(false);
                  }}
                  onError={err => {
                    console.error('Payment error', err);
                    Alert.alert('Payment failed', 'There was an error processing your payment.');
                    setShowPayPal(false);
                  }}
                  onCancel={() => setShowPayPal(false)}
                />
              )}
              <Button onPress={() => setShowPayPal(false)}>Cancel Payment</Button>
            </View>
          ) : (
            <Button style={styles.payButton} onPress={() => setShowPayPal(true)}>
              Pay
            </Button>
          )}

          {/* Save, Close, and Delete Buttons */}
          <Button style={styles.saveButton} onPress={handleSave}>
            Save Changes
          </Button>
          <Button style={styles.closeButton} onPress={onClose}>
            Close
          </Button>
          <Button
            mode="outlined"
            textColor="red"
            style={{ marginTop: 12 }}
            onPress={() =>
              Alert.alert('Delete Bill', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => bill && onDelete(bill.id) },
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

// ------------------
// Styles
// ------------------
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
  saveButton: {
    backgroundColor: '#00aaff',
    padding: 12,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  closeButton: {
    marginTop: 12,
    padding: 10,
  },
  paypalContainer: {
    width: '100%',
    marginVertical: 20,
    alignItems: 'center',
  },
});

export default BillDetailModal;