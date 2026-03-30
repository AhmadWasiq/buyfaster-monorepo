import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Package, ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useSearchParams } from 'react-router-dom';
import { User as UserEntity } from '../entities/User';
import { ShoppingList } from '../entities/ShoppingList';

interface PaymentSuccessPageProps {
  onContinueShopping: () => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({
  onContinueShopping
}) => {
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [showSaveList, setShowSaveList] = useState(false);
  const [listName, setListName] = useState('');
  const [savingList, setSavingList] = useState(false);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const paymentIntentId = searchParams.get('payment_intent');
      const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
      const redirectStatus = searchParams.get('redirect_status');

      console.log('🔍 Payment Success Page - URL Parameters:', {
        paymentIntentId,
        redirectStatus,
        hasClientSecret: !!paymentIntentClientSecret
      });

      // If we have redirect_status from Stripe, handle accordingly
      if (redirectStatus) {
        if (redirectStatus === 'failed') {
          console.error('❌ Payment redirect failed');
          // Redirect to failure page
          const errorParams = new URLSearchParams({
            error_type: 'payment_failed',
            error_message: 'Payment was not completed successfully'
          });
          if (paymentIntentId) errorParams.set('payment_intent', paymentIntentId);
          if (paymentIntentClientSecret) errorParams.set('payment_intent_client_secret', paymentIntentClientSecret);
          
          window.location.href = `/#/payment-failure?${errorParams.toString()}`;
          return;
        }
        
        if (redirectStatus === 'succeeded') {
          console.log('✅ Payment redirect succeeded - processing...');
          // For successful redirects, we can proceed without additional verification
          // since Stripe has already confirmed the payment
          if (paymentIntentId) {
            // Create a mock payment intent object for compatibility
            const mockPaymentIntent = {
              id: paymentIntentId,
              status: 'succeeded',
              client_secret: paymentIntentClientSecret
            };
            
            setPaymentIntent(mockPaymentIntent);
            setLoading(false);
            
            // Save payment method metadata if possible
            try {
              const response = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  payment_intent_id: paymentIntentId,
                  skip_client_secret: true // Skip client secret verification for redirects
                }),
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log('💾 Payment verification successful:', data);
                
                // Save payment method metadata to our database
                if (data.paymentIntent?.payment_method && data.paymentIntent?.customer) {
                  const paymentMethod = data.paymentIntent.payment_method;
                  console.log('🔍 Payment method details:', paymentMethod);
                  
                  try {
                    // Update user with Stripe customer ID
                    await UserEntity.updateStripeCustomerId(data.paymentIntent.customer);
                    
                    // Save payment method metadata
                    if (paymentMethod.type === 'card' && paymentMethod.card) {
                      await UserEntity.saveStripePaymentMethod({
                        stripe_payment_method_id: paymentMethod.id,
                        payment_type: 'card',
                        card_brand: paymentMethod.card.brand,
                        card_last_four: paymentMethod.card.last4,
                        card_exp_month: paymentMethod.card.exp_month,
                        card_exp_year: paymentMethod.card.exp_year,
                        is_default: false,
                      });
                      console.log('💳 Card payment method saved');
                    } else if (paymentMethod.type === 'paypal') {
                      await UserEntity.saveStripePaymentMethod({
                        stripe_payment_method_id: paymentMethod.id,
                        payment_type: 'paypal',
                        is_default: false,
                      });
                      console.log('🅿️ PayPal payment method saved');
                    } else if (paymentMethod.type === 'link') {
                      console.log('🔗 Link payment method automatically handled by Stripe');
                    }
                  } catch (dbError) {
                    console.warn('⚠️ Could not save payment method to database:', dbError);
                  }
                }
              }
            } catch (error) {
              console.warn('⚠️ Could not verify payment or save payment method, but payment succeeded:', error);
            }
            
            return;
          }
        }
        // For other redirect statuses, continue to verification below
      }

      if (paymentIntentId && paymentIntentClientSecret) {
        // Verify the payment was successful
        try {
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_intent_id: paymentIntentId,
              client_secret: paymentIntentClientSecret,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setPaymentIntent(data.paymentIntent);
          } else {
            console.error('Payment verification failed');
            // Redirect to failure page with verification error
            const errorData = await response.json().catch(() => ({ error: 'Verification failed' }));
            const errorParams = new URLSearchParams({
              error_type: 'verification_failed',
              error_message: errorData.error || 'Payment verification failed'
            });
            if (paymentIntentId) errorParams.set('payment_intent', paymentIntentId);
            if (paymentIntentClientSecret) errorParams.set('payment_intent_client_secret', paymentIntentClientSecret);
            
            window.location.href = `/#/payment-failure?${errorParams.toString()}`;
            return;
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
          // Redirect to failure page with network error
          const errorParams = new URLSearchParams({
            error_type: 'network_error',
            error_message: 'Unable to verify payment status'
          });
          if (paymentIntentId) errorParams.set('payment_intent', paymentIntentId);
          if (paymentIntentClientSecret) errorParams.set('payment_intent_client_secret', paymentIntentClientSecret);
          
          window.location.href = `/#/payment-failure?${errorParams.toString()}`;
          return;
        }
      } else {
        // No payment parameters - might be direct access
        console.warn('No payment intent parameters found');
        // Could redirect to home or show a generic success message
        // For now, we'll show the page but without payment details
      }

      setLoading(false);
    };

    handlePaymentSuccess();
  }, [searchParams]);

  const handleSaveList = async () => {
    if (!listName.trim()) {
      alert('Please enter a name for your list');
      return;
    }

    setSavingList(true);
    try {
      // Get cart items from sessionStorage (saved by OCRShoppingFlow)
      const cartItemsJson = sessionStorage.getItem('last_cart_items');
      if (!cartItemsJson) {
        console.error('No cart items found in sessionStorage');
        alert('No shopping list items found to save. Please complete a purchase first.');
        setShowSaveList(false);
        return;
      }

      const cartItems = JSON.parse(cartItemsJson);

      // Validate cart items
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        console.error('Invalid cart items format');
        alert('Invalid shopping list data. Please try again.');
        return;
      }

      // Validate each item has required fields
      const invalidItems = cartItems.filter(item => !item.name || typeof item.price !== 'number');
      if (invalidItems.length > 0) {
        console.error('Some cart items are missing required data:', invalidItems);
        alert('Some items in your list are incomplete. Please try again.');
        return;
      }

      console.log('Saving shopping list:', { name: listName, itemCount: cartItems.length });

      await ShoppingList.create({
        name: listName.trim(),
        items: cartItems.map((item: any) => ({
          product_name: item.name,
          product_image: item.image || null,
          product_description: item.description || null,
          quantity: item.quantity || 1,
          unit_price: item.price,
          product_metadata: item.metadata || null
        }))
      });

      console.log('Shopping list saved successfully');
      alert(`List "${listName}" saved successfully!`);
      setShowSaveList(false);
      setListName('');
      sessionStorage.removeItem('last_cart_items');
    } catch (error) {
      console.error('Failed to save shopping list:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          alert('Please log in to save your shopping list.');
        } else if (error.message.includes('User not found')) {
          alert('Account not found. Please contact support.');
        } else {
          alert(`Failed to save list: ${error.message}`);
        }
      } else {
        alert('Failed to save list. Please check your connection and try again.');
      }
    } finally {
      setSavingList(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/30 to-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onContinueShopping}
          className="text-gray-400 w-12 h-12 sm:w-10 sm:h-10 rounded-xl"
        >
          <ArrowLeft className="w-6 h-6 sm:w-5 sm:h-5" />
        </Button>
        <h2 className="text-base sm:text-lg font-light text-gray-900 tracking-wide">Payment Successful</h2>
        <div className="w-12 sm:w-10" />
      </div>

      {/* Success Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-8 sm:py-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="relative mb-8"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
            className="w-20 h-20 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/30"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 25 }}
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-3 tracking-wide">Payment Successful!</h2>
          <p className="text-gray-500 text-lg font-light mb-2">
            {paymentIntent?.payment_method_types?.includes('paypal')
              ? 'Your PayPal payment has been processed'
              : paymentIntent
              ? 'Your payment has been confirmed'
              : 'Your order has been processed'}
          </p>
          {paymentIntent?.amount && (
            <p className="text-gray-600 text-sm">
              Amount: <span className="font-medium text-green-600">${(paymentIntent.amount / 100).toFixed(2)}</span>
            </p>
          )}
          <p className="text-gray-400 text-sm font-light mt-3">
            Check your email for order confirmation
          </p>
        </motion.div>

        {/* Payment Method Info */}
        {paymentIntent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="w-full max-w-md mb-8"
          >
            <div className="bg-gray-50 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Payment Details</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {paymentIntent.payment_method_types?.includes('paypal') ? 'PayPal' : 'Card'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600 capitalize">{paymentIntent.status}</span>
                </div>
                {paymentIntent.id && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-xs text-gray-500">{paymentIntent.id}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}


        {/* Save List Section */}
        {!showSaveList ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="w-full max-w-xs mb-4"
          >
            <Button
              onClick={() => setShowSaveList(true)}
              variant="outline"
              size="sm"
              className="w-full border-2 border-dashed border-gray-300"
            >
              <Save className="w-4 h-4 mr-2" />
              Save this shopping list
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xs mb-4 bg-white rounded-2xl p-4 shadow-brand border border-gray-200"
          >
            <p className="text-sm text-gray-600 mb-2">Give your list a name:</p>
            <Input
              placeholder='e.g., "Weekly Groceries"'
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="rounded-xl mb-3"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => setShowSaveList(false)}
                variant="outline"
                className="flex-1 shadow-brand-soft hover:shadow-brand border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveList}
                disabled={savingList}
                variant="gradient"
                size="sm"
                className="flex-1"
              >
                {savingList ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="w-full max-w-xs"
        >
          <Button
            onClick={onContinueShopping}
            variant="gradient"
            size="sm"
            className="w-full"
          >
            Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage;