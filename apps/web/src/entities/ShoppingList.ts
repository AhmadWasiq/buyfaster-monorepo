import { supabase } from '../lib/supabase';

export interface ShoppingListItem {
  id?: string;
  shopping_list_id: string;
  product_name: string;
  product_image?: string;
  product_description?: string;
  quantity: number;
  unit_price: number;
  product_metadata?: any;
  created_at?: string;
}

export interface ShoppingListData {
  id?: string;
  user_id: string;
  name: string;
  status?: 'pending' | 'completed';
  total_amount: number;
  created_at?: string;
  updated_at?: string;
  items?: ShoppingListItem[];
}

export class ShoppingList {
  static async create(data: {
    name: string;
    status?: 'pending' | 'completed';
    items: {
      product_name: string;
      product_image?: string;
      product_description?: string;
      quantity: number;
      unit_price: number;
      product_metadata?: any;
    }[];
  }): Promise<ShoppingListData> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('User not authenticated');

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!userData) throw new Error('User not found');

    // Calculate total
    const total_amount = data.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    // Create the shopping list
    const { data: list, error: listError } = await supabase
      .from('shopping_lists')
      .insert([{
        user_id: userData.id,
        name: data.name,
        status: data.status || 'completed',
        total_amount
      }])
      .select()
      .single();

    if (listError) throw listError;

    // Create list items
    const listItems = data.items.map(item => ({
      shopping_list_id: list.id,
      product_name: item.product_name,
      product_image: item.product_image,
      product_description: item.product_description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      product_metadata: item.product_metadata
    }));

    const { error: itemsError } = await supabase
      .from('shopping_list_items')
      .insert(listItems);

    if (itemsError) throw itemsError;

    return list;
  }

  static async list(): Promise<ShoppingListData[]> {
    const { data: lists, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return lists || [];
  }

  static async findById(id: string): Promise<ShoppingListData | null> {
    const { data: list, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return list;
  }

  static async getItems(listId: string): Promise<ShoppingListItem[]> {
    const { data: items, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('shopping_list_id', listId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return items || [];
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', id);

    return !error;
  }

  static async updateStatus(id: string, status: 'pending' | 'completed'): Promise<boolean> {
    const { error } = await supabase
      .from('shopping_lists')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    return !error;
  }

  static async findByName(name: string): Promise<ShoppingListData | null> {
    const { data: lists, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .ilike('name', `%${name}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return lists && lists.length > 0 ? lists[0] : null;
  }
}
