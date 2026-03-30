import { supabase } from '../lib/supabase';
import type { UserAddress } from './User';

interface OrderData {
  id?: string;
  user_id?: string;
  order_number?: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  currency?: string;
  stripe_payment_intent_id?: string;
  payment_status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  payment_method_id?: string;
  shipping_address: UserAddress | any; // Can be UserAddress or JSONB
  billing_address?: UserAddress | any;
  status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  voice_command?: string;
  notes?: string;
  // Delivery options
  delivery_type?: 'express' | 'standard';
  delivery_datetime?: string;
  delivery_notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface OrderItem {
  id?: string;
  order_id: string;
  product_name: string;
  product_image?: string;
  product_description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_metadata?: any;
  created_at?: string;
}

interface CreateOrderData {
  user_id?: string;
  items: {
    product_name: string;
    product_image?: string;
    product_description?: string;
    quantity: number;
    unit_price: number;
    product_metadata?: any;
  }[];
  shipping_address: UserAddress | any;
  billing_address?: UserAddress | any;
  payment_method_id?: string;
  voice_command?: string;
  notes?: string;
  // Delivery options
  delivery_type?: 'express' | 'standard';
  delivery_datetime?: string;
  delivery_notes?: string;
  // tax_rate?: number;  // Removed - no tax charged
  // shipping_amount?: number;  // Removed - no shipping charged
}

class Order {
  static async create(data: CreateOrderData): Promise<OrderData> {
    // Calculate totals (no tax or shipping)
    const subtotal = data.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const tax_amount = 0; // No tax charged
    const shipping_amount = 0; // No shipping charged
    const total_amount = subtotal; // Total is just the subtotal

    // Get current user ID from session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to create an order');
    }

    // Create the order
    const orderData: Omit<OrderData, 'id'> = {
      user_id: data.user_id || user.id, // Use provided user_id or current user
      subtotal,
      tax_amount,
      shipping_amount,
      total_amount,
      currency: 'USD',
      shipping_address: data.shipping_address,
      billing_address: data.billing_address,
      payment_method_id: data.payment_method_id,
      voice_command: data.voice_command,
      notes: data.notes,
      delivery_type: data.delivery_type || 'express', // Default to express (1h)
      delivery_datetime: data.delivery_datetime,
      delivery_notes: data.delivery_notes,
      payment_status: 'pending',
      status: 'pending'
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = data.items.map(item => ({
      order_id: order.id,
      product_name: item.product_name,
      product_image: item.product_image,
      product_description: item.product_description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
      product_metadata: item.product_metadata
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  }

  // Legacy method for backward compatibility with existing code
  static async createLegacy(data: {
    product_name: string;
    product_image?: string;
    price: number;
    quantity: number;
    voice_command?: string;
    status?: string;
  }): Promise<OrderData> {
    // Get current user for the legacy order
    const { data: { user } } = await supabase.auth.getUser();
    
    // Convert legacy format to new format
    const orderData: CreateOrderData = {
      items: [{
        product_name: data.product_name,
        product_image: data.product_image,
        quantity: data.quantity,
        unit_price: data.price,
      }],
      shipping_address: {
        first_name: 'Guest',
        last_name: 'User',
        address_line_1: 'N/A',
        city: 'N/A',
        state: 'N/A',
        postal_code: 'N/A',
        country: 'US',
        address_type: 'shipping',
        user_id: user?.id || '',
        is_default: false
      },
      voice_command: data.voice_command,
    };

    const order = await this.create(orderData);
    
    // Update status if provided
    if (data.status && data.status !== 'pending') {
      return await this.updateStatus(order.id!, data.status as any);
    }

    return order;
  }

  static async list(sortBy?: string): Promise<OrderData[]> {
    let query = supabase
      .from('orders')
      .select('*');
    
    if (sortBy === '-created_date') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: true });
    }

    const { data: orders, error } = await query;
    if (error) throw error;
    return orders || [];
  }

  static async findById(id: string): Promise<OrderData | null> {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return order;
  }

  static async findByCurrentUser(limit?: number): Promise<OrderData[]> {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: orders, error } = await query;
    if (error) throw error;
    return orders || [];
  }

  static async findByUserId(userId: string, limit?: number): Promise<OrderData[]> {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: orders, error } = await query;
    if (error) throw error;
    return orders || [];
  }

  static async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return items || [];
  }

  static async updateStatus(id: string, status: OrderData['status']): Promise<OrderData> {
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return order;
  }

  static async updatePaymentStatus(id: string, payment_status: OrderData['payment_status'], stripe_payment_intent_id?: string): Promise<OrderData> {
    const updateData: any = { payment_status };
    if (stripe_payment_intent_id) {
      updateData.stripe_payment_intent_id = stripe_payment_intent_id;
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return order;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    return !error;
  }
}

export { Order };
export type { OrderData };
