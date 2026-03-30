import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Production safety check
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
if (stripeSecretKey && stripeSecretKey.includes('sk_test_')) {
  console.warn('⚠️ WARNING: Using Stripe TEST secret key! This will not process real payments.');
  console.warn('🔴 For production, use LIVE secret key starting with sk_live_');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if Stripe secret key is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY environment variable is not set');
      return res.status(500).json({
        error: 'Payment service not configured',
        details: 'Stripe secret key is missing. Please configure STRIPE_SECRET_KEY environment variable.'
      });
    }

    if (stripeSecretKey.includes('sk_test_')) {
      console.warn('⚠️ WARNING: Using Stripe TEST secret key! This will not process real payments.');
    }

    const { amount, currency = 'eur', email, customerId, setup_future_usage = 'off_session', phone } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    console.log('Creating payment intent:', { amount, currency, email: email ? 'provided' : 'not provided', customerId: customerId ? 'provided' : 'not provided' });

    let customer;

    // If customerId is provided, use existing customer
    if (customerId) {
      try {
        console.log('Retrieving existing Stripe customer:', customerId);
        customer = await stripe.customers.retrieve(customerId);
        if ('deleted' in customer && customer.deleted) {
          console.log('Customer deleted, creating new one');
          customer = await stripe.customers.create({ email });
        } else {
          console.log('Using existing customer');
        }
      } catch (error: any) {
        console.error('Error retrieving customer, creating new one:', error.message);
        try {
          customer = await stripe.customers.create({ email });
        } catch (createError: any) {
          console.error('Error creating new customer:', createError.message);
          return res.status(500).json({
            error: 'Failed to create or retrieve customer',
            details: 'Customer creation failed. Please check your Stripe configuration.'
          });
        }
      }
    } else if (email) {
      try {
        console.log('Creating new Stripe customer with phone support for Link');
        customer = await stripe.customers.create({
          email,
          phone: phone || undefined // Include phone number for Link verification if available
        });
      } catch (error: any) {
        console.error('Error creating customer:', error.message);
        return res.status(500).json({
          error: 'Failed to create customer',
          details: 'Customer creation failed. Please check your Stripe configuration.'
        });
      }
    }

    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount), // Ensure amount is an integer
      currency: currency.toLowerCase(),
      payment_method_types: ['card', 'link', 'paypal'], // Only allow card, Link (one-click), and PayPal
    };

    // Add customer if available
    if (customer && !('deleted' in customer)) {
      paymentIntentData.customer = customer.id;
      paymentIntentData.setup_future_usage = setup_future_usage as 'off_session' | 'on_session';
    }

    try {
      console.log('Creating Stripe payment intent with data:', JSON.stringify(paymentIntentData, null, 2));
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      console.log('Payment intent created successfully:', paymentIntent.id);
      console.log('Client secret generated:', paymentIntent.client_secret ? 'yes' : 'no');

      res.json({
        client_secret: paymentIntent.client_secret,
        customer_id: customer && !('deleted' in customer) ? customer.id : null,
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      console.error('Payment intent data that failed:', JSON.stringify(paymentIntentData, null, 2));
      console.error('Stripe error details:', {
        message: error.message,
        type: error.type,
        code: error.code,
        param: error.param,
        stack: error.stack
      });

      return res.status(500).json({
        error: 'Failed to create payment intent',
        details: error.message || 'Unknown Stripe error',
        stripe_error: {
          type: error.type,
          code: error.code,
          param: error.param
        }
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in payment intent creation:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'An unexpected error occurred while processing the payment.'
    });
  }
}
