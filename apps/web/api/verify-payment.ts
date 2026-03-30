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
    const { payment_intent_id, client_secret, skip_client_secret } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    if (!skip_client_secret && !client_secret) {
      return res.status(400).json({ error: 'Client secret is required when not skipping verification' });
    }

    // Retrieve the payment intent to verify its status
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    // Verify that the client secret matches (unless skipped for 3D Secure redirects)
    if (!skip_client_secret && paymentIntent.client_secret !== client_secret) {
      return res.status(400).json({ error: 'Invalid client secret' });
    }

    // Check if payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment not successful',
        status: paymentIntent.status
      });
    }

    // Get payment method details if available
    let paymentMethodDetails = null;
    if (paymentIntent.payment_method) {
      try {
        if (typeof paymentIntent.payment_method === 'string') {
          paymentMethodDetails = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
        } else {
          paymentMethodDetails = paymentIntent.payment_method;
        }
      } catch (error) {
        console.warn('Could not retrieve payment method details:', error);
      }
    }

    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_method_types: paymentIntent.payment_method_types,
        created: paymentIntent.created,
        customer: paymentIntent.customer,
        payment_method: paymentMethodDetails,
      },
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message || 'Failed to verify payment' });
  }
}
