import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentPage from './PaymentPage';
import { Order } from '../entities/Order';
import { ShoppingList } from '../entities/ShoppingList';

const ReorderPaymentPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart items from sessionStorage
    const cartItemsJson = sessionStorage.getItem('reorder_cart_items');
    if (!cartItemsJson) {
      // For development/UI testing, provide mock cart items if none exist
      console.warn('No reorder cart items found in sessionStorage. Using mock data for development.');
      const mockCartItems = [
        {
          name: 'Sample Product 1',
          image: 'https://via.placeholder.com/150',
          description: 'This is a sample product for testing',
          price: 9.99,
          quantity: 2
        },
        {
          name: 'Sample Product 2',
          image: 'https://via.placeholder.com/150',
          description: 'Another sample product for testing',
          price: 14.99,
          quantity: 1
        }
      ];
      setCartItems(mockCartItems);
      setLoading(false);
      return;
    }

    try {
      const items = JSON.parse(cartItemsJson);
      setCartItems(items);
    } catch (error) {
      console.error('Failed to parse cart items:', error);
      alert('Failed to load items');
      navigate('/CustomList');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handlePaymentSuccess = async () => {
    // Check if this is a reorder from a saved list
    const reorderListId = sessionStorage.getItem('reorder_list_id');

    // Save orders to database after successful payment
    for (const item of cartItems) {
      await Order.createLegacy({
        product_name: item.name,
        product_image: item.image,
        price: item.price,
        quantity: item.quantity || 1,
        voice_command: `Reorder from saved list: ${item.name}`,
        status: "completed",
      });
    }

    // If this was a reorder from a saved list, mark it as completed
    if (reorderListId) {
      try {
        await ShoppingList.updateStatus(reorderListId, 'completed');
        console.log('Marked shopping list as completed:', reorderListId);
      } catch (error) {
        console.error('Failed to update list status:', error);
        // Don't fail the entire process if this fails
      }
    }

    // Clear the reorder items from sessionStorage
    sessionStorage.removeItem('reorder_cart_items');
    sessionStorage.removeItem('reorder_list_id');

    // Redirect to payment success page
    window.location.href = '/#/payment-success';
  };

  const handleBack = () => {
    navigate('/CustomList');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  return (
    <PaymentPage 
      cartItems={cartItems}
      onBack={handleBack}
      onPaymentSuccess={handlePaymentSuccess}
    />
  );
};

export default ReorderPaymentPage;
