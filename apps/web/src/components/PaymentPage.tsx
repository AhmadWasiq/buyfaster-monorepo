import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Loader2,
  Plus,
  Check,
  CreditCard,
  ChevronDown
} from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { User as UserEntity, UserAddress, UserPaymentMethod } from '../entities/User';
import { Auth } from '../lib/auth';

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

// Production safety check
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

if (stripeKey && stripeKey.includes('pk_test_')) {
  console.warn('âš ï¸ WARNING: Using Stripe TEST keys! This will not process real payments.');
  console.warn('ðŸ”´ For production, use LIVE keys starting with pk_live_');
}

// PaymentElement styling is handled internally by Stripe

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

interface PaymentPageProps {
  cartItems: CartItem[];
  onBack: () => void;
  onPaymentSuccess: (deliveryData?: { type: string; notes: string }) => void;
}

// PayPal Button Component - handled by Stripe Elements automatically
// PayPal integration is now handled directly through Stripe Elements
// Users will see a PayPal button when PayPal is enabled in Stripe

// New Payment Method Section Component
const NewPaymentSection = ({ cartItems, shippingAddress, onPaymentSuccess, onCancel }: {
  cartItems: CartItem[];
  shippingAddress: ShippingAddress;
  onPaymentSuccess: (paymentIntent?: any) => void;
  onCancel?: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePayment = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setPaymentError('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/#/payment-success`,
          receipt_email: shippingAddress.email,
        },
        redirect: 'if_required',
      });

      setIsProcessing(false);

      if (error) {
        // Handle different types of errors
        if (error.type === 'card_error' || error.type === 'validation_error') {
          handlePaymentError(error.message || 'Payment failed');
        } else {
          handlePaymentError('An unexpected error occurred. Please try again.');
        }
      } else if (paymentIntent) {
        // Payment completed without redirect
        if (paymentIntent.status === 'succeeded') {
          onPaymentSuccess(paymentIntent);
        } else if (paymentIntent.status === 'processing') {
          // Payment is being processed (e.g., bank transfers)
          window.location.href = `/#/payment-success?payment_intent=${paymentIntent.id}&payment_intent_client_secret=${paymentIntent.client_secret}`;
        } else if (paymentIntent.status === 'requires_action') {
          // This shouldn't happen with redirect: 'if_required', but just in case
          setPaymentError('Payment requires additional authentication. Please try again.');
        } else {
          handlePaymentError(`Payment ${paymentIntent.status}. Please try again.`);
        }
      }
      // Note: If redirect is required, the user will be redirected and then return via the return_url
    } catch (err) {
      setIsProcessing(false);
      console.error('Payment error:', err);
      handlePaymentError('An unexpected error occurred. Please try again.');
    }
  };

  // Enhanced error handling
  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    setIsProcessing(false);
    
    // Auto-clear error after 10 seconds
    setTimeout(() => {
      setPaymentError('');
    }, 10000);
  };

  return (
    <div className="space-y-3 md:space-y-4">

      {/* Payment Element */}
      <div className="p-4 md:p-5 bg-gray-50 md:bg-white md:border-2 md:border-gray-200 rounded-2xl">
        <PaymentElement
          onReady={() => setPaymentElementReady(true)}
          options={{
            layout: 'tabs',
            // Prioritize Link as the main payment method for one-click payments
            paymentMethodOrder: ['link', 'card', 'paypal'],
            fields: {
              billingDetails: {
                // Save customer details for Link - include phone for verification
                name: 'auto',
                email: 'auto',
                phone: 'auto'
              }
            }
          }}
        />
      </div>
      
      {/* Error Message */}
      {paymentError && (
        <div className="p-3 md:p-4 bg-red-50 border border-red-200 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3">
          <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
          <span className="text-xs md:text-sm text-red-700">{paymentError}</span>
        </div>
      )}


       {/* Payment Buttons */}
       <div className="space-y-2 md:space-y-3">
         {onCancel && (
           <button
             type="button"
             onClick={onCancel}
             className="w-full p-3 md:p-4 rounded-2xl bg-gray-50 active:bg-gray-200 transition-colors text-gray-700 font-medium text-sm md:text-base"
             style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
           >
             Cancel
           </button>
         )}
         <Button
           onClick={handlePayment}
           disabled={isProcessing || !stripe || !paymentElementReady}
           variant="gradient"
           className="w-full"
         >
           {isProcessing ? (
             <>
               <Loader2 className="w-5 h-5 mr-2 animate-spin" />
               Processing...
             </>
           ) : (
             `Pay $${total.toFixed(2)}`
           )}
         </Button>
       </div>
    </div>
  );
};

// PaymentForm component removed - functionality merged into PaymentSection

// Main Payment Page Component
const PaymentPageContent = ({ cartItems, onBack, onPaymentSuccess }: PaymentPageProps) => {
  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'FR',
  });

  // Payment method state
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<UserPaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'saved' | 'new' | 'loading'>('loading');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);

  // Delivery options state
  const [deliveryType, setDeliveryType] = useState<'express' | 'standard'>('express'); // Default to express (1h)
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [showDeliveryNotes, setShowDeliveryNotes] = useState<boolean>(false);

  // Load saved addresses, payment methods and user profile on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current authenticated user
        const authUser = await Auth.waitForAuth();
        if (!authUser) {
          console.warn('No authenticated user found, showing new forms');
          setShowNewAddressForm(true);
          setPaymentMode('new');
          return;
        }
        
        setCurrentUserId(authUser.id);
        
        // Load user profile, addresses, and payment methods
        const [userProfile, addresses, paymentMethods, customerId] = await Promise.all([
          UserEntity.getCurrentUser(),
          UserEntity.getAddresses('shipping'),
          UserEntity.getPaymentMethods(),
          UserEntity.getStripeCustomerId()
        ]);
        
        setSavedAddresses(addresses);
        setSavedPaymentMethods(paymentMethods);
        setStripeCustomerId(customerId);
        
        // Handle addresses
        const defaultAddress = addresses.find(addr => addr.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id!);
          setShippingAddress(convertUserAddressToShippingAddress(defaultAddress));
        } else if (addresses.length === 0) {
          // If no saved addresses, pre-populate form with user profile data if available
          setShippingAddress(prev => ({
            ...prev,
            firstName: userProfile?.first_name || '',
            lastName: userProfile?.last_name || '',
            email: userProfile?.email || Auth.getUserEmail() || '',
            phone: userProfile?.phone || '',
          }));
          setShowNewAddressForm(true);
        }

        // Handle payment methods
        if (paymentMethods.length > 0) {
          const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default);
          if (defaultPaymentMethod) {
            setSelectedPaymentMethodId(defaultPaymentMethod.id!);
          }
          setPaymentMode('saved');
        } else {
          setPaymentMode('new');
          setShowNewPaymentForm(true);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        setShowNewAddressForm(true);
        setPaymentMode('new');
        setShowNewPaymentForm(true);
      }
    };

    loadUserData();
  }, []);

  // Convert UserAddress to ShippingAddress format
  const convertUserAddressToShippingAddress = (userAddress: UserAddress): ShippingAddress => ({
    firstName: userAddress.first_name,
    lastName: userAddress.last_name,
    email: Auth.getUserEmail() || '', // Get email from real auth
    phone: userAddress.phone || '',
    address: userAddress.address_line_1,
    city: userAddress.city,
    zipCode: userAddress.postal_code,
    country: userAddress.country,
  });

  // Convert ShippingAddress to UserAddress format
  const convertShippingAddressToUserAddress = (shippingAddr: ShippingAddress): Omit<UserAddress, 'id' | 'created_at' | 'updated_at'> => ({
    user_id: currentUserId,
    address_type: 'shipping',
    first_name: shippingAddr.firstName,
    last_name: shippingAddr.lastName,
    address_line_1: shippingAddr.address,
    address_line_2: '',
    city: shippingAddr.city,
    state: '',
    postal_code: shippingAddr.zipCode,
    country: shippingAddr.country,
    phone: shippingAddr.phone,
    is_default: savedAddresses.length === 0, // Make first address default
  });

  const handleAddressSelect = (addressId: string) => {
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      setShippingAddress(convertUserAddressToShippingAddress(address));
      setShowNewAddressForm(false);
    }
  };

  const handleNewAddressToggle = async () => {
    setShowNewAddressForm(!showNewAddressForm);
    if (!showNewAddressForm) {
      try {
        // Get user profile to pre-populate form
        const userProfile = await UserEntity.getCurrentUser();
        
        // Reset form when showing new address form, but pre-populate with profile data
        setShippingAddress({
          firstName: userProfile?.first_name || '',
          lastName: userProfile?.last_name || '',
          email: userProfile?.email || Auth.getUserEmail() || '',
          phone: userProfile?.phone || '',
          address: '',
          city: '',
          zipCode: '',
          country: 'FR',
        });
      } catch (error) {
        // Fallback to basic form if profile loading fails
        setShippingAddress({
          firstName: '',
          lastName: '',
          email: Auth.getUserEmail() || '',
          phone: '',
          address: '',
          city: '',
          zipCode: '',
          country: 'FR',
        });
      }
      setSelectedAddressId('');
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'zipCode'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field as keyof ShippingAddress]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Save new address if requested and user is entering a new address
    if (showNewAddressForm && saveNewAddress && currentUserId) {
      try {
        const userAddress = convertShippingAddressToUserAddress(shippingAddress);
        const savedAddress = await UserEntity.createAddress(userAddress);
        setSavedAddresses([...savedAddresses, savedAddress]);
        setSelectedAddressId(savedAddress.id!);
      } catch (error) {
        console.error('Failed to save address:', error);
        // Continue anyway - don't block checkout
      }
    }

    // Address validation completed - form is ready for payment
  };

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  // Payment method handlers
  const handlePaymentMethodSelect = (paymentMethodId: string) => {
    setSelectedPaymentMethodId(paymentMethodId);
    setShowNewPaymentForm(false);
  };

  const handleNewPaymentMethodToggle = () => {
    setShowNewPaymentForm(!showNewPaymentForm);
    if (!showNewPaymentForm) {
      setSelectedPaymentMethodId('');
    }
  };

  const handleSavedPaymentMethodPayment = async () => {
    if (!selectedPaymentMethodId || !stripeCustomerId) return;

    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      const response = await fetch('/api/stripe-payments/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: stripeCustomerId,
          amount: Math.round(total * 100), // Convert to cents
          paymentMethodId: selectedPaymentMethodId,
          currency: 'usd',
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        if (result.error === 'authentication_required') {
          // Handle 3D Secure authentication
          setPaymentError('This payment requires additional authentication. Please add a new payment method.');
          setShowNewPaymentForm(true);
        } else {
          setPaymentError(result.error);
        }
      } else if (result.status === 'succeeded') {
        // Send order confirmation email for saved payment methods
        try {
          await fetch('/api/send-order-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerEmail: shippingAddress.email,
              customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
              orderNumber: result.paymentIntentId?.slice(-8).toUpperCase() || 'UNKNOWN',
              items: cartItems,
              total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
              shippingAddress,
              deliveryType,
              deliveryNotes,
            }),
          });
        } catch (error) {
          console.error('Failed to send order email:', error);
        }
        onPaymentSuccess({
          type: deliveryType,
          notes: deliveryNotes
        });
      } else {
        setPaymentError(`Payment ${result.status}. Please try again.`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    // Save payment method metadata to our database
    if (paymentIntent.payment_method && currentUserId) {
      try {
        const paymentMethod = paymentIntent.payment_method;
        
        if (paymentMethod.type === 'card' && paymentMethod.card) {
          await UserEntity.saveStripePaymentMethod({
            stripe_payment_method_id: paymentMethod.id,
            payment_type: 'card',
            card_brand: paymentMethod.card.brand,
            card_last_four: paymentMethod.card.last4,
            card_exp_month: paymentMethod.card.exp_month,
            card_exp_year: paymentMethod.card.exp_year,
            is_default: savedPaymentMethods.length === 0, // Make first payment method default
          });
        }

        // Update user with Stripe customer ID if needed
        if (paymentIntent.customer && !stripeCustomerId) {
          await UserEntity.updateStripeCustomerId(paymentIntent.customer);
        }
      } catch (error) {
        console.error('Failed to save payment method:', error);
        // Don't block the success flow for this
      }
    }

    // Send order confirmation email
    try {
      await fetch('/api/send-order-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: shippingAddress.email,
          customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          orderNumber: paymentIntent.id.slice(-8).toUpperCase(),
          items: cartItems,
          total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          shippingAddress,
          deliveryType,
          deliveryNotes,
        }),
      });
    } catch (error) {
      console.error('Failed to send order email:', error);
      // Don't block success flow
    }
    
    onPaymentSuccess();
  };

  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mobile keyboard visibility (iOS & Android)
  useEffect(() => {
    if (!isMobile) return;

    // Detect platform for platform-specific delays
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // Use appropriate delay based on platform
    const scrollDelay = isIOS ? 300 : isAndroid ? 200 : 150;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsKeyboardVisible(true);
        
        // Scroll the focused element into view smoothly
        setTimeout(() => {
          target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }, scrollDelay);
      }
    };

    const handleBlur = () => {
      // Delay to check if another input is focused
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          setIsKeyboardVisible(false);
        }
      }, 100);
    };

    // Handle viewport resize for Android keyboard detection
    const handleResize = () => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        // Keyboard is likely visible
        setIsKeyboardVisible(true);
      } else {
        setIsKeyboardVisible(false);
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    
    // Android often doesn't fire focus events properly, use resize as backup
    if (isAndroid) {
      window.visualViewport?.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      if (isAndroid) {
        window.visualViewport?.removeEventListener('resize', handleResize);
      }
    };
  }, [isMobile]);

  // Handle touch events for swipe-to-dismiss (mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return; // Disable on desktop
    if (sheetRef.current) {
      const touch = e.touches[0];
      setStartY(touch.clientY);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return; // Disable on desktop
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;
    if (deltaY > 0) { // Only allow downward drag
      setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return; // Disable on desktop
    if (currentY > 100) { // Threshold for dismissing
      onBack();
    }
    setCurrentY(0);
    setIsDragging(false);
    setStartY(0);
  };

  // Shared content component to avoid duplicate PaymentElement mounting
  const renderAddressSection = (isDesktopStyle: boolean) => {
    const containerClass = isDesktopStyle ? "space-y-4" : "space-y-3";
    const headerClass = isDesktopStyle ? "text-lg font-semibold text-gray-900" : "text-sm font-semibold text-gray-700 uppercase tracking-wider";
    const cardPadding = isDesktopStyle ? "p-5" : "p-4";
    const borderClass = isDesktopStyle ? "border-2" : "";
    const bgClass = isDesktopStyle ? "border-gray-200" : "bg-gray-50";
    
    return (
      <>
                {/* Saved Addresses */}
                {savedAddresses.length > 0 && !showNewAddressForm && (
          <div className={containerClass}>
            <h3 className={headerClass}>{isDesktopStyle ? 'Shipping Address' : 'Deliver To'}</h3>
            <div className={isDesktopStyle ? "grid gap-4" : "space-y-3"}>
                    {savedAddresses.map((address) => (
                      <div
                        key={address.id}
                  className={`${cardPadding} ${borderClass} rounded-2xl cursor-pointer transition-all ${
                          selectedAddressId === address.id
                      ? 'border-cyan-600 bg-cyan-50 shadow-md' + (isDesktopStyle ? '' : ' ring-2 ring-cyan-600')
                      : bgClass + (isDesktopStyle ? ' border-gray-200 hover:border-gray-300' : ' hover:bg-gray-100')
                        }`}
                        onClick={() => handleAddressSelect(address.id!)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                      <h4 className={`font-semibold text-gray-900 ${isDesktopStyle ? 'mb-2' : 'mb-1'}`}>
                                {address.first_name} {address.last_name}
                              </h4>
                      <div className={`text-gray-600 ${isDesktopStyle ? 'space-y-1' : 'text-sm leading-relaxed'}`}>
                        <p>{address.address_line_1}</p>
                        <p>{address.city} {address.postal_code}</p>
                      </div>
                    </div>
                    {selectedAddressId === address.id && (
                      <Check className={`${isDesktopStyle ? 'w-6 h-6 ml-4' : 'w-5 h-5 ml-3 mt-0.5'} text-cyan-600 flex-shrink-0`} />
                    )}
                  </div>
                </div>
              ))}
            </div>

             <button
               type="button"
               onClick={handleNewAddressToggle}
               className={`w-full ${isDesktopStyle ? 'p-4 border-2 border-dashed border-gray-300 hover:border-cyan-600 hover:bg-cyan-50' : 'p-3 bg-gray-50 active:bg-gray-200'} rounded-2xl transition-all text-cyan-600 font-medium ${isDesktopStyle ? '' : 'text-sm'} flex items-center justify-center`}
               style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
             >
               <Plus className={`${isDesktopStyle ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
               Use {isDesktopStyle ? 'a ' : ''}Different Address
             </button>
          </div>
        )}

        {/* New Address Form */}
        {(showNewAddressForm || savedAddresses.length === 0) && (
          <div className={containerClass}>
            <div className="flex items-center justify-between">
              <h3 className={headerClass}>
                {savedAddresses.length > 0 ? 'New Address' : (isDesktopStyle ? 'Shipping Address' : 'Deliver To')}
              </h3>
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={handleNewAddressToggle}
                  className={`text-cyan-600 ${isDesktopStyle ? 'hover:text-cyan-700' : ''} font-medium ${isDesktopStyle ? '' : 'text-sm'}`}
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleAddressSubmit} className={containerClass}>
              <div className={`grid grid-cols-2 gap-${isDesktopStyle ? '4' : '2'}`}>
                <Input
                  placeholder="First name"
                  value={shippingAddress.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`rounded-xl ${isDesktopStyle ? 'border-gray-300 focus:border-cyan-600 focus:ring-cyan-600' : 'bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-cyan-600'}`}
                  required
                />
                <Input
                  placeholder="Last name"
                  value={shippingAddress.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`rounded-xl ${isDesktopStyle ? 'border-gray-300 focus:border-cyan-600 focus:ring-cyan-600' : 'bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-cyan-600'}`}
                  required
                />
              </div>

              <Input
                type="email"
                placeholder="Email"
                value={shippingAddress.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`rounded-xl ${isDesktopStyle ? 'border-gray-300 focus:border-cyan-600 focus:ring-cyan-600' : 'bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-cyan-600'}`}
                required
              />

              <Input
                placeholder="Street address"
                value={shippingAddress.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`rounded-xl ${isDesktopStyle ? 'border-gray-300 focus:border-cyan-600 focus:ring-cyan-600' : 'bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-cyan-600'}`}
                required
              />

              <div className={`grid grid-cols-2 gap-${isDesktopStyle ? '4' : '2'}`}>
                <Input
                  placeholder="City"
                  value={shippingAddress.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`rounded-xl ${isDesktopStyle ? 'border-gray-300 focus:border-cyan-600 focus:ring-cyan-600' : 'bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-cyan-600'}`}
                  required
                />
                <Input
                  placeholder="Postal code"
                  value={shippingAddress.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className={`rounded-xl ${isDesktopStyle ? 'border-gray-300 focus:border-cyan-600 focus:ring-cyan-600' : 'bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-cyan-600'}`}
                  required
                />
              </div>

              {currentUserId && (
                <div className={`flex items-center gap-2 ${isDesktopStyle ? 'pt-2' : 'pt-1'}`}>
                  <input
                    type="checkbox"
                    id={isDesktopStyle ? "saveAddressDesktop" : "saveAddress"}
                    checked={saveNewAddress}
                    onChange={(e) => setSaveNewAddress(e.target.checked)}
                    className={`rounded w-4 h-4 text-cyan-600 focus:ring-cyan-600 ${isDesktopStyle ? 'border-gray-300' : ''}`}
                  />
                  <label htmlFor={isDesktopStyle ? "saveAddressDesktop" : "saveAddress"} className="text-sm text-gray-600">
                    Save for future orders
                  </label>
                </div>
              )}
            </form>
          </div>
        )}
      </>
    );
  };

  const renderPaymentSection = (isDesktopStyle: boolean) => {
    const containerClass = isDesktopStyle ? "space-y-4" : "space-y-3";
    const headerClass = isDesktopStyle ? "text-lg font-semibold text-gray-900" : "text-sm font-semibold text-gray-700 uppercase tracking-wider";
    const cardPadding = isDesktopStyle ? "p-5" : "p-4";
    
    return (
      <div className={containerClass}>
        <h3 className={headerClass}>Payment{isDesktopStyle ? ' Method' : ''}</h3>
        
        {paymentError && (
          <div className={`${isDesktopStyle ? 'p-4' : 'p-3'} bg-red-50 ${isDesktopStyle ? 'border border-red-200' : ''} rounded-xl ${isDesktopStyle ? 'md:rounded-2xl' : ''} flex items-center gap-${isDesktopStyle ? '3' : '2'}`}>
            <AlertCircle className={`${isDesktopStyle ? 'w-5 h-5' : 'w-4 h-4'} text-red-600 flex-shrink-0`} />
            <span className={`${isDesktopStyle ? 'text-sm' : 'text-xs'} text-red-700`}>{paymentError}</span>
          </div>
        )}

        {paymentMode === 'saved' && savedPaymentMethods.length > 0 && !showNewPaymentForm && (
          <div className={containerClass}>
            <div className={isDesktopStyle ? "grid gap-4" : "space-y-3"}>
              {savedPaymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`${cardPadding} ${isDesktopStyle ? 'border-2' : ''} rounded-2xl cursor-pointer transition-all ${
                    selectedPaymentMethodId === method.id
                      ? 'border-cyan-600 bg-cyan-50 shadow-md' + (isDesktopStyle ? '' : ' ring-2 ring-cyan-600')
                      : (isDesktopStyle ? 'border-gray-200 hover:border-gray-300' : 'bg-gray-50 hover:bg-gray-100')
                  }`}
                  onClick={() => handlePaymentMethodSelect(method.id!)}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-${isDesktopStyle ? '4' : '3'}`}>
                      <div className={`${isDesktopStyle ? 'w-14 h-14 border border-gray-200' : 'w-10 h-10'} bg-white rounded-xl flex items-center justify-center shadow-sm`}>
                        <CreditCard className={`${isDesktopStyle ? 'w-7 h-7' : 'w-5 h-5'} text-gray-600`} />
                      </div>
                      <div>
                        <h4 className={`font-semibold text-gray-900 capitalize ${isDesktopStyle ? 'text-lg' : ''}`}>
                          {method.card_brand} â€¢â€¢â€¢â€¢ {method.card_last_four}
                        </h4>
                        <p className={`${isDesktopStyle ? 'text-sm' : 'text-xs'} text-gray-500`}>
                          Exp{isDesktopStyle ? 'ires' : ''} {method.card_exp_month}/{method.card_exp_year}
                        </p>
                      </div>
                    </div>
                    {selectedPaymentMethodId === method.id && (
                      <Check className={`${isDesktopStyle ? 'w-6 h-6' : 'w-5 h-5'} text-cyan-600 flex-shrink-0`} />
                    )}
                  </div>
                </div>
              ))}
            </div>

             {selectedPaymentMethodId && (
               <Button
                 onClick={handleSavedPaymentMethodPayment}
                 disabled={isProcessingPayment}
                 variant="gradient"
                 className="w-full"
               >
                 {isProcessingPayment ? (
                   <>
                     <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                     Processing...
                   </>
                 ) : (
                   `Pay $${cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}`
                 )}
               </Button>
             )}

             <button
               type="button"
               onClick={handleNewPaymentMethodToggle}
               className={`w-full ${isDesktopStyle ? 'p-4 border-2 border-dashed border-gray-300 hover:border-cyan-600 hover:bg-cyan-50' : 'p-3 bg-gray-50 active:bg-gray-200'} rounded-2xl transition-all text-cyan-600 font-medium ${isDesktopStyle ? '' : 'text-sm'} flex items-center justify-center`}
               style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
             >
               <Plus className={`${isDesktopStyle ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
               {isDesktopStyle ? 'Use a Different Payment Method' : 'Different Payment Method'}
             </button>
                            </div>
        )}

        {(paymentMode === 'new' || showNewPaymentForm) && (
          <NewPaymentSection 
            cartItems={cartItems}
            shippingAddress={shippingAddress}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={savedPaymentMethods.length > 0 ? handleNewPaymentMethodToggle : undefined}
          />
        )}
      </div>
    );
  };

  const renderDeliveryOptionsSection = (isDesktopStyle: boolean) => {
    const containerClass = isDesktopStyle ? "space-y-4" : "space-y-3";
    const headerClass = isDesktopStyle ? "text-lg font-semibold text-gray-900" : "text-sm font-semibold text-gray-700 uppercase tracking-wider";
    const cardPadding = isDesktopStyle ? "p-5" : "p-4";
    const borderClass = isDesktopStyle ? "border-2" : "";
    const bgClass = isDesktopStyle ? "border-gray-200" : "bg-gray-50";

    return (
      <div className={containerClass}>
        <h3 className={headerClass}>{isDesktopStyle ? 'Delivery Options' : 'Delivery'}</h3>

        {/* Delivery Type Options */}
        <div className={isDesktopStyle ? "grid gap-4" : "space-y-3"}>
          {/* Express Delivery (1h) - Default */}
          <div
            className={`${cardPadding} ${borderClass} rounded-2xl cursor-pointer transition-all ${
              deliveryType === 'express'
                ? 'border-cyan-600 bg-cyan-50 shadow-md' + (isDesktopStyle ? '' : ' ring-2 ring-cyan-600')
                : bgClass + (isDesktopStyle ? ' border-gray-200 hover:border-gray-300' : ' hover:bg-gray-100')
            }`}
            onClick={() => setDeliveryType('express')}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    deliveryType === 'express' ? 'bg-cyan-600' : 'border-2 border-gray-300'
                  }`}>
                    {deliveryType === 'express' && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h4 className={`font-semibold text-gray-900 ${isDesktopStyle ? 'text-base' : 'text-sm'}`}>
                      Express Delivery
                    </h4>
                    <p className={`${isDesktopStyle ? 'text-sm' : 'text-xs'} text-gray-500`}>
                      Within 1 hour • Fast & convenient
                    </p>
                  </div>
                </div>
              </div>
              {deliveryType === 'express' && (
                <Check className={`${isDesktopStyle ? 'w-6 h-6' : 'w-5 h-5'} text-cyan-600 flex-shrink-0`} />
              )}
            </div>
          </div>

          {/* Standard Delivery (24h) */}
          <div
            className={`${cardPadding} ${borderClass} rounded-2xl cursor-pointer transition-all ${
              deliveryType === 'standard'
                ? 'border-cyan-600 bg-cyan-50 shadow-md' + (isDesktopStyle ? '' : ' ring-2 ring-cyan-600')
                : bgClass + (isDesktopStyle ? ' border-gray-200 hover:border-gray-300' : ' hover:bg-gray-100')
            }`}
            onClick={() => setDeliveryType('standard')}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    deliveryType === 'standard' ? 'bg-cyan-600' : 'border-2 border-gray-300'
                  }`}>
                    {deliveryType === 'standard' && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h4 className={`font-semibold text-gray-900 ${isDesktopStyle ? 'text-base' : 'text-sm'}`}>
                      Standard Delivery
                    </h4>
                    <p className={`${isDesktopStyle ? 'text-sm' : 'text-xs'} text-gray-500`}>
                      Within 24 hours • Most popular
                    </p>
                  </div>
                </div>
              </div>
              {deliveryType === 'standard' && (
                <Check className={`${isDesktopStyle ? 'w-6 h-6' : 'w-5 h-5'} text-cyan-600 flex-shrink-0`} />
              )}
            </div>
          </div>
        </div>

        {/* Delivery Notes - Collapsible */}
        {!showDeliveryNotes ? (
          <button
            type="button"
            onClick={() => setShowDeliveryNotes(true)}
            className={`w-full ${cardPadding} ${borderClass} rounded-2xl ${bgClass} text-left hover:bg-gray-50 transition-colors`}
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className={`${isDesktopStyle ? 'w-4 h-4' : 'w-3 h-3'} text-cyan-600`} />
                <span className={`${isDesktopStyle ? 'text-sm' : 'text-xs'} font-medium text-gray-700`}>
                  Add delivery instructions (optional)
                </span>
              </div>
              <span className={`${isDesktopStyle ? 'text-xs' : 'text-[10px]'} text-gray-500`}>
                {deliveryNotes ? 'Edit' : 'Add'}
              </span>
            </div>
          </button>
        ) : (
          <div className={`${cardPadding} ${borderClass} rounded-2xl ${bgClass}`}>
            <div className="flex items-center justify-between mb-3">
              <label className={`block ${isDesktopStyle ? 'text-sm font-medium' : 'text-xs font-semibold'} text-gray-700`}>
                Delivery Instructions (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowDeliveryNotes(false)}
                className={`${isDesktopStyle ? 'text-xs' : 'text-[10px]'} text-gray-500 hover:text-gray-700 transition-colors`}
              >
                Done
              </button>
            </div>
            <Textarea
              placeholder="e.g., Leave at front door, call when arriving..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className={`rounded-xl ${isDesktopStyle ? 'border-gray-300 focus:border-cyan-600 focus:ring-cyan-600' : 'bg-white border-0 focus-visible:ring-2 focus-visible:ring-cyan-600'} ${isDesktopStyle ? '' : 'text-sm'}`}
              rows={2}
              autoFocus
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isMobile ? (
        <>
          {/* Mobile: Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={onBack}
          />
          
          {/* Mobile: Bottom Sheet */}
          <div 
            ref={sheetRef}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[32px] shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out overflow-hidden"
            style={{
              transform: isDragging ? `translateY(${currentY}px)` : 'translateY(0)',
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
              maxHeight: isKeyboardVisible ? '100vh' : '90vh',
              height: isKeyboardVisible ? '100vh' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag Handle */}
            <div 
              className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing transition-all"
              style={{
                opacity: isKeyboardVisible ? 0.5 : 1,
                pointerEvents: isKeyboardVisible ? 'none' : 'auto'
              }}
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-3" />
              <div className="flex items-center justify-between w-full px-6">
                <button
                  onClick={onBack}
                  className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900">
                  Checkout
                </h2>
                <div className="w-10" />
              </div>
            </div>

            {/* Scrollable Content */}
            <div 
              ref={contentRef}
              className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
              }}
            >
              <div className="space-y-6 pb-6" style={{ minHeight: 'min-content' }}>
                {renderAddressSection(false)}
                {renderDeliveryOptionsSection(false)}
                {renderPaymentSection(false)}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Desktop: Full Page Layout */
        <div className="min-h-screen bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 -ml-2"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
            <h2 className="text-xl font-light text-gray-900 tracking-wide">
              Billing & Shipping
            </h2>
            <div className="w-9" />
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <div className="max-w-2xl mx-auto space-y-8">
              {renderAddressSection(true)}
              {renderDeliveryOptionsSection(true)}
              {renderPaymentSection(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Wrapper component with Stripe Elements provider
export const PaymentPage = (props: PaymentPageProps) => {
  const [clientSecret, setClientSecret] = useState<string>('');

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // Calculate total from cart items (no tax or shipping)
        const total = props.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Get user info for customer creation (including phone for Link)
        const email = Auth.getUserEmail() || '';
        const stripeCustomerId = await UserEntity.getStripeCustomerId();
        const userProfile = await UserEntity.getCurrentUser();
        const phone = userProfile?.phone;
        
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(total * 100), // Convert to cents
            currency: 'eur', // Use EUR for French market compliance
            email: email, // Pass email for customer creation
            phone: phone, // Pass phone for Link verification
            customerId: stripeCustomerId, // Pass existing customer ID if available
            setup_future_usage: 'off_session', // Enable saving for all payment types
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const { client_secret } = await response.json();
        setClientSecret(client_secret);
      } catch (error) {
        console.error('Failed to initialize payment:', error);
        alert('Failed to initialize payment. Please try again.');
      }
    };

    if (props.cartItems.length > 0) {
      createPaymentIntent();
    }
  }, [props.cartItems]);

  if (!clientSecret) {
    // Show loading while getting clientSecret
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-25 flex items-center justify-center p-4">
        {/* Main loading card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm mx-auto"
        >
          {/* Card container */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-cyan-500/10 border border-white/50 p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-lg"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="white"/>
                  </svg>
                </motion.div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2"
              >
                Secure Payment
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 text-sm sm:text-base font-medium"
              >
                Preparing your transaction...
              </motion.p>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 0.5
                }}
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret }}
    >
      <PaymentPageContent {...props} />
    </Elements>
  );
};

export default PaymentPage;
