import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ArrowLeft,
  Package,
  Leaf,
  MoreHorizontal,
  RefreshCw,
  ShoppingCart,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Order } from '../entities/Order';
import PaymentPage from './PaymentPage';
import ShoppingVoiceAssistant from './ShoppingVoiceAssistant';
import { shoppingVoiceSync } from '../lib/voiceUISync';

interface OCRShoppingFlowProps {
  extractedText: string;
  onBack: () => void;
  onComplete?: () => void;
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

// PaymentConfirmation component moved to PaymentSuccessPage.tsx

// Product Alternatives Modal
const ProductAlternativesModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onSelectAlternative,
  onShowDetails
}: {
  product: ProductData | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAlternative: (alternative: ProductData, currentProduct: ProductData) => void;
  onShowDetails: (product: ProductData) => void;
}) => {
  const [alternatives, setAlternatives] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product?.originalItem) {
      const loadAlternatives = () => {
        setLoading(true);
        try {
          // Get stored results from initial search - NO NEW QUERY NEEDED!
          const storedResults = (window as any).__allSearchResults?.get(product.originalItem!);
          
          if (storedResults && storedResults.length > 0) {
            // Use pre-stored results, excluding the current product
            // Show up to 20 alternatives (or all available, whichever is less)
            const alternativeProducts = storedResults
              .filter((alt: ProductData) => alt.id !== product.id)
              .slice(0, 20);
            
            console.log(`✅ [Serper] Loaded ${alternativeProducts.length} alternatives from cache for "${product.originalItem}"`);
            setAlternatives(alternativeProducts);
          } else {
            console.warn(`⚠️ [Serper] No cached results found for "${product.originalItem}"`);
            setAlternatives([]);
          }
        } catch (error) {
          console.error('[Serper] Error loading alternatives:', error);
          setAlternatives([]);
        } finally {
          setLoading(false);
        }
      };

      loadAlternatives();
    }
  }, [isOpen, product]);

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

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Alternative options</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Tap any item to swap • {alternatives.length} options available</p>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="w-10 h-10 sm:w-8 sm:h-8 rounded-xl text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6 sm:w-5 sm:h-5" />
              </Button>
            </div>
            
              <div className="overflow-y-auto max-h-[calc(85vh-100px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {loading ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-200 border-t-cyan-400 rounded-full"
                  />
                </div>
              ) : alternatives.length > 0 ? (
                <div className="p-3 sm:p-4 space-y-2">
                  {alternatives.map((alternative, index) => (
                      <motion.div
                      key={alternative.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-cyan-50 hover:border-cyan-200 border border-transparent transition-all cursor-pointer"
                      onClick={() => product && onSelectAlternative(alternative, product)}
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                        {alternative.image ? (
                          <img src={alternative.image} alt={alternative.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm leading-tight">{alternative.name}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-cyan-600 font-medium text-sm">€{alternative.price.toFixed(2)}</span>
                          {alternative.nutriscore && (
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${getNutriScoreColor(alternative.nutriscore)}`}>
                              {alternative.nutriscore.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowDetails(alternative);
                        }}
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No alternatives found</p>
                </div>
              )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Product Details Modal  
const ProductDetailsModal = ({ 
  product, 
  isOpen, 
  onClose,
  description
}: {
  product: ProductData | null;
  isOpen: boolean;
  onClose: () => void;
  description?: string;
}) => {
  return (
    <AnimatePresence>
      {isOpen && product && description && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                onClick={onClose}
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
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-8 h-8 sm:w-12 sm:h-12" />
                    </div>
                  )}
                </div>
                <h4 className="text-lg sm:text-xl font-medium text-gray-900 text-center mb-2">{product.name}</h4>
                <p className="text-gray-500 text-center mb-3 sm:mb-4 text-sm sm:text-base">{description}</p>
                <div className="text-xl sm:text-2xl font-medium text-cyan-600">€{product.price.toFixed(2)}</div>
              </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ProductResults component (simplified version for OCR shopping)
const ProductResults = ({ 
  products, 
  onProductChange,
  voiceAlternativesTrigger,
  voiceAlternativesProduct,
  voiceAlternativesClose
}: { 
  products: ProductData[]; 
  onProductChange: (originalItem: string, newProduct: ProductData) => void;
  voiceAlternativesTrigger?: number;
  voiceAlternativesProduct?: ProductData | null;
  voiceAlternativesClose?: number;
}) => {
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [detailsFromAlternatives, setDetailsFromAlternatives] = useState(false);
  const [productDescriptions, setProductDescriptions] = useState<Record<string, string>>({});
  const [isLoadingDescription, setIsLoadingDescription] = useState<string | null>(null);

  // Handle voice-triggered alternatives modal open
  useEffect(() => {
    if (voiceAlternativesTrigger && voiceAlternativesTrigger > 0 && voiceAlternativesProduct) {
      setSelectedProduct(voiceAlternativesProduct);
      setShowAlternativesModal(true);
    }
  }, [voiceAlternativesTrigger, voiceAlternativesProduct]);

  // Handle voice-triggered alternatives modal close
  useEffect(() => {
    if (voiceAlternativesClose && voiceAlternativesClose > 0) {
      setShowAlternativesModal(false);
      setSelectedProduct(null);
    }
  }, [voiceAlternativesClose]);

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

  const handleShowAlternatives = (product: ProductData) => {
    setSelectedProduct(product);
    setShowAlternativesModal(true);
  };

  const handleShowDetails = async (product: ProductData) => {
    // If we already have the description, just show modal
    if (productDescriptions[product.id]) {
      setSelectedProduct(product);
      setDetailsFromAlternatives(false);
      setShowDetailsModal(true);
      return;
    }

    // Otherwise, fetch the description first
    setIsLoadingDescription(product.id);
    try {
      const { fetchProductDescription, getCachedDescription } = await import('../lib/serperSearch');
      
      // Check cache first
      const cachedDesc = getCachedDescription(product.id);
      if (cachedDesc) {
        setProductDescriptions(prev => ({
          ...prev,
          [product.id]: cachedDesc
        }));
        setSelectedProduct(product);
        setDetailsFromAlternatives(false);
        setShowDetailsModal(true);
      } else {
        // Fetch from API
        const description = await fetchProductDescription(product);
        setProductDescriptions(prev => ({
          ...prev,
          [product.id]: description
        }));
        setSelectedProduct(product);
        setDetailsFromAlternatives(false);
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.log('[Serper] Description fetch failed:', err);
      setProductDescriptions(prev => ({
        ...prev,
        [product.id]: 'Failed to load description. Please try again.'
      }));
      setSelectedProduct(product);
      setDetailsFromAlternatives(false);
      setShowDetailsModal(true);
    } finally {
      setIsLoadingDescription(null);
    }
  };

  const handleSelectAlternative = (alternative: ProductData, currentProduct: ProductData) => {
    if (!alternative.originalItem) return;
    if (!currentProduct) return;
    
    // SWAP: Replace current with alternative
    onProductChange(alternative.originalItem, alternative);
    
    // Update stored results: add current product to alternatives, remove selected alternative
    const storedResults = (window as any).__allSearchResults?.get(alternative.originalItem!);
    if (storedResults) {
      // Remove the selected alternative and add the current product
      const updatedResults = [
        alternative, // Keep selected at top for consistency
        currentProduct, // Add current product to alternatives
        ...storedResults.filter((p: ProductData) => p.id !== alternative.id && p.id !== currentProduct.id)
      ];
      (window as any).__allSearchResults.set(alternative.originalItem!, updatedResults);
      console.log(`🔄 [Serper] Swapped products - "${currentProduct.name}" ↔ "${alternative.name}"`);
    }
    
    setShowAlternativesModal(false);
    setSelectedProduct(null);
  };

  const handleShowAlternativeDetails = async (alternative: ProductData) => {
    // If we already have the description, just show modal
    if (productDescriptions[alternative.id]) {
      setSelectedProduct(alternative);
      setShowAlternativesModal(false);
      setDetailsFromAlternatives(true);
      setShowDetailsModal(true);
      return;
    }

    // Otherwise, fetch the description first
    setIsLoadingDescription(alternative.id);
    try {
      const { fetchProductDescription, getCachedDescription } = await import('../lib/serperSearch');
      
      // Check cache first
      const cachedDesc = getCachedDescription(alternative.id);
      if (cachedDesc) {
        setProductDescriptions(prev => ({
          ...prev,
          [alternative.id]: cachedDesc
        }));
        setSelectedProduct(alternative);
        setShowAlternativesModal(false);
        setDetailsFromAlternatives(true);
        setShowDetailsModal(true);
      } else {
        // Fetch from API
        const description = await fetchProductDescription(alternative);
        setProductDescriptions(prev => ({
          ...prev,
          [alternative.id]: description
        }));
        setSelectedProduct(alternative);
        setShowAlternativesModal(false);
        setDetailsFromAlternatives(true);
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.log('[Serper] Description fetch failed:', err);
      setProductDescriptions(prev => ({
        ...prev,
        [alternative.id]: 'Failed to load description. Please try again.'
      }));
      setSelectedProduct(alternative);
      setShowAlternativesModal(false);
      setDetailsFromAlternatives(true);
      setShowDetailsModal(true);
    } finally {
      setIsLoadingDescription(null);
    }
  };

  return (
    <div className="space-y-3">
      {products.map((product: ProductData, index: number) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white border border-gray-100 rounded-3xl p-4 shadow-brand-soft hover:shadow-brand-hover transition-shadow"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 mb-2 tracking-wide text-sm sm:text-base line-clamp-2">{product.name}</h4>
              
              {/* Price and scores on same line for compact layout */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-cyan-600 font-medium text-base sm:text-lg">€{product.price.toFixed(2)}</span>
                  {product.nutriscore && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getNutriScoreColor(product.nutriscore)}`}>
                      {product.nutriscore.toUpperCase()}
                    </span>
                  )}
                  {product.ecoscore && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEcoScoreColor(product.ecoscore)}`}>
                      <Leaf className="w-3 h-3 inline mr-0.5" />
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

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleShowAlternatives(product)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-cyan-600 px-2 py-1 rounded-xl text-xs h-7"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Change
                  </Button>
                  <Button
                    onClick={() => handleShowDetails(product)}
                    disabled={isLoadingDescription === product.id}
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-xl text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    {isLoadingDescription === product.id ? (
                      <div className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MoreHorizontal className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      ))}
      
      {/* Modals */}
      <ProductAlternativesModal
        product={selectedProduct}
        isOpen={showAlternativesModal}
        onClose={() => {
          setShowAlternativesModal(false);
          setSelectedProduct(null);
          setDetailsFromAlternatives(false);
        }}
        onSelectAlternative={handleSelectAlternative}
        onShowDetails={handleShowAlternativeDetails}
      />
      
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={showDetailsModal}
        description={selectedProduct ? productDescriptions[selectedProduct.id] : undefined}
        onClose={() => {
          setShowDetailsModal(false);
          if (detailsFromAlternatives) {
            // If details were opened from alternatives, go back to alternatives
            setShowAlternativesModal(true);
            setDetailsFromAlternatives(false);
          } else {
            // If opened directly from main list, clear everything
            setSelectedProduct(null);
          }
        }}
      />
    </div>
  );
};

export const OCRShoppingFlow: React.FC<OCRShoppingFlowProps> = ({
  extractedText,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState("processing");
  const [products, setProducts] = useState<ProductData[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 });
  const [isSearchingNewItem, setIsSearchingNewItem] = useState(false);
  const alternativesModalTriggerRef = useRef<{ product: ProductData | null }>({ product: null });
  const [forceAlternativesOpen, setForceAlternativesOpen] = useState(0);
  const [forceAlternativesClose, setForceAlternativesClose] = useState(0);
  const [voiceAssistantKey, setVoiceAssistantKey] = useState(0);
  
  // Store all search results (~40 per item) for instant "change option" access
  const allSearchResultsRef = useRef<Map<string, ProductData[]>>(new Map());

  // Update sync manager when products change (for internal tracking only)
  useEffect(() => {
    shoppingVoiceSync.updateProducts(products);
  }, [products]);
  
  // Expose allSearchResultsRef to ProductAlternativesModal via window (temporary solution)
  useEffect(() => {
    (window as any).__allSearchResults = allSearchResultsRef.current;
    return () => {
      delete (window as any).__allSearchResults;
    };
  }, [products]);

  const handleProductChange = (originalItem: string, newProduct: ProductData) => {
    setProducts(currentProducts => 
      currentProducts.map(product => 
        product.originalItem === originalItem ? newProduct : product
      )
    );
  };

  // Helper: Robust product matching
  const findProductByName = (searchName: string): ProductData | null => {
    const searchLower = searchName.toLowerCase().trim();
    const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
    
    // Try exact match first
    let found = products.find(p => {
      const original = (p.originalItem || '').toLowerCase();
      const name = p.name.toLowerCase();
      return original === searchLower || name === searchLower;
    });
    if (found) return found;
    
    // Try contains match
    found = products.find(p => {
      const original = (p.originalItem || '').toLowerCase();
      const name = p.name.toLowerCase();
      return original.includes(searchLower) || searchLower.includes(original) ||
             name.includes(searchLower) || searchLower.includes(name);
    });
    if (found) return found;
    
    // Try word-by-word match
    if (searchWords.length > 0) {
      found = products.find(p => {
        const original = (p.originalItem || '').toLowerCase();
        const name = p.name.toLowerCase();
        const productWords = [...original.split(/\s+/), ...name.split(/\s+/)].filter(w => w.length > 2);
        return searchWords.some(sw => productWords.some(pw => pw.includes(sw) || sw.includes(pw)));
      });
      if (found) return found;
    }
    
    // If still not found and we only have 1 or 2 products, be more lenient
    if (products.length <= 2) {
      return products[0];
    }
    
    return null;
  };

  // Voice command handlers
  const handleVoiceRemoveItem = async (itemName: string): Promise<{ success: boolean; message: string }> => {
    const product = findProductByName(itemName);
    if (product) {
      console.log(`[Voice] Removing product:`, product.name);
      setProducts(currentProducts => currentProducts.filter(p => p.id !== product.id));
      
      // Wait for React to update and voice context to refresh
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return { success: true, message: 'Removed.' };
    } else {
      console.log(`[Voice] Could not find product to remove:`, itemName);
      return { success: false, message: 'Could not find it.' };
    }
  };

  const handleVoiceAddItem = async (itemName: string) => {
    setIsSearchingNewItem(true);
    try {
      const { searchProduct } = await import('../lib/serperSearch');
      const serperResults = await searchProduct(itemName);
      
      if (serperResults.length > 0) {
        // Convert all results to ProductData
        const allProducts = serperResults.map(result => ({
          id: result.productId,
          name: result.title,
          description: result.source,
          image: result.imageUrl,
          price: parseFloat(result.price.replace(/[^\d.,]/g, '').replace(',', '.')) * 1.3,
          category: 'Grocery' as const,
          stores: [result.source],
          originalItem: itemName
        }));
        
        const newProduct = allProducts[0];
        
        // Store all results for this new item
        allSearchResultsRef.current.set(itemName, allProducts);
        console.log(`💾 [Serper] Stored ${allProducts.length} results for new item "${itemName}"`);
        
        setProducts(currentProducts => [...currentProducts, newProduct]);
        
        // Wait for React to update and voice context to refresh
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('[Serper] Error adding item:', error);
    } finally {
      setIsSearchingNewItem(false);
    }
  };

  const handleVoiceChangeItem = async (oldItemName: string, newItemName: string): Promise<{ success: boolean; message: string }> => {
    const oldProduct = findProductByName(oldItemName);
    if (!oldProduct) {
      console.log(`[Voice] Could not find product to change:`, oldItemName);
      return { success: false, message: 'Could not find it.' };
    }
    
    console.log(`[Voice] Changing product:`, oldProduct.name, '→', newItemName);
    setIsSearchingNewItem(true);
    try {
      const { searchProduct } = await import('../lib/serperSearch');
      const serperResults = await searchProduct(newItemName);
      
      if (serperResults.length > 0) {
        // Convert all results to ProductData
        const allProducts = serperResults.map(result => ({
          id: result.productId,
          name: result.title,
          description: result.source,
          image: result.imageUrl,
          price: parseFloat(result.price.replace(/[^\d.,]/g, '').replace(',', '.')) * 1.3,
          category: 'Grocery' as const,
          stores: [result.source],
          originalItem: newItemName
        }));
        
        const newProduct = allProducts[0];
        
        // Store all results for this new search
        allSearchResultsRef.current.set(newItemName, allProducts);
        console.log(`💾 [Serper] Stored ${allProducts.length} results for changed item "${newItemName}"`);
        
        // Remove old item's stored results
        if (oldProduct.originalItem) {
          allSearchResultsRef.current.delete(oldProduct.originalItem);
        }
        
        setProducts(currentProducts => 
          currentProducts.map(product => 
            product.id === oldProduct.id ? newProduct : product
          )
        );
        
        // Wait for React to update and voice context to refresh
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return { success: true, message: 'Changed.' };
      } else {
        return { success: false, message: 'No product found.' };
      }
    } catch (error) {
      console.error('[Serper] Error changing item:', error);
      return { success: false, message: 'Error occurred.' };
    } finally {
      setIsSearchingNewItem(false);
    }
  };

  const handleVoiceOpenAlternatives = (itemName: string): { success: boolean; message: string } => {
    const product = findProductByName(itemName);
    if (product) {
      console.log(`[Voice] Opening alternatives for:`, product.name);
      alternativesModalTriggerRef.current.product = product;
      setForceAlternativesOpen(prev => prev + 1);
      return { success: true, message: 'Here are options.' };
    } else {
      console.log(`[Voice] Could not find product for alternatives:`, itemName, 'Available:', products.map(p => p.originalItem || p.name));
      return { success: false, message: 'Could not find it.' };
    }
  };

  const handleVoiceSelectAlternative = async (originalItemName: string, alternativeName: string): Promise<{ success: boolean; message: string }> => {
    const oldProduct = findProductByName(originalItemName);
    if (!oldProduct) {
      console.log(`[Voice] Could not find product to replace:`, originalItemName);
      return { success: false, message: 'Could not find it.' };
    }
    
    console.log(`[Voice] Selecting alternative:`, alternativeName, 'for', oldProduct.name);
    setIsSearchingNewItem(true);
    try {
      // Use stored results - NO NEW QUERY!
      const storedResults = allSearchResultsRef.current.get(oldProduct.originalItem || oldProduct.name);
      
      if (!storedResults || storedResults.length === 0) {
        console.warn(`⚠️ [Voice] No stored results for "${oldProduct.originalItem}"`);
        return { success: false, message: 'No alternatives available.' };
      }
      
      // Filter out current product - check up to 20 alternatives
      const alternatives = storedResults.filter(alt => alt.id !== oldProduct.id).slice(0, 20);
      
      // Try to find the alternative by matching name
      const alternativeLower = alternativeName.toLowerCase();
      const matchedAlternative = alternatives.find(alt => 
        alt.name.toLowerCase().includes(alternativeLower) || 
        alternativeLower.includes(alt.name.toLowerCase().split(' ')[0])
      );
      
      if (matchedAlternative) {
        console.log(`✅ [Voice] Found alternative from stored results:`, matchedAlternative.name);
        
        // SWAP: Replace in products list
        setProducts(currentProducts => 
          currentProducts.map(product => 
            product.id === oldProduct.id ? matchedAlternative : product
          )
        );
        
        // Update stored results with the swap
        const updatedResults = [
          matchedAlternative,
          oldProduct,
          ...storedResults.filter(p => p.id !== matchedAlternative.id && p.id !== oldProduct.id)
        ];
        allSearchResultsRef.current.set(oldProduct.originalItem || oldProduct.name, updatedResults);
        console.log(`🔄 [Voice] Swapped products in cache`);
        
        // Close alternatives modal
        setForceAlternativesClose(prev => prev + 1);
        
        // Wait for React to update and voice context to refresh
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return { success: true, message: 'Switched.' };
      } else {
        return { success: false, message: 'Could not find that alternative.' };
      }
    } catch (error) {
      console.error('[Serper] Error selecting alternative:', error);
      return { success: false, message: 'Error occurred.' };
    } finally {
      setIsSearchingNewItem(false);
    }
  };

  const handleVoiceSelectAlternativeByPosition = async (originalItemName: string, position: number): Promise<{ success: boolean; message: string }> => {
    const oldProduct = findProductByName(originalItemName);
    if (!oldProduct) {
      console.log(`[Voice] Could not find product to select alternative:`, originalItemName);
      return { success: false, message: 'Could not find it.' };
    }
    
    console.log(`[Voice] Selecting alternative at position ${position} for:`, oldProduct.name, 'oldProduct ID:', oldProduct.id);
    setIsSearchingNewItem(true);
    try {
      // Use stored results - NO NEW QUERY!
      const storedResults = allSearchResultsRef.current.get(oldProduct.originalItem || oldProduct.name);
      
      if (!storedResults || storedResults.length === 0) {
        console.warn(`⚠️ [Voice] No stored results for "${oldProduct.originalItem}"`);
        return { success: false, message: 'No alternatives available.' };
      }
      
      console.log(`[Voice] Found ${storedResults.length} stored results for alternatives`);
      
      // Filter out current product - check up to 20 alternatives
      const alternatives = storedResults.filter(alt => alt.id !== oldProduct.id).slice(0, 20);
      
      console.log(`[Voice] After filtering, have ${alternatives.length} alternatives. Position requested: ${position}`);
      
      // Check if position is valid (1-indexed)
      if (position < 1 || position > alternatives.length) {
        console.log(`[Voice] Position ${position} is out of range (1-${alternatives.length})`);
        return { success: false, message: `Only ${alternatives.length} options available.` };
      }
      
      // Get the alternative at position (convert to 0-indexed)
      const selectedAlternative = alternatives[position - 1];
      console.log(`[Voice] Selected alternative at position ${position}:`, selectedAlternative.name);
      
      // SWAP: Replace in products list
      setProducts(currentProducts => 
        currentProducts.map(product => 
          product.id === oldProduct.id ? selectedAlternative : product
        )
      );
      
      // Update stored results with the swap
      const updatedResults = [
        selectedAlternative,
        oldProduct,
        ...storedResults.filter(p => p.id !== selectedAlternative.id && p.id !== oldProduct.id)
      ];
      allSearchResultsRef.current.set(oldProduct.originalItem || oldProduct.name, updatedResults);
      console.log(`🔄 [Voice] Swapped products in cache`);
      
      // Close alternatives modal
      setForceAlternativesClose(prev => prev + 1);
      
      // Wait for React to update and voice context to refresh
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log(`[Voice] ✅ Product switch complete (from stored results)`);
      return { success: true, message: 'Switched.' };
    } catch (error) {
      console.error('[Serper] Error selecting alternative by position:', error);
      return { success: false, message: 'Error occurred.' };
    } finally {
      setIsSearchingNewItem(false);
    }
  };

  const handleVoiceConfirmPurchase = () => {
    handleConfirmPurchase();
  };

  const handleCloseAlternatives = () => {
    setForceAlternativesClose(prev => prev + 1);
  };

  // Search for products based on extracted text using Serper API
  useEffect(() => {
    const searchProducts = async () => {
      setCurrentStep("processing");
      setError('');

      try {
        // Import services
        const { parseGroceryList } = await import('../lib/parseGroceryList');
        const { searchProductsParallel, prefetchDescriptions } = await import('../lib/serperSearch');

        console.log('🔍 [Serper] Extracted text:', extractedText);

        // Parse the extracted text to find product names
        const parsedItems = parseGroceryList(extractedText);
        console.log('📋 [Serper] Parsed items:', parsedItems);
        console.log('🔢 [Serper] Total parsed items:', parsedItems.length);

        if (parsedItems.length === 0) {
          setError('No products found in the extracted text');
          setCurrentStep("error");
          return;
        }

        // Filter out generic terms and headers that won't give good search results
        const specificItems = parsedItems.filter((item, index) => {
          const originalName = item.name.toLowerCase().trim();
          
          console.log(`🔍 [Serper] Evaluating item ${index + 1}: "${originalName}"`);
          
          // Only filter exact category header matches, not partial
          const exactGenericTerms = [
            'fruits vegetables', 'fruits & vegetables', 'fruits and vegetables',
            'proteins', 'dairy', 'dairy products', 
            'grains', 'snacks', 'beverages', 'drinks',
            'meat', 'seafood', 'frozen', 'canned',
            'pantry', 'condiments', 'spices',
            'household', 'cleaning', 'personal care'
          ];
          
          // Check for exact matches to category headers
          const isExactGeneric = exactGenericTerms.some(term => 
            originalName === term.toLowerCase()
          );
          
          // Filter out markdown headers only (# at start) - allow bullets with content
          const isMarkdownHeader = originalName.startsWith('#');
          const isNumbersOnly = /^\d+$/.test(originalName);
          const isTooShort = originalName.length <= 2;
          const isTooLong = originalName.length > 50;
          
          const shouldKeep = !isExactGeneric && !isMarkdownHeader && !isNumbersOnly && !isTooShort && !isTooLong;
          
          console.log(`   🔹 "${originalName}" → ${shouldKeep ? '✅ KEEP' : '❌ FILTER'} (${
            isExactGeneric ? 'generic' : 
            isMarkdownHeader ? 'markdown-header' :
            isNumbersOnly ? 'numbers-only' :
            isTooShort ? 'too-short' :
            isTooLong ? 'too-long' : 'keep'
          })`);
          
          return shouldKeep;
        });

        console.log(`🎯 [Serper] Filtered to specific items (${specificItems.length}/${parsedItems.length}):`, specificItems.map(item => item.name));
        
        // Show what we filtered out for debugging
        const filteredOut = parsedItems.filter(item => !specificItems.includes(item));
        if (filteredOut.length > 0) {
          console.log(`❌ [Serper] Filtered OUT (${filteredOut.length} items):`, filteredOut.map(item => `"${item.name}"`));
        }

        // Use Serper parallel search for all items at once
        const searchTerms = specificItems.map(item => item.name);
        console.log(`🚀 [Serper] Starting parallel search for ${searchTerms.length} items`);
        
        // Initialize progress tracking
        setSearchProgress({ current: 0, total: searchTerms.length });
        
        // Execute all searches in parallel with progress callback
        const searchResults = await searchProductsParallel(
          searchTerms,
          (current, total) => {
            setSearchProgress({ current, total });
          }
        );

        // Store ALL results for instant "change option" access
        const newAllSearchResults = new Map<string, ProductData[]>();
        
        // Extract top results for display IN ORIGINAL ORDER
        const allResults: ProductData[] = [];
        
        // Iterate through searchTerms to maintain original order
        for (const term of searchTerms) {
          const result = searchResults.get(term);
          if (result && result.topResult) {
            allResults.push(result.topResult);
            
            // Store all results (top + alternatives) for this query
            const allProductsForQuery = [result.topResult, ...result.alternatives];
            newAllSearchResults.set(result.topResult.originalItem!, allProductsForQuery);
            
            console.log(`💾 [Serper] Stored ${allProductsForQuery.length} results for "${result.topResult.originalItem}"`);
          }
        }
        
        // Update the ref with all search results
        allSearchResultsRef.current = newAllSearchResults;

        if (allResults.length === 0) {
          setError('No matching products found');
          setCurrentStep("error");
          return;
        }

        console.log(`📊 [Serper] FINAL RESULTS - Found ${allResults.length} products for ${specificItems.length} search items`);
        console.log(`📝 [Serper] Success rate: ${((allResults.length / specificItems.length) * 100).toFixed(1)}%`);
        console.log(`🛒 [Serper] Product names found:`, allResults.map(p => `"${p.name}" (for "${p.originalItem}")`));
        console.log(`💾 [Serper] Total stored results: ${Array.from(newAllSearchResults.values()).reduce((sum, arr) => sum + arr.length, 0)} products across ${newAllSearchResults.size} queries`);

        setProducts(allResults);
        setCurrentStep("results");
        
        // Pre-fetch descriptions in background for instant three-dots display
        console.log('🔄 [Serper] Starting background description pre-fetch...');
        prefetchDescriptions(allResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search products');
        setCurrentStep("error");
      }
    };

    if (extractedText.trim()) {
      searchProducts();
    }
  }, [extractedText]);

  const handleConfirmPurchase = () => {
    // Save cart items to sessionStorage for saving list after payment
    const cartItemsForSave = products.map(product => ({
      name: product.name,
      image: product.image,
      description: product.description,
      price: product.price,
      quantity: 1,
      metadata: {
        category: product.category,
        nutriscore: product.nutriscore,
        ecoscore: product.ecoscore,
        novaGroup: product.novaGroup
      }
    }));
    sessionStorage.setItem('last_cart_items', JSON.stringify(cartItemsForSave));
    
    // Force unmount voice assistant by changing key
    setVoiceAssistantKey(prev => prev + 1);
    
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (deliveryData?: { type: string; notes: string }) => {
    // Save orders to database after successful payment
    for (const product of products) {
      await Order.create({
        items: [{
          product_name: product.name,
          product_image: product.image,
          product_description: product.description,
          quantity: 1,
          unit_price: product.price,
          product_metadata: {
            nutriscore: product.nutriscore,
            ecoscore: product.ecoscore,
            novaGroup: product.novaGroup
          }
        }],
        shipping_address: {
          first_name: 'Guest',
          last_name: 'User',
          address_line_1: 'Delivery Address',
          city: 'City',
          state: 'State',
          postal_code: '00000',
          country: 'US',
          address_type: 'shipping'
        },
        delivery_type: deliveryData?.type as 'express' | 'standard' || 'express',
        delivery_notes: deliveryData?.notes,
        voice_command: `OCR Shopping: ${product.originalItem || product.name}`,
      });
    }
    // Redirect to payment success page
    window.location.href = '/#/payment-success';
  };

  const handleBackToShopping = () => {
    setShowPayment(false);
  };

  // Convert products to cart format for PaymentPage
  const cartItems = products.map((product, index) => ({
    id: product.id || `product-${index}`,
    name: product.name,
    price: product.price,
    quantity: 1,
    image: product.image,
  }));

  if (showPayment) {
    return (
      <PaymentPage 
        cartItems={cartItems}
        onBack={handleBackToShopping}
        onPaymentSuccess={handlePaymentSuccess}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50/30 to-white">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-gray-400 w-12 h-12 sm:w-10 sm:h-10 rounded-xl"
        >
          <ArrowLeft className="w-6 h-6 sm:w-5 sm:h-5" />
        </Button>
        <h2 className="text-base sm:text-lg font-light text-gray-900 tracking-wide">Your Products</h2>
        {currentStep === "results" && !showPayment && (
          <ShoppingVoiceAssistant
            key={voiceAssistantKey}
            products={products}
            onRemoveItem={handleVoiceRemoveItem}
            onAddItem={handleVoiceAddItem}
            onChangeItem={handleVoiceChangeItem}
            onOpenAlternatives={handleVoiceOpenAlternatives}
            onSelectFromAlternatives={handleVoiceSelectAlternative}
            onSelectAlternativeByPosition={handleVoiceSelectAlternativeByPosition}
            onConfirmPurchase={handleVoiceConfirmPurchase}
            onCloseAlternatives={handleCloseAlternatives}
          />
        )}
        {currentStep !== "results" && <div className="w-12 sm:w-10" />}
      </div>

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          {currentStep === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-12 sm:py-20 px-4"
            >
              {/* Animated shopping cart icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative mb-6 sm:mb-8"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-brand rounded-3xl flex items-center justify-center shadow-lg">
                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </motion.div>
                </div>

                {/* Floating dots animation */}
                <motion.div
                  className="absolute -top-2 -right-2 w-3 h-3 bg-brand-cyan/70 rounded-full"
                  animate={{
                    y: [-4, 4, -4],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0
                  }}
                />
                <motion.div
                  className="absolute -bottom-2 -left-2 w-2 h-2 bg-brand-cyan rounded-full"
                  animate={{
                    y: [4, -4, 4],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3
                  }}
                />
                <motion.div
                  className="absolute top-1/2 -right-3 w-2.5 h-2.5 bg-brand-cyan/50 rounded-full"
                  animate={{
                    x: [-3, 3, -3],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.6
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <h3 className="text-xl sm:text-2xl font-light text-gray-900 mb-2 sm:mb-3 tracking-wide">
                  Finding your products...
                </h3>
                <p className="text-sm sm:text-base text-gray-500 font-light tracking-wide">
                  Getting the best deals
                </p>
              </motion.div>

              {/* Progress indicator */}
              {searchProgress.total > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 sm:mt-8"
                >
                  <div className="w-32 sm:w-40 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-brand rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${(searchProgress.current / searchProgress.total) * 100}%` }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 tracking-wide">
                    {searchProgress.current} of {searchProgress.total} items
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep === "error" && (
            <motion.div 
              key="error" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="flex flex-col items-center justify-center h-full"
            >
              <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
                <Package className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2 tracking-wide">Search Failed</h3>
              <p className="text-gray-500 text-center font-light mb-6">{error}</p>
              <Button onClick={onBack} variant="gradient">
                Try Again
              </Button>
            </motion.div>
          )}

          {currentStep === "results" && (
            <motion.div 
              key="results" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }} 
              className="h-full flex flex-col"
            >
              
              <div className="flex-1">
                {isSearchingNewItem && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-gray-300 border-t-cyan-400 rounded-full"
                      />
                      <span>Adding item...</span>
                    </div>
                  </div>
                )}
                <ProductResults 
                  products={products} 
                  onProductChange={handleProductChange}
                  voiceAlternativesTrigger={forceAlternativesOpen}
                  voiceAlternativesProduct={alternativesModalTriggerRef.current.product}
                  voiceAlternativesClose={forceAlternativesClose}
                />
              </div>
              
              <div className="mt-6 sm:mt-8">
                <Button
                  onClick={handleConfirmPurchase}
                  variant="gradient"
                  className="w-full"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Confirm - €{products.reduce((s, p) => s + p.price, 0).toFixed(2)}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
