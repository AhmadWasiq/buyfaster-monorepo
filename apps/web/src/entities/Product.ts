interface ProductData {
  id: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  category: string;
  nutriscore?: string;
  ecoscore?: string;
  novaGroup?: number;
  ingredients?: string;
  allergens?: string;
  nutrition?: {
    energy_100g?: number;
    energy_kcal_100g?: number;
    energy_kj_100g?: number;
    fat_100g?: number;
    saturated_fat_100g?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    proteins_100g?: number;
    salt_100g?: number;
    sodium_100g?: number;
  };
  quantity?: string;
  stores?: string[];
  created_date?: string;
}

class Product {
  static products: ProductData[] = [];
  static nextId = 1;

  static async create(data: Omit<ProductData, 'id' | 'created_date'>): Promise<ProductData> {
    const product: ProductData = {
      ...data,
      id: this.nextId.toString(),
      created_date: new Date().toISOString(),
    };
    this.products.push(product);
    this.nextId++;
    return product;
  }

  static async list(sortBy?: string): Promise<ProductData[]> {
    let sortedProducts = [...this.products];

    if (sortBy === 'name') {
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === '-created_date') {
      sortedProducts.sort((a, b) =>
        new Date(b.created_date || '').getTime() - new Date(a.created_date || '').getTime()
      );
    }

    return sortedProducts;
  }

  static async findById(id: string): Promise<ProductData | undefined> {
    return this.products.find(product => product.id === id);
  }

  static async delete(id: string): Promise<boolean> {
    const index = this.products.findIndex(product => product.id === id);
    if (index !== -1) {
      this.products.splice(index, 1);
      return true;
    }
    return false;
  }

  static async clear(): Promise<void> {
    this.products = [];
    this.nextId = 1;
  }

  static async findByName(name: string): Promise<ProductData | undefined> {
    const normalizedName = name.toLowerCase().trim();
    return this.products.find(product =>
      product.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(product.name.toLowerCase())
    );
  }
}

export { Product };
export type { ProductData };

