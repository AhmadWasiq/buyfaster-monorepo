import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Trash2, Loader2, Package, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { ShoppingList, ShoppingListData } from '../entities/ShoppingList';

const SavedListsPage = () => {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ShoppingListData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderingListId, setOrderingListId] = useState<string | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setIsLoading(true);
    try {
      const data = await ShoppingList.list();
      setLists(data);
    } catch (error) {
      console.error('Failed to load lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderList = async (list: ShoppingListData) => {
    setOrderingListId(list.id!);
    try {
      // Get list items
      const items = await ShoppingList.getItems(list.id!);
      
      // Save to sessionStorage for OCRShoppingFlow to process
      const cartItems = items.map(item => ({
        id: item.id || '',
        name: item.product_name,
        image: item.product_image,
        description: item.product_description,
        price: item.unit_price,
        quantity: item.quantity,
        metadata: item.product_metadata
      }));
      
      sessionStorage.setItem('reorder_cart_items', JSON.stringify(cartItems));
      sessionStorage.setItem('reorder_list_id', list.id!);

      // Navigate to payment page
      navigate('/reorder-payment');
    } catch (error) {
      console.error('Failed to order list:', error);
      alert('Failed to start order. Please try again.');
    } finally {
      setOrderingListId(null);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;
    
    try {
      await ShoppingList.delete(listId);
      await loadLists();
    } catch (error) {
      console.error('Failed to delete list:', error);
      alert('Failed to delete list. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/30 to-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/Home")}
          className="text-gray-400 w-12 h-12 sm:w-10 sm:h-10 rounded-xl"
        >
          <ArrowLeft className="w-6 h-6 sm:w-5 sm:h-5" />
        </Button>
        <h2 className="text-base sm:text-lg font-light text-gray-900 tracking-wide">Saved Shopping Lists</h2>
        <div className="w-12 sm:w-10" />
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-8">
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-50 rounded-3xl p-6 h-28" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-light text-gray-900 mb-2">No saved lists yet</h3>
            <p className="text-gray-500 text-center font-light mb-6">
              Complete a shopping order and save it as a list for quick reordering
            </p>
            <Button
              onClick={() => navigate('/Home')}
              variant="gradient"
              size="sm"
              className="px-6"
            >
              Start Shopping
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {lists.map((list, index) => (
                <motion.div
                  key={list.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white border rounded-3xl p-6 shadow-brand-soft hover:shadow-brand-hover ${
                    list.status === 'pending'
                      ? 'border-amber-200 bg-gradient-to-r from-amber-50/50 to-white'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      list.status === 'pending'
                        ? 'bg-amber-100'
                        : 'bg-cyan-50'
                    }`}>
                      <Package className={`w-8 h-8 ${
                        list.status === 'pending'
                          ? 'text-amber-600'
                          : 'text-cyan-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 tracking-wide">{list.name}</h4>
                        {list.status === 'pending' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            Pending Payment
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mb-2 font-light">
                        Total: €{list.total_amount.toFixed(2)}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {new Date(list.created_at!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleOrderList(list)}
                        disabled={orderingListId === list.id}
                        variant={list.status === 'pending' ? 'gradient' : 'gradient'}
                        size="sm"
                        className={list.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : ''}
                      >
                        {orderingListId === list.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : list.status === 'pending' ? (
                          <CreditCard className="w-4 h-4" />
                        ) : (
                          <ShoppingBag className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline tracking-wide">
                          {orderingListId === list.id
                            ? 'Processing...'
                            : list.status === 'pending'
                              ? 'Pay Now'
                              : 'Order Again'
                          }
                        </span>
                      </Button>
                      <Button
                        onClick={() => handleDeleteList(list.id!)}
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-xl text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default SavedListsPage;
