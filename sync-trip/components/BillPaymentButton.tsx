import React from 'react';
import { Alert, Linking } from 'react-native';
import { Button } from 'react-native-paper';
import { Bill } from '../types/Bill';

interface BillPaymentButtonProps {
  bill: Bill;
  currentUserUid: string;
  /**
   * Optional PayPal business account (receiver email).
   * If not provided, redirects to generic PayPal login page.
   */
  paypalBusinessAccount?: string;
}

const BillPaymentButton: React.FC<BillPaymentButtonProps> = ({
  bill,
  currentUserUid,
  paypalBusinessAccount,
}) => {
  const currency = bill.currency || 'USD';

  // Compute how much the current user owes or is owed
  const computeUserPaymentAmount = (): string => {
    if (!bill.summary || !bill.summary[currentUserUid]) return '0.00';
    const total = Object.values(bill.summary[currentUserUid]).reduce(
      (sum, value) => sum + value,
      0
    );
    return total.toFixed(2);
  };

  const handlePay = () => {
    if (paypalBusinessAccount) {
      const amount = computeUserPaymentAmount();
      const url = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(
        paypalBusinessAccount
      )}&item_name=${encodeURIComponent(bill.title)}&amount=${amount}&currency_code=${currency}`;
      Linking.openURL(url).catch(err => {
        console.error('Failed to open PayPal URL', err);
        Alert.alert('Error', 'Unable to open PayPal. Please try again later.');
      });
    } else {
      // Redirect to generic PayPal login
      Linking.openURL('https://www.paypal.com/signin').catch(err => {
        console.error('Failed to open PayPal login', err);
        Alert.alert('Error', 'Unable to open PayPal. Please try again later.');
      });
    }
  };

  return (
    <Button
      mode="contained"
      onPress={handlePay}
      style={{ marginVertical: 16, alignSelf: 'center' }}
    >
      Pay with PayPal
    </Button>
  );
};

export default BillPaymentButton;
