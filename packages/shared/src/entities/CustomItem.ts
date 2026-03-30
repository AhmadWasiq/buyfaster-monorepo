interface CustomItemData {
  id?: number;
  name: string;
  description?: string;
  preferred_brand?: string;
  estimated_price?: number;
  category: string;
  created_date?: string;
}

class CustomItem {
  static items: CustomItemData[] = [];
  static nextId = 1;

  static async create(data: Omit<CustomItemData, 'id' | 'created_date'>): Promise<CustomItemData> {
    const item: CustomItemData = {
      ...data,
      id: this.nextId++,
      created_date: new Date().toISOString(),
    };
    this.items.push(item);
    return item;
  }

  static async list(sortBy?: string): Promise<CustomItemData[]> {
    let sortedItems = [...this.items];
    
    if (sortBy === '-created_date') {
      sortedItems.sort((a, b) => 
        new Date(b.created_date || '').getTime() - new Date(a.created_date || '').getTime()
      );
    }
    
    return sortedItems;
  }

  static async findById(id: number): Promise<CustomItemData | undefined> {
    return this.items.find(item => item.id === id);
  }

  static async delete(id: number): Promise<boolean> {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }
}

export { CustomItem };
export type { CustomItemData };
