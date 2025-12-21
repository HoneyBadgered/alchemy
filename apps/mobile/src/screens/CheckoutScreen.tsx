import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../contexts/CartContext';

export default function CheckoutScreen({ navigation }: any) {
  const { cart, itemCount, subtotal } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
  });

  const [customerNotes, setCustomerNotes] = useState('');

  const handleSubmit = async () => {
    // Validate required fields
    if (
      !shippingInfo.firstName ||
      !shippingInfo.lastName ||
      !shippingInfo.addressLine1 ||
      !shippingInfo.city ||
      !shippingInfo.state ||
      !shippingInfo.zipCode
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement actual order placement
      // This would require authentication integration
      Alert.alert(
        'Success',
        'Order placed successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ShopList'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || itemCount === 0) {
    navigation.navigate('Cart');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Checkout</Text>
          <Text style={styles.subtitle}>Complete your order</Text>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={shippingInfo.firstName}
                onChangeText={(text) => setShippingInfo({ ...shippingInfo, firstName: text })}
                placeholder="First Name"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={shippingInfo.lastName}
                onChangeText={(text) => setShippingInfo({ ...shippingInfo, lastName: text })}
                placeholder="Last Name"
              />
            </View>
          </View>

          <View style={styles.fullInput}>
            <Text style={styles.label}>Address Line 1 *</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.addressLine1}
              onChangeText={(text) => setShippingInfo({ ...shippingInfo, addressLine1: text })}
              placeholder="Street address"
            />
          </View>

          <View style={styles.fullInput}>
            <Text style={styles.label}>Address Line 2</Text>
            <TextInput
              style={styles.input}
              value={shippingInfo.addressLine2}
              onChangeText={(text) => setShippingInfo({ ...shippingInfo, addressLine2: text })}
              placeholder="Apartment, suite, etc. (optional)"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={shippingInfo.city}
                onChangeText={(text) => setShippingInfo({ ...shippingInfo, city: text })}
                placeholder="City"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                value={shippingInfo.state}
                onChangeText={(text) => setShippingInfo({ ...shippingInfo, state: text })}
                placeholder="State"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>ZIP Code *</Text>
              <TextInput
                style={styles.input}
                value={shippingInfo.zipCode}
                onChangeText={(text) => setShippingInfo({ ...shippingInfo, zipCode: text })}
                placeholder="ZIP"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={shippingInfo.phone}
                onChangeText={(text) => setShippingInfo({ ...shippingInfo, phone: text })}
                placeholder="Phone"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Order Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={customerNotes}
            onChangeText={setCustomerNotes}
            placeholder="Any special instructions for your order?"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Payment Info Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💳 Payment processing will be implemented in a future update.
              For now, orders will be placed as pending.
            </Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          {/* Cart Items Preview */}
          <View style={styles.itemsPreview}>
            {cart.cart.items.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.previewItem}>
                <Text style={styles.previewName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={styles.previewQty}>×{item.quantity}</Text>
                <Text style={styles.previewPrice}>
                  ${(Number(item.product.price) * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            {cart.cart.items.length > 3 && (
              <Text style={styles.moreItems}>
                + {cart.cart.items.length - 3} more {cart.cart.items.length - 3 === 1 ? 'item' : 'items'}
              </Text>
            )}
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>TBD</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>TBD</Text>
          </View>

          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Place Order</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backToCartButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backToCartText}>Back to Cart</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  backButton: {
    color: '#9333ea',
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6b21a8',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fullInput: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    padding: 16,
  },
  infoText: {
    color: '#1e3a8a',
    fontSize: 14,
  },
  itemsPreview: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  previewQty: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  previewPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9333ea',
  },
  moreItems: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9333ea',
  },
  submitButton: {
    backgroundColor: '#9333ea',
    margin: 16,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToCartButton: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backToCartText: {
    color: '#9333ea',
    fontSize: 16,
    fontWeight: '600',
  },
});
