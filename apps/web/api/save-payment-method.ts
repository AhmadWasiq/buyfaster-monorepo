import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

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
    const { email, customerId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let customer: Stripe.Customer | Stripe.DeletedCustomer;

    // Create or retrieve customer
    if (customerId) {
      try {
        customer = await stripe.customers.retrieve(customerId);
        if ('deleted' in customer && customer.deleted) {
          customer = await stripe.customers.create({ email });
        }
      } catch (error) {
        customer = await stripe.customers.create({ email });
      }
    } else {
      customer = await stripe.customers.create({ email });
    }

    // Create SetupIntent for saving payment methods
    const setupIntent = await stripe.setupIntents.create({
      customer: (customer as Stripe.Customer).id,
      payment_method_types: ['card', 'paypal'], // Allow both card and PayPal saving
      usage: 'off_session', // This enables future payments without customer present
    });

    res.json({
      client_secret: setupIntent.client_secret,
      customer_id: (customer as Stripe.Customer).id,
      setup_intent_id: setupIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({
      error: error.message || 'Failed to create setup intent',
      details: {
        type: error.type,
        code: error.code,
        param: error.param
      }
    });
  }
}
