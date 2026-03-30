import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ShoppingCart, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';

interface ShoppingProduct {
  title: string;
  source: string;
  link: string;
  price: string;
  imageUrl: string;
  productId: string;
  position: number;
}

const APITestPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ShoppingProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ShoppingProduct | null>(null);
  const [productDescriptions, setProductDescriptions] = useState<Record<string, string>>({});
  const [isLoadingDescription, setIsLoadingDescription] = useState(false);

  const searchProducts = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError('');
    setSearchResults([]);

    try {
      const axios = (await import('axios')).default;

      const data = JSON.stringify({
        "q": `${query} In www.carrefour.fr`,
        "location": "France",
        "gl": "fr",
        "num": 40
      });

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://google.serper.dev/shopping',
        headers: {
          'X-API-KEY': '8fb4aa5a3d2e3fd7e09b2bc9416ebde0953fb344',
          'Content-Type': 'application/json'
        },
        data: data
      };

      const response = await axios.request(config);

      if (response.data.shopping && response.data.shopping.length > 0) {
        setSearchResults(response.data.shopping);
      } else {
        setError('No products found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchProducts(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchProducts(searchQuery);
    }
  };

  const handleDescriptionClick = async (product: ShoppingProduct) => {
    // If we already have the description, just show modal
    if (productDescriptions[product.productId]) {
      setSelectedProduct(product);
      return;
    }

    // Otherwise, fetch the description first
    setIsLoadingDescription(true);
    try {
      const axios = (await import('axios')).default;

      // Step 1: Get raw description from Serper
      const searchResponse = await axios.post('https://google.serper.dev/search', {
        q: `what is description of ${product.title} site:www.carrefour.fr`,
        location: "France",
        gl: "fr",
        num: 10
      }, {
        headers: {
          'X-API-KEY': '8fb4aa5a3d2e3fd7e09b2bc9416ebde0953fb344',
          'Content-Type': 'application/json'
        }
      });

      const rawDescription = JSON.stringify(searchResponse.data, null, 2);

      // Step 2: Summarize with Gemini
      const summaryResponse = await axios.post('/api/gemini', {
        description: rawDescription
      });

      setProductDescriptions(prev => ({
        ...prev,
        [product.productId]: summaryResponse.data.summary
      }));
      setSelectedProduct(product);
    } catch (err) {
      console.log('Description fetch failed:', err);
      setProductDescriptions(prev => ({
        ...prev,
        [product.productId]: 'Failed to load description. Please try again.'
      }));
      setSelectedProduct(product);
    } finally {
      setIsLoadingDescription(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  const getHighResImageUrl = (imageUrl: string) => {
    try {
      // Try to get higher resolution from Google image proxy URLs
      if (imageUrl.includes('encrypted-tbn')) {
        // Replace or add size parameter for higher resolution
        const url = new URL(imageUrl);
        if (url.searchParams.has('s')) {
          url.searchParams.set('s', '800'); // Increase size parameter
        } else {
          url.searchParams.set('s', '800');
        }
        return url.toString();
      }

      // For other image URLs, try to modify common parameters
      if (imageUrl.includes('?')) {
        const [baseUrl, params] = imageUrl.split('?');
        const urlParams = new URLSearchParams(params);

        // Common size parameters across different services
        const sizeParams = ['w', 'width', 'h', 'height', 's', 'size', 'sz'];
        let modified = false;

        sizeParams.forEach(param => {
          if (urlParams.has(param)) {
            const currentValue = parseInt(urlParams.get(param) || '0');
            if (currentValue < 800) {
              urlParams.set(param, '800');
              modified = true;
            }
          }
        });

        if (modified) {
          return `${baseUrl}?${urlParams.toString()}`;
        }
      }

      return imageUrl;
    } catch (error) {
      return imageUrl; // Return original URL if modification fails
    }
  };

  const increasePrice = (priceString: string): string => {
    try {
      // Extract number from price string (handles formats like "€2.50", "$2.50", "2,50 €", etc.)
      const numberMatch = priceString.match(/[\d,\.]+/);
      if (!numberMatch) return priceString;
      
      // Parse the number (handle both comma and dot as decimal separator)
      const numberStr = numberMatch[0].replace(',', '.');
      const originalPrice = parseFloat(numberStr);
      
      if (isNaN(originalPrice)) return priceString;
      
      // Increase by 30%
      const newPrice = originalPrice * 1.3;
      
      // Format to 2 decimal places
      const formattedPrice = newPrice.toFixed(2);
      
      // Replace the old number with the new one, preserving currency symbols and formatting
      return priceString.replace(/[\d,\.]+/, formattedPrice);
    } catch (error) {
      return priceString; // Return original if parsing fails
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-gray-400 w-12 h-12 sm:w-10 sm:h-10 rounded-xl"
        >
          <ArrowLeft className="w-6 h-6 sm:w-5 sm:h-5" />
        </Button>
        <h2 className="text-base sm:text-lg font-light text-gray-900 tracking-wide">API Test - Carrefour Shopping</h2>
        <div className="w-12 sm:w-10" />
      </div>

      {/* Search Bar */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search products on Carrefour.fr (e.g., fromage, pain, lait)..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>
          <Button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            variant="gradient"
            className="w-full mt-3 py-3"
          >
            {isSearching ? 'Searching...' : 'Search Carrefour.fr'}
          </Button>
        </form>

        {/* Results */}
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
              <h3 className="text-xl font-light text-gray-900 mb-2 tracking-wide">Searching Carrefour.fr...</h3>
              <p className="text-gray-500 text-center font-light">Finding products with Google Shopping API</p>
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
              <p className="text-gray-500 text-center font-light">{error}</p>
            </motion.div>
          )}

          {searchResults.length > 0 && !isSearching && !error && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                  Found {searchResults.length} products on Carrefour.fr
                </h4>
              </div>

              <div className="space-y-3">
                {searchResults.map((product, index) => (
                  <motion.div
                    key={product.productId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-3xl hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                        <img
                          src={getHighResImageUrl(product.imageUrl)}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          style={{
                            imageRendering: 'crisp-edges'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // Try original URL if high-res fails
                            if (target.src !== product.imageUrl) {
                              target.src = product.imageUrl;
                            } else {
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA5LjUgMTJDOS41IDE4IDggMTcuMSAxNiAxN0g5LjVIMTZDMjAuNCAxNiAyNCAxMi40IDI0IDhDMjQgMy42IDE5LjQgMCAxNCAwQzguNiAwIDQgMy42IDQgOEM0IDEyLjQgOC40IDE2IDEyIDE2VjE0QzEwLjIgMTQgOSAxMi44IDkgMTBDOSEgNy44IDEwLjIgNiAxMiA2QzEzLjggNiAxNSA3LjIgMTUgOEMxNSA5LjggMTMuOCA5IDEyIDlDOS44IDkgOSAxMC4yIDkgMTJDOSAxMy44IDEwLjIgMTUgMTIgMTVWNFoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                            }
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 text-sm sm:text-base leading-tight mb-2 line-clamp-2">
                          {product.title}
                        </h5>

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl font-bold text-cyan-600">
                            {increasePrice(product.price)}
                          </span>
                          <button
                            onClick={() => handleDescriptionClick(product)}
                            disabled={isLoadingDescription}
                            className="h-10 w-10 p-2 hover:bg-gray-200 bg-gray-50 border border-gray-200 rounded-full transition-colors flex items-center justify-center disabled:opacity-50"
                            title="Get product description"
                          >
                            {isLoadingDescription ? (
                              <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <MoreHorizontal className="w-5 h-5 text-gray-500" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {product.source}
                          </span>
                          <span className="text-xs text-gray-400">
                            Position #{product.position}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {searchResults.length === 0 && !isSearching && !error && searchQuery && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2 tracking-wide">No Products Found</h3>
              <p className="text-gray-500 text-center font-light">
                Try searching for different products like "fromage", "pain", "lait", etc.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && productDescriptions[selectedProduct.productId] && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Product Details</h3>
                  <Button
                    onClick={handleCloseModal}
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 sm:w-8 sm:h-8 rounded-xl text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6 sm:w-5 sm:h-5" />
                  </Button>
                </div>

                <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-4 sm:p-6">
                  <div className="flex flex-col items-center mb-4 sm:mb-6">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-2xl overflow-hidden mb-3 sm:mb-4">
                      <img 
                        src={getHighResImageUrl(selectedProduct.imageUrl)} 
                        alt={selectedProduct.title} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== selectedProduct.imageUrl) {
                            target.src = selectedProduct.imageUrl;
                          }
                        }}
                      />
                    </div>
                    <h4 className="text-lg sm:text-xl font-medium text-gray-900 text-center mb-2">
                      {selectedProduct.title}
                    </h4>
                    <p className="text-gray-500 text-center mb-3 sm:mb-4 text-sm sm:text-base">
                      {productDescriptions[selectedProduct.productId]}
                    </p>
                    <div className="text-xl sm:text-2xl font-medium text-cyan-600">
                      {increasePrice(selectedProduct.price)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default APITestPage;
