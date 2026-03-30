import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Create Payment Intent
export async function createPaymentIntent(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'usd', email, customerId } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    let customer;

    // If customerId is provided, use existing customer
    if (customerId) {
      try {
        customer = await stripe.customers.retrieve(customerId);
        if ('deleted' in customer && customer.deleted) {
          customer = await stripe.customers.create({ email });
        }
      } catch (error) {
        customer = await stripe.customers.create({ email });
      }
    } else if (email) {
      customer = await stripe.customers.create({ email });
    }

    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount), // Ensure amount is an integer
      currency: currency.toLowerCase(),
      payment_method_types: ['card', 'link', 'paypal'], // Only allow card, Link (one-click), and PayPal
    };

    // Add customer if available
    if (customer && !('deleted' in customer)) {
      paymentIntentData.customer = customer.id;
      paymentIntentData.setup_future_usage = 'off_session';
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    res.json({
      client_secret: paymentIntent.client_secret,
      customer_id: customer && !('deleted' in customer) ? customer.id : null,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment intent' });
  }
}

// Get saved payment methods for a customer
export async function getPaymentMethods(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId } = req.query;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    res.json({ paymentMethods: paymentMethods.data });
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch payment methods' });
  }
}

// Create SetupIntent for saving a card
export async function createSetupIntent(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, customerId } = req.body;

    let customer: Stripe.Customer | Stripe.DeletedCustomer;

    if (customerId) {
      try {
        customer = await stripe.customers.retrieve(customerId);
        if ('deleted' in customer && customer.deleted) {
          customer = await stripe.customers.create({ email });
        }
      } catch {
        customer = await stripe.customers.create({ email });
      }
    } else {
      customer = await stripe.customers.create({ email });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: (customer as Stripe.Customer).id,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    res.json({
      client_secret: setupIntent.client_secret,
      customer_id: (customer as Stripe.Customer).id,
    });
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: error.message || 'Failed to create setup intent' });
  }
}

// Charge a saved payment method
export async function chargePaymentMethod(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, amount, paymentMethodId, currency = 'usd' } = req.body;

    if (!customerId || !amount) {
      return res.status(400).json({ error: 'Customer ID and amount are required' });
    }

    let chosenPaymentMethodId = paymentMethodId;

    // If no paymentMethodId provided, use customer's default
    if (!chosenPaymentMethodId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (!('deleted' in customer)) {
        const defaultPm = customer.invoice_settings?.default_payment_method;
        if (typeof defaultPm === 'string') {
          chosenPaymentMethodId = defaultPm;
        } else if (defaultPm && typeof defaultPm === 'object' && 'id' in defaultPm) {
          chosenPaymentMethodId = defaultPm.id;
        }
      }
    }

    if (!chosenPaymentMethodId) {
      return res.status(400).json({ error: 'No payment method available' });
    }

    // Ensure payment method is attached to customer
    try {
      await stripe.paymentMethods.attach(chosenPaymentMethodId, { customer: customerId });
    } catch (e: any) {
      if (e?.code !== 'resource_already_exists') {
        throw e;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      customer: customerId,
      payment_method: chosenPaymentMethodId,
      off_session: true,
      confirm: true,
    });

    res.json(paymentIntent);
  } catch (error: any) {
    // Handle authentication required for 3D Secure
    if (error.code === 'authentication_required') {
      res.json({
        error: 'authentication_required',
        paymentIntent: {
          id: error.payment_intent.id,
          client_secret: error.payment_intent.client_secret,
        },
      });
    } else {
      console.error('Error charging payment method:', error);
      res.status(500).json({ error: error.message || 'Payment failed' });
    }
  }
}

// Set default payment method for a customer
export async function setDefaultPaymentMethod(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, paymentMethodId } = req.body;

    if (!customerId || !paymentMethodId) {
      return res.status(400).json({ error: 'Customer ID and payment method ID are required' });
    }

    // Attach payment method if necessary
    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    } catch (e: any) {
      if (e?.code !== 'resource_already_exists') {
        throw e;
      }
    }

    const customer = await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    res.json({ success: true, customer });
  } catch (error: any) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ error: error.message || 'Failed to set default payment method' });
  }
}

// Main API handler that routes to appropriate functions
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint } = req.query;

  try {
    switch (endpoint?.[0]) {
      case 'create-payment-intent':
        return await createPaymentIntent(req, res);
      case 'payment-methods':
        if (req.method === 'GET') {
          return await getPaymentMethods(req, res);
        }
        break;
      case 'create-setup-intent':
        return await createSetupIntent(req, res);
      case 'charge':
        return await chargePaymentMethod(req, res);
      case 'set-default-payment-method':
        return await setDefaultPaymentMethod(req, res);
      default:
        return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
