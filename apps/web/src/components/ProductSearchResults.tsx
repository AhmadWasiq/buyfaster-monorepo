import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  ShoppingCart,
  Leaf,
  Package
} from 'lucide-react';
import { Button } from './ui/button';

interface ProductSearchResultsProps {
  extractedText: string;
  onClose: () => void;
  onAddToCart: (products: ProductData[]) => void;
}

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
  nutrition?: any;
  quantity?: string;
  stores?: string[];
  originalItem?: string; // The original grocery list item this product matches
}

const ProductSearchResults: React.FC<ProductSearchResultsProps> = ({
  extractedText,
  onClose,
  onAddToCart
}) => {
  const [searchResults, setSearchResults] = useState<ProductData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 });

  // Search for products based on extracted text using Serper API
  React.useEffect(() => {
    const searchProducts = async () => {
      setIsSearching(true);
      setError('');

      try {
        // Import services
        const { parseGroceryList } = await import('../lib/parseGroceryList');
        const { searchProductsParallel, prefetchDescriptions } = await import('../lib/serperSearch');

        // Parse the extracted text to find product names
        const parsedItems = parseGroceryList(extractedText);

        if (parsedItems.length === 0) {
          setError('No products found in the extracted text');
          return;
        }

        // Filter out generic terms and headers that won't give good search results
        const specificItems = parsedItems.filter(item => {
          const genericTerms = [
            'fruits vegetables', 'fruits & vegetables', 'fruits and vegetables',
            'proteins', 'dairy', 'dairy products', 
            'grains', 'snacks', 'beverages', 'drinks',
            'meat', 'seafood', 'frozen', 'canned',
            'pantry', 'condiments', 'spices',
            'household', 'cleaning', 'personal care'
          ];
          
          // Also filter out very short terms and numbers-only
          const isGeneric = genericTerms.some(term => 
            item.name.toLowerCase().trim() === term.toLowerCase() ||
            item.name.toLowerCase().includes('#') ||
            /^\d+$/.test(item.name.trim())
          );
          
          return !isGeneric && item.name.length > 2 && item.name.length < 50;
        });

        // Use Serper parallel search for all items at once
        const searchTerms = specificItems.map(item => item.name);
        console.log(`🚀 [Serper Voice] Starting parallel search for ${searchTerms.length} items`);
        
        // Initialize progress tracking
        setSearchProgress({ current: 0, total: searchTerms.length });
        
        // Execute all searches in parallel with progress callback
        const searchResults = await searchProductsParallel(
          searchTerms,
          (current, total) => {
            setSearchProgress({ current, total });
          }
        );

        // Extract top results for display IN ORIGINAL ORDER
        const allResults: ProductData[] = [];
        
        // Iterate through searchTerms to maintain original order
        for (const term of searchTerms) {
          const result = searchResults.get(term);
          if (result && result.topResult) {
            allResults.push(result.topResult);
          }
        }

        console.log(`📊 [Serper Voice] Found ${allResults.length} products for ${specificItems.length} search items`);

        setSearchResults(allResults);
        
        // Pre-fetch descriptions in background for instant three-dots display
        if (allResults.length > 0) {
          console.log('🔄 [Serper Voice] Starting background description pre-fetch...');
          prefetchDescriptions(allResults);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search products');
      } finally {
        setIsSearching(false);
      }
    };

    if (extractedText.trim()) {
      searchProducts();
    }
  }, [extractedText]);

  const handleToggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleAddToCart = () => {
    const productsToAdd = searchResults.filter(product => selectedProducts.has(product.id));
    if (productsToAdd.length > 0) {
      onAddToCart(productsToAdd);
    }
  };

  const getNutriScoreColor = (score?: string) => {
    switch (score?.toLowerCase()) {
      case 'a': return 'text-green-600 bg-green-100';
      case 'b': return 'text-green-700 bg-green-100';
      case 'c': return 'text-yellow-600 bg-yellow-100';
      case 'd': return 'text-orange-600 bg-orange-100';
      case 'e': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEcoScoreColor = (score?: string) => {
    switch (score?.toLowerCase()) {
      case 'a': return 'text-green-600 bg-green-100';
      case 'b': return 'text-green-700 bg-green-100';
      case 'c': return 'text-yellow-600 bg-yellow-100';
      case 'd': return 'text-orange-600 bg-orange-100';
      case 'e': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getNovaGroupIcon = (group?: number) => {
    switch (group) {
      case 1: return <div className="w-3 h-3 bg-green-500 rounded-full" />;
      case 2: return <div className="w-3 h-3 bg-yellow-500 rounded-full" />;
      case 3: return <div className="w-3 h-3 bg-orange-500 rounded-full" />;
      case 4: return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      default: return <div className="w-3 h-3 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-50">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 w-12 h-12 sm:w-10 sm:h-10 rounded-xl">
          <X className="w-6 h-6 sm:w-5 sm:h-5" />
        </Button>
        <h2 className="text-base sm:text-lg font-light text-gray-900 tracking-wide">Product Search</h2>
        <div className="w-12 sm:w-10" />
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          {isSearching && (
            <motion.div
              key="searching"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-2 border-gray-200 border-t-cyan-400 rounded-full mb-8"
              />
              <h3 className="text-xl font-light text-gray-900 mb-2 tracking-wide">Searching Products...</h3>
              {searchProgress.total > 0 && (
                <div className="mb-4">
                  <div className="w-64 bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-cyan-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(searchProgress.current / searchProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-gray-600 text-sm">
                    Processing {searchProgress.current} of {searchProgress.total} items
                  </p>
                </div>
              )}
              <p className="text-gray-500 text-center font-light">Finding matches in product database</p>
            </motion.div>
          )}

          {error && !isSearching && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2 tracking-wide">Search Failed</h3>
              <p className="text-gray-500 text-center font-light mb-6">{error}</p>
              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline">
                  Go Back
                </Button>
              </div>
            </motion.div>
          )}

          {searchResults.length > 0 && !isSearching && !error && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-600" />
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">Found Products</h4>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 font-light">
                    {selectedProducts.size} of {searchResults.length} selected
                  </div>
                </div>

                <div className="space-y-4">
                  {searchResults.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border rounded-3xl p-3 sm:p-4 cursor-pointer transition-all shadow-brand-soft hover:shadow-brand-hover ${
                        selectedProducts.has(product.id)
                          ? 'border-cyan-300 bg-cyan-50'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleToggleProduct(product.id)}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{product.name}</h5>
                          {product.description && (
                            <p className="text-gray-500 text-xs sm:text-sm font-light mb-2 line-clamp-2">{product.description}</p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              {product.nutriscore && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNutriScoreColor(product.nutriscore)}`}>
                                  Nutri-Score {product.nutriscore.toUpperCase()}
                                </span>
                              )}
                              {product.ecoscore && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEcoScoreColor(product.ecoscore)}`}>
                                  <Leaf className="w-3 h-3 inline mr-1" />
                                  {product.ecoscore.toUpperCase()}
                                </span>
                              )}
                              {product.novaGroup && (
                                <div className="flex items-center gap-1">
                                  {getNovaGroupIcon(product.novaGroup)}
                                  <span className="text-xs text-gray-500">NOVA {product.novaGroup}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2">
                              {product.stores && product.stores.length > 0 && (
                                <span className="text-xs text-gray-500 truncate">
                                  {product.stores[0]}
                                </span>
                              )}
                              {selectedProducts.has(product.id) && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0"
                                >
                                  <Check className="w-3 h-3 text-white" />
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6 pt-4 border-t border-gray-200">
                  <Button onClick={onClose} variant="outline" className="flex-1 py-3 sm:py-2 text-sm sm:text-base">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddToCart}
                    disabled={selectedProducts.size === 0}
                    variant="gradient"
                    className="flex-1"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart ({selectedProducts.size})
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {searchResults.length === 0 && !isSearching && !error && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2 tracking-wide">No Products Found</h3>
              <p className="text-gray-500 text-center font-light mb-6">
                We couldn't find any matching products in the product database.
              </p>
              <Button onClick={onClose} variant="gradient">
                Try Another Image
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductSearchResults;
