import { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Check environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return res.status(500).json({ 
        error: 'Email configuration missing. Please set EMAIL_USER and EMAIL_APP_PASSWORD in Vercel environment variables.' 
      });
    }

    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    // Create transporter inside handler
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const mockOrderNumber = 'TEST' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const mockItems = [
      { name: 'Test Product 1', quantity: 2, price: 5.99 },
      { name: 'Test Product 2', quantity: 1, price: 12.50 },
    ];
    const mockTotal = 24.48;

    const customerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px;">
          <img src="https://www.buyfaster.ai/log.png" alt="BuyFaster" style="width: 120px;"/>
        </div>
        <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <strong style="color: #92400e;">⚠️ TEST EMAIL</strong>
          <p style="color: #92400e; margin: 5px 0 0 0; font-size: 14px;">This is a test order confirmation. No real order was placed.</p>
        </div>
        <h1 style="color: #0891b2;">Order Confirmation</h1>
        <p>Hi Test Customer,</p>
        <p>Thank you for your order! Your payment has been successfully processed.</p>
        <h2>Order #${mockOrderNumber}</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Qty</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${mockItems.map((item) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.name}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">€${item.price.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;"><strong>Total:</strong></td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;"><strong>€${mockTotal.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        <h3>Shipping Address</h3>
        <p>Test Customer<br/>
        123 Test Street<br/>
        Paris, 75001<br/>
        France</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Estimated delivery: 2-3 business days</p>
      </div>
    `;

    const ownerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <strong style="color: #92400e;">⚠️ TEST EMAIL</strong>
          <p style="color: #92400e; margin: 5px 0 0 0; font-size: 14px;">This is a test notification. No real order was placed.</p>
        </div>
        <h1 style="color: #0891b2;">🎉 New Order Received! (TEST)</h1>
        <p><strong>Order #${mockOrderNumber}</strong></p>
        <p><strong>Customer:</strong> Test Customer (${testEmail})</p>
        <p><strong>Total:</strong> €${mockTotal.toFixed(2)}</p>
        <h3>Items:</h3>
        <ul>
          ${mockItems.map((item) => `<li>${item.name} x${item.quantity} - €${item.price.toFixed(2)}</li>`).join('')}
        </ul>
        <h3>Shipping to:</h3>
        <p>Test Customer<br/>
        123 Test Street<br/>
        Paris, 75001<br/>
        France</p>
      </div>
    `;

    // Send to test email
    await transporter.sendMail({
      from: `"BuyFaster" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: `[TEST] Order Confirmation #${mockOrderNumber}`,
      html: customerHTML,
    });

    // Send to owner
    await transporter.sendMail({
      from: `"BuyFaster" <${process.env.EMAIL_USER}>`,
      to: process.env.OWNER_EMAIL || '',
      subject: `[TEST] New Order #${mockOrderNumber} - Test Customer`,
      html: ownerHTML,
    });

    res.json({ success: true, message: 'Test emails sent!' });
  } catch (error: any) {
    console.error('Email error:', error);
    res.status(500).json({ error: error.message });
  }
}

