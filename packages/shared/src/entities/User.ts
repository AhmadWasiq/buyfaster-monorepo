import { supabase } from '../lib/supabase';
import { Auth } from '../lib/auth';

export interface UserData {
  id?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string; // URL to user avatar image (typically from Google OAuth)
  stripe_customer_id?: string; // Store Stripe customer ID for payment method management
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface UserAddress {
  id?: string;
  user_id: string;
  address_type: 'shipping' | 'billing';
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserPaymentMethod {
  id?: string;
  user_id: string;
  stripe_payment_method_id: string;
  payment_type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  card_brand?: string;
  card_last_four?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  billing_address_id?: string;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

class User {
  // User management - works with authenticated users via RLS
  static async create(data: Omit<UserData, 'id' | 'created_at' | 'updated_at'> & { id: string }): Promise<UserData> {
    // ID must come from auth.uid() for RLS to work properly
    const { data: user, error } = await supabase
      .from('users')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return user;
  }

  static async findByEmail(email: string): Promise<UserData | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return user;
  }

  static async findById(id: string): Promise<UserData | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return user;
  }

  static async getCurrentUser(): Promise<UserData | null> {
    // Get current authenticated user directly (RLS will ensure they only see their own data)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return user;
  }

  static async update(data: Partial<UserData>): Promise<UserData> {
    // Get current user ID for the WHERE clause
    const currentUser = Auth.getCurrentUser();
    if (!currentUser?.id) {
      throw new Error('No authenticated user found');
    }

    // Update current user (RLS ensures they can only update their own profile)
    const { data: user, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', currentUser.id)
      .select()
      .single();

    if (error) throw error;
    return user;
  }

  // Address management - RLS ensures users only access their own addresses
  static async createAddress(data: Omit<UserAddress, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { user_id: string }): Promise<UserAddress> {
    // If setting as default, we need to unset existing defaults first
    if (data.is_default) {
      // Use a transaction to ensure atomicity
      const { error: unsetError } = await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', data.user_id)
        .eq('address_type', data.address_type)
        .eq('is_default', true);

      // We don't throw error if no rows were updated (no existing default)
      if (unsetError && unsetError.code !== 'PGRST116') {
        console.warn('Could not unset existing default address:', unsetError);
      }
    }

    const { data: address, error } = await supabase
      .from('user_addresses')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return address;
  }

  static async getAddresses(type?: 'shipping' | 'billing'): Promise<UserAddress[]> {
    let query = supabase
      .from('user_addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('address_type', type);
    }

    const { data: addresses, error } = await query;
    if (error) throw error;
    return addresses || [];
  }

  static async getDefaultAddress(type: 'shipping' | 'billing'): Promise<UserAddress | null> {
    const { data: address, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('address_type', type)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return address;
  }

  static async updateAddress(id: string, data: Partial<UserAddress>): Promise<UserAddress> {
    // If setting as default, we need to unset existing defaults first
    if (data.is_default) {
      // Get the current address details to know the user_id and address_type
      const { data: currentAddress } = await supabase
        .from('user_addresses')
        .select('user_id, address_type')
        .eq('id', id)
        .single();

      if (currentAddress) {
        // Unset existing default for this user and address type
        const { error: unsetError } = await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', currentAddress.user_id)
          .eq('address_type', currentAddress.address_type)
          .eq('is_default', true)
          .neq('id', id); // Don't update the current address we're about to update

        // We don't throw error if no rows were updated (no existing default)
        if (unsetError && unsetError.code !== 'PGRST116') {
          console.warn('Could not unset existing default address:', unsetError);
        }
      }
    }

    const { data: address, error } = await supabase
      .from('user_addresses')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return address;
  }

  static async deleteAddress(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Payment method management - RLS ensures users only access their own payment methods
  static async createPaymentMethod(data: Omit<UserPaymentMethod, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { user_id: string }): Promise<UserPaymentMethod> {
    // If this is set as default, unset other defaults first
    if (data.is_default) {
      await supabase
        .from('user_payment_methods')
        .update({ is_default: false });
    }

    const { data: paymentMethod, error } = await supabase
      .from('user_payment_methods')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return paymentMethod;
  }

  static async getPaymentMethods(): Promise<UserPaymentMethod[]> {
    const { data: paymentMethods, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return paymentMethods || [];
  }

  static async getDefaultPaymentMethod(): Promise<UserPaymentMethod | null> {
    const { data: paymentMethod, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return paymentMethod;
  }

  static async updatePaymentMethod(id: string, data: Partial<UserPaymentMethod>): Promise<UserPaymentMethod> {
    // If setting as default, unset other defaults first
    if (data.is_default) {
      await supabase
        .from('user_payment_methods')
        .update({ is_default: false })
        .neq('id', id);
    }

    const { data: paymentMethod, error } = await supabase
      .from('user_payment_methods')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return paymentMethod;
  }

  static async deletePaymentMethod(id: string): Promise<void> {
    // Soft delete - mark as inactive
    const { error } = await supabase
      .from('user_payment_methods')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  // Stripe Customer Management
  static async updateStripeCustomerId(customerId: string): Promise<UserData> {
    const { data: user, error } = await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .select()
      .single();

    if (error) throw error;
    return user;
  }

  static async getStripeCustomerId(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.stripe_customer_id || null;
  }

  // Save payment method after successful Stripe payment
  static async saveStripePaymentMethod(paymentMethodData: {
    stripe_payment_method_id: string;
    payment_type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
    card_brand?: string;
    card_last_four?: string;
    card_exp_month?: number;
    card_exp_year?: number;
    billing_address_id?: string;
    is_default?: boolean;
  }): Promise<UserPaymentMethod> {
    const user = await this.getCurrentUser();
    if (!user?.id) throw new Error('User not found');

    return this.createPaymentMethod({
      user_id: user.id,
      is_active: true,
      is_default: paymentMethodData.is_default || false,
      ...paymentMethodData
    });
  }
}

export { User };
