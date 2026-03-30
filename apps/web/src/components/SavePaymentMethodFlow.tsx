import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from './ui/button';
import { X, Shield, Loader2, Check } from 'lucide-react';
import { User as UserEntity } from '../entities/User';
import { Auth } from '../lib/auth';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

interface SavePaymentMethodFlowProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const SavePaymentMethodForm: React.FC<{
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  const handleSavePaymentMethod = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError('');

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/#/profile`, // Return to profile page
        },
        redirect: 'if_required',
      });

      if (error) {
        setError(error.message || 'Failed to save payment method');
      } else if (setupIntent) {
        if (setupIntent.status === 'succeeded') {
          // Payment method saved successfully
          console.log('✅ Payment method saved:', setupIntent);
          
          // Save payment method metadata to our database
          if (setupIntent.payment_method) {
            try {
              const paymentMethod = setupIntent.payment_method;
              
              if (typeof paymentMethod === 'object' && paymentMethod.type === 'card' && paymentMethod.card) {
                await UserEntity.saveStripePaymentMethod({
                  stripe_payment_method_id: paymentMethod.id,
                  payment_type: 'card',
                  card_brand: paymentMethod.card.brand,
                  card_last_four: paymentMethod.card.last4,
                  card_exp_month: paymentMethod.card.exp_month,
                  card_exp_year: paymentMethod.card.exp_year,
                  is_default: false, // Let user set default manually
                });
              } else if (typeof paymentMethod === 'object' && paymentMethod.type === 'paypal') {
                await UserEntity.saveStripePaymentMethod({
                  stripe_payment_method_id: paymentMethod.id,
                  payment_type: 'paypal',
                  is_default: false,
                });
              }

              // Update user with Stripe customer ID if needed
              // Note: Customer ID is handled during SetupIntent creation, so we don't need to update it here
            } catch (dbError) {
              console.warn('⚠️ Could not save payment method metadata:', dbError);
              // Still consider it successful since Stripe has the payment method
            }
          }
          
          onSuccess();
        } else {
          setError(`Setup ${setupIntent.status}. Please try again.`);
        }
      }
    } catch (err) {
      console.error('Payment method save error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Add Payment Method</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-4 border-2 border-gray-200 rounded-2xl">
        <PaymentElement
          onReady={() => setPaymentElementReady(true)}
          options={{
            // SetupIntent mode is handled automatically by Stripe Elements
            fields: {
              billingDetails: {
                name: 'auto',
                email: 'auto'
              }
            }
          }}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <X className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
        <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
        <span className="text-sm text-green-700">
          Your payment information is securely saved for future purchases
        </span>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 rounded-2xl"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSavePaymentMethod}
          disabled={isProcessing || !stripe || !paymentElementReady}
          variant="gradient"
          size="sm"
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Payment Method
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export const SavePaymentMethodFlow: React.FC<SavePaymentMethodFlowProps> = (props) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createSetupIntent = async () => {
      try {
        const email = Auth.getUserEmail() || '';
        const customerId = await UserEntity.getStripeCustomerId();

        const response = await fetch('/api/save-payment-method', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            customerId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create setup intent');
        }

        const { client_secret, customer_id } = await response.json();
        setClientSecret(client_secret);

        // Update customer ID if needed
        if (customer_id && !customerId) {
          await UserEntity.updateStripeCustomerId(customer_id);
        }
      } catch (error) {
        console.error('Failed to initialize payment method saving:', error);
        props.onCancel();
      } finally {
        setLoading(false);
      }
    };

    createSetupIntent();
  }, [props]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600">Preparing secure form...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Failed to initialize payment method saving</p>
        <Button onClick={props.onCancel} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0891b2',
          }
        }
      }}
    >
      <SavePaymentMethodForm {...props} />
    </Elements>
  );
};

export default SavePaymentMethodFlow;
