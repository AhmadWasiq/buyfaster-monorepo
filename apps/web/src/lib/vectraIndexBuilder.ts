/**
 * Vectra Index Builder
 * Builds a Vectra index from existing embeddings or creates a new one from products
 */

import { LocalIndex } from 'vectra';
import path from 'path';

export interface ProductDocument {
  id: string;
  title: string;
  body: string;
  main_image?: string;
  price?: number;
  category?: string;
  nutriscore?: string;
  ecoscore?: string;
  stores?: string[];
}

export class VectraIndexBuilder {
  private index: LocalIndex;
  
  constructor(indexPath: string = './product-vectors') {
    this.index = new LocalIndex(path.resolve(indexPath));
  }

  /**
   * Initialize the index (create if doesn't exist)
   */
  async initialize(): Promise<void> {
    if (!(await this.index.isIndexCreated())) {
      await this.index.createIndex();
      console.log('✓ Vectra index created');
    } else {
      console.log('✓ Vectra index loaded');
    }
  }

  /**
   * Build index from existing embeddings.json file
   */
  async buildFromEmbeddings(embeddingsPath: string): Promise<number> {
    const fs = await import('fs/promises');
    const data = JSON.parse(await fs.readFile(embeddingsPath, 'utf-8'));
    
    const { docs, embeddings } = data;
    
    if (!docs || !embeddings || docs.length !== embeddings.length) {
      throw new Error('Invalid embeddings file format');
    }

    console.log(`Building Vectra index with ${docs.length} products...`);
    
    let count = 0;
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const vector = embeddings[i];
      
      await this.index.insertItem({
        vector: vector,
        metadata: {
          id: doc.id || `product_${i}`,
          title: doc.title || doc.name || '',
          body: doc.body || doc.description || '',
          ...(doc.main_image || doc.image ? { main_image: doc.main_image || doc.image } : {}),
          ...(doc.price !== undefined ? { price: doc.price } : {}),
          ...(doc.category ? { category: doc.category } : {}),
          ...(doc.nutriscore ? { nutriscore: doc.nutriscore } : {}),
          ...(doc.ecoscore ? { ecoscore: doc.ecoscore } : {}),
          ...(doc.stores?.length ? { stores: doc.stores.join(',') } : {}),
        }
      });
      
      count++;
      if (count % 100 === 0) {
        console.log(`  Indexed ${count}/${docs.length} products...`);
      }
    }
    
    console.log(`✓ Indexed ${count} products successfully`);
    return count;
  }

  /**
   * Add or update a single product
   */
  async upsertProduct(doc: ProductDocument, vector: number[]): Promise<void> {
    // Check if product already exists
    const existing = await this.index.listItems();
    const existingItem = existing.find(item => item.metadata.id === doc.id);
    
    if (existingItem) {
      // Delete old version
      await this.index.deleteItem(existingItem.id);
    }
    
    // Insert new/updated version
    await this.index.insertItem({
      vector: vector,
      metadata: {
        id: doc.id,
        title: doc.title,
        body: doc.body,
        ...(doc.main_image ? { main_image: doc.main_image } : {}),
        ...(doc.price !== undefined ? { price: doc.price } : {}),
        ...(doc.category ? { category: doc.category } : {}),
        ...(doc.nutriscore ? { nutriscore: doc.nutriscore } : {}),
        ...(doc.ecoscore ? { ecoscore: doc.ecoscore } : {}),
        ...(doc.stores?.length ? { stores: doc.stores.join(',') } : {}),
      }
    });
  }

  /**
   * Delete a product by ID
   */
  async deleteProduct(productId: string): Promise<boolean> {
    const items = await this.index.listItems();
    const item = items.find(i => i.metadata.id === productId);
    
    if (item) {
      await this.index.deleteItem(item.id);
      return true;
    }
    return false;
  }

  /**
   * Get the underlying index for direct queries
   */
  getIndex(): LocalIndex {
    return this.index;
  }

  /**
   * Get index statistics
   */
  async getStats() {
    const items = await this.index.listItems();
    const categories = new Set(items.map(i => i.metadata.category).filter(Boolean));
    
    return {
      totalProducts: items.length,
      categories: Array.from(categories),
      categoryCount: categories.size,
    };
  }
}

/**
 * Build the index from public embeddings file (for initial setup)
 */
export async function buildProductIndex(
  embeddingsPath: string = './public/embeddings.json',
  indexPath: string = './product-vectors'
): Promise<void> {
  const builder = new VectraIndexBuilder(indexPath);
  await builder.initialize();
  await builder.buildFromEmbeddings(embeddingsPath);
  const stats = await builder.getStats();
  console.log('\nIndex Statistics:', stats);
}

