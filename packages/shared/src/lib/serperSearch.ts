/**
 * Serper API Search Utility
 * 
 * This module provides Serper-based product search functionality for the smart shopping list.
 * It replaces the legacy hybrid/local search system while maintaining the same interface.
 * 
 * Features:
 * - Parallel multi-item search for optimal performance
 * - Background description pre-fetching
 * - In-memory caching for instant description display
 * - Carrefour.fr focused search results
 */

import axios from 'axios';

const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY || '';
const SERPER_SHOPPING_URL = 'https://google.serper.dev/shopping';
const SERPER_SEARCH_URL = 'https://google.serper.dev/search';

// In-memory cache for product descriptions
const descriptionCache = new Map<string, string>();

/**
 * Serper product result from API
 */
export interface SerperProduct {
  title: string;
  source: string;
  link: string;
  price: string;
  imageUrl: string;
  productId: string;
  position: number;
}

/**
 * Standardized product format for the app
 */
export interface ProductData {
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
  nutrition?: any;
  quantity?: string;
  stores?: string[];
  originalItem?: string; // The original grocery list item this product matches
}

/**
 * Search result with alternatives
 */
export interface SearchResult {
  topResult: ProductData;
  alternatives: ProductData[]; // Remaining ~39 results
}

/**
 * Increase price by 30% to account for markup
 */
function increasePrice(priceString: string): number {
  try {
    const numberMatch = priceString.match(/[\d,\.]+/);
    if (!numberMatch) return 0;
    
    const numberStr = numberMatch[0].replace(',', '.');
    const originalPrice = parseFloat(numberStr);
    
    if (isNaN(originalPrice)) return 0;
    
    // Increase by 30%
    return originalPrice * 1.3;
  } catch (error) {
    return 0;
  }
}

/**
 * Convert Serper product to app ProductData format
 */
function convertSerperToProductData(serperProduct: SerperProduct, originalItem?: string): ProductData {
  return {
    id: serperProduct.productId,
    name: serperProduct.title,
    description: serperProduct.source,
    image: serperProduct.imageUrl,
    price: increasePrice(serperProduct.price),
    category: 'Grocery',
    stores: [serperProduct.source],
    originalItem
  };
}

/**
 * Search for a single product using Serper API
 * Returns all results (~40)
 */
export async function searchProduct(query: string): Promise<SerperProduct[]> {
  try {
    const response = await axios.post(
      SERPER_SHOPPING_URL,
      {
        q: `${query} In www.carrefour.fr`,
        location: "France",
        gl: "fr",
        num: 40
      },
      {
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.shopping && response.data.shopping.length > 0) {
      return response.data.shopping;
    }
    
    return [];
  } catch (error) {
    console.error(`[SerperSearch] Error searching for "${query}":`, error);
    return [];
  }
}

/**
 * Search for multiple products in parallel
 * Returns a map of original query -> search results
 */
export async function searchProductsParallel(
  queries: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, SearchResult>> {
  console.log(`🚀 [SerperSearch] Starting parallel search for ${queries.length} items`);
  
  const results = new Map<string, SearchResult>();
  let completedCount = 0;

  // Execute all searches in parallel
  const searchPromises = queries.map(async (query) => {
    try {
      const serperResults = await searchProduct(query);
      
      if (serperResults.length > 0) {
        // Convert all results to ProductData
        const allProducts = serperResults.map(result => 
          convertSerperToProductData(result, query)
        );
        
        const searchResult: SearchResult = {
          topResult: allProducts[0],
          alternatives: allProducts.slice(1) // Remaining ~39 results
        };
        
        results.set(query, searchResult);
        console.log(`✅ [SerperSearch] Found ${serperResults.length} results for "${query}"`);
      } else {
        console.log(`❌ [SerperSearch] No results for "${query}"`);
      }
      
      // Update progress
      completedCount++;
      if (onProgress) {
        onProgress(completedCount, queries.length);
      }
    } catch (error) {
      console.error(`❌ [SerperSearch] Error searching for "${query}":`, error);
      completedCount++;
      if (onProgress) {
        onProgress(completedCount, queries.length);
      }
    }
  });

  // Wait for all searches to complete
  await Promise.all(searchPromises);
  
  console.log(`📊 [SerperSearch] Completed parallel search: ${results.size}/${queries.length} successful`);
  
  return results;
}

/**
 * Fetch and summarize product description using Serper + Gemini
 */
export async function fetchProductDescription(product: ProductData): Promise<string> {
  // Check cache first
  const cacheKey = product.id;
  if (descriptionCache.has(cacheKey)) {
    console.log(`💾 [SerperSearch] Description cache hit for "${product.name}"`);
    return descriptionCache.get(cacheKey)!;
  }

  try {
    console.log(`🔍 [SerperSearch] Fetching description for "${product.name}"`);
    
    // Step 1: Get raw description from Serper
    const searchResponse = await axios.post(
      SERPER_SEARCH_URL,
      {
        q: `what is description of ${product.name} site:www.carrefour.fr`,
        location: "France",
        gl: "fr",
        num: 10
      },
      {
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const rawDescription = JSON.stringify(searchResponse.data, null, 2);

    // Step 2: Summarize with Gemini
    const summaryResponse = await axios.post('/api/gemini', {
      description: rawDescription
    });

    const description = summaryResponse.data.summary;
    
    // Cache the description
    descriptionCache.set(cacheKey, description);
    console.log(`✅ [SerperSearch] Cached description for "${product.name}"`);
    
    return description;
  } catch (error) {
    console.error(`❌ [SerperSearch] Error fetching description for "${product.name}":`, error);
    const fallback = 'Description not available at this time.';
    descriptionCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Pre-fetch descriptions for multiple products in the background
 * Does not block - runs asynchronously
 */
export function prefetchDescriptions(products: ProductData[]): void {
  console.log(`🔄 [SerperSearch] Starting background pre-fetch for ${products.length} product descriptions`);
  
  // Fire and forget - don't await
  products.forEach(async (product) => {
    // Skip if already cached
    if (!descriptionCache.has(product.id)) {
      await fetchProductDescription(product);
    }
  });
}

/**
 * Get cached description if available
 */
export function getCachedDescription(productId: string): string | null {
  return descriptionCache.get(productId) || null;
}

/**
 * Clear description cache (useful for testing)
 */
export function clearDescriptionCache(): void {
  descriptionCache.clear();
  console.log('🗑️ [SerperSearch] Description cache cleared');
}

