import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, ArrowLeft, RefreshCw, CreditCard, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useSearchParams } from 'react-router-dom';
import { ShoppingList } from '../entities/ShoppingList';

interface PaymentFailurePageProps {
  onRetry: () => void;
  onContinueShopping: () => void;
}

export const PaymentFailurePage: React.FC<PaymentFailurePageProps> = ({
  onRetry,
  onContinueShopping
}) => {
  const [paymentError, setPaymentError] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [showSaveList, setShowSaveList] = useState(false);
  const [listName, setListName] = useState('');
  const [savingList, setSavingList] = useState(false);

  useEffect(() => {
    const handlePaymentFailure = async () => {
      const paymentIntentId = searchParams.get('payment_intent');
      const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
      const errorType = searchParams.get('error_type');
      const errorMessage = searchParams.get('error_message');

      if (paymentIntentId && paymentIntentClientSecret) {
        // Try to get payment intent details for more context
        try {
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_intent_id: paymentIntentId,
              client_secret: paymentIntentClientSecret,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            setPaymentError({
              type: errorType || 'payment_failed',
              message: errorMessage || errorData.error || 'Payment was not completed',
              status: errorData.status || 'failed'
            });
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          setPaymentError({
            type: 'network_error',
            message: 'Unable to verify payment status',
            status: 'unknown'
          });
        }
      } else if (errorMessage) {
        // Direct error from payment flow
        setPaymentError({
          type: errorType || 'payment_error',
          message: decodeURIComponent(errorMessage),
          status: 'failed'
        });
      } else {
        // Generic failure
        setPaymentError({
          type: 'unknown_error',
          message: 'Payment could not be completed',
          status: 'failed'
        });
      }

      setLoading(false);
    };

    handlePaymentFailure();
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

      console.log('Saving shopping list as pending:', { name: listName, itemCount: cartItems.length });

      await ShoppingList.create({
        name: listName.trim(),
        status: 'pending',
        items: cartItems.map((item: any) => ({
          product_name: item.name,
          product_image: item.image || null,
          product_description: item.description || null,
          quantity: item.quantity || 1,
          unit_price: item.price,
          product_metadata: item.metadata || null
        }))
      });

      console.log('Shopping list saved as pending successfully');
      alert(`List "${listName}" saved! You can pay for it later from your saved lists.`);
      setShowSaveList(false);
      setListName('');
      // Don't remove from sessionStorage - user might still want to retry payment
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

  const getErrorTitle = () => {
    if (!paymentError) return 'Payment Failed';
    
    switch (paymentError.type) {
      case 'card_declined':
        return 'Card Declined';
      case 'insufficient_funds':
        return 'Insufficient Funds';
      case 'card_error':
        return 'Card Error';
      case 'payment_canceled':
        return 'Payment Canceled';
      case 'authentication_required':
        return 'Authentication Required';
      default:
        return 'Payment Failed';
    }
  };

  const getErrorDescription = () => {
    if (!paymentError) return 'Your payment could not be processed.';
    
    switch (paymentError.type) {
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.';
      case 'insufficient_funds':
        return 'Your card has insufficient funds for this transaction.';
      case 'card_error':
        return 'There was an issue with your card. Please check your details and try again.';
      case 'payment_canceled':
        return 'You canceled the payment process.';
      case 'authentication_required':
        return 'Additional authentication was required but could not be completed.';
      default:
        return paymentError.message || 'Your payment could not be processed.';
    }
  };

  const getErrorIcon = () => {
    if (!paymentError) return AlertCircle;
    
    switch (paymentError.type) {
      case 'payment_canceled':
        return X;
      case 'card_error':
      case 'card_declined':
      case 'insufficient_funds':
        return CreditCard;
      default:
        return AlertCircle;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking payment status...</p>
        </div>
      </div>
    );
  }

  const ErrorIcon = getErrorIcon();

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
        <h2 className="text-base sm:text-lg font-light text-gray-900 tracking-wide">Payment Failed</h2>
        <div className="w-12 sm:w-10" />
      </div>

      {/* Failure Content */}
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
              initial={{ scale: 0, rotate: 45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 25 }}
            >
              <ErrorIcon className="w-10 h-10 text-white" />
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-3 tracking-wide">
            {getErrorTitle()}
          </h2>
          <p className="text-gray-500 text-lg font-light mb-4 max-w-md">
            {getErrorDescription()}
          </p>
          {paymentError?.type === 'payment_canceled' && (
            <p className="text-gray-400 text-sm">
              Don't worry, you haven't been charged.
            </p>
          )}
        </motion.div>


        {/* What to do next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mb-8"
        >
          <div className="bg-gray-50 rounded-3xl p-6 max-w-md">
            <p className="text-gray-600 text-sm leading-relaxed">
              Try a different payment method, check your card details are correct, or contact your bank if your card was declined.
            </p>
          </div>
        </motion.div>

        {/* Save List Section */}
        {!showSaveList ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="w-full max-w-xs mb-4"
          >
            <Button
              onClick={() => setShowSaveList(true)}
              variant="outline"
              size="sm"
              className="w-full border-2 border-dashed border-cyan-300 text-cyan-700 hover:bg-cyan-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save List & Pay Later
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xs mb-4 bg-white rounded-2xl p-4 shadow-brand border border-cyan-200"
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
                size="sm"
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
                {savingList ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="space-y-3 w-full max-w-xs"
        >
          <Button
            onClick={onRetry}
            variant="gradient"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Button
            onClick={onContinueShopping}
            variant="outline"
            size="sm"
            className="w-full shadow-brand-soft hover:shadow-brand border-gray-200"
          >
            Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentFailurePage;
