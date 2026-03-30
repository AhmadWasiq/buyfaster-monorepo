import { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { customerEmail, customerName, orderNumber, items, total, shippingAddress, deliveryType, deliveryNotes } = req.body;

    // Create transporter inside handler
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // Customer email with logo
    const customerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px;">
          <img src="https://www.buyfaster.ai/log.png" alt="BuyFaster" style="width: 120px;"/>
        </div>
        <h1 style="color: #0891b2;">Order Confirmation</h1>
        <p>Hi ${customerName},</p>
        <p>Thank you for your order! Your payment has been successfully processed.</p>
        <h2>Order #${orderNumber}</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Qty</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any) => `
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
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;"><strong>€${total.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        <h3>Shipping Address</h3>
        <p>${shippingAddress.firstName} ${shippingAddress.lastName}<br/>
        ${shippingAddress.address}<br/>
        ${shippingAddress.city}, ${shippingAddress.zipCode}<br/>
        ${shippingAddress.country}</p>
        <h3>Delivery Information</h3>
        <p><strong>Delivery Type:</strong> ${deliveryType === 'express' ? 'Express (1 hour)' : 'Standard (24 hours)'}</p>
        ${deliveryNotes ? `<p><strong>Delivery Instructions:</strong> ${deliveryNotes}</p>` : ''}
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">${deliveryType === 'express' ? 'Your order will be delivered within 1 hour!' : 'Estimated delivery: within 24 hours'}</p>
      </div>
    `;

    // Owner notification email
    const ownerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0891b2;">🎉 New Order Received!</h1>
        <p><strong>Order #${orderNumber}</strong></p>
        <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
        <p><strong>Total:</strong> €${total.toFixed(2)}</p>
        <h3>Items:</h3>
        <ul>
          ${items.map((item: any) => `<li>${item.name} x${item.quantity} - €${item.price.toFixed(2)}</li>`).join('')}
        </ul>
        <h3>Shipping to:</h3>
        <p>${shippingAddress.firstName} ${shippingAddress.lastName}<br/>
        ${shippingAddress.address}<br/>
        ${shippingAddress.city}, ${shippingAddress.zipCode}<br/>
        ${shippingAddress.country}</p>
        <h3>Delivery Details:</h3>
        <p><strong>Type:</strong> ${deliveryType === 'express' ? '🚀 Express (1 hour)' : '📦 Standard (24 hours)'}</p>
        ${deliveryNotes ? `<p><strong>Instructions:</strong> ${deliveryNotes}</p>` : ''}
      </div>
    `;

    // Send to customer
    await transporter.sendMail({
      from: `"BuyFaster" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Order Confirmation #${orderNumber}`,
      html: customerHTML,
    });

    // Send to owner
    await transporter.sendMail({
      from: `"BuyFaster" <${process.env.EMAIL_USER}>`,
      to: process.env.OWNER_EMAIL || '',
      subject: `New Order #${orderNumber} - ${customerName}`,
      html: ownerHTML,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Email error:', error);
    res.status(500).json({ error: error.message });
  }
}

