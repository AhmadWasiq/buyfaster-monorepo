import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { format } from "date-fns";

interface MockOrderItem {
  id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface MockOrder {
  id: string;
  order_number: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  voice_command?: string;
  items: MockOrderItem[];
  shipping_address: {
    first_name: string;
    last_name: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

// Generate mock orders with realistic grocery data
const generateMockOrders = (): MockOrder[] => {
  const now = new Date();
  
  return [
    {
      id: "1",
      order_number: "BF-20241002-001",
      total_amount: 87.45,
      subtotal: 87.45,
      tax_amount: 0,
      shipping_amount: 0,
      status: "delivered",
      payment_status: "succeeded",
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      voice_command: "I need milk, eggs, bread, and some fresh vegetables",
      items: [
        {
          id: "1-1",
          product_name: "Organic Whole Milk - 1 Gallon",
          product_image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 5.99,
          total_price: 11.98,
        },
        {
          id: "1-2",
          product_name: "Free Range Large Eggs - 12 Count",
          product_image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 4.99,
          total_price: 4.99,
        },
        {
          id: "1-3",
          product_name: "Artisan Sourdough Bread",
          product_image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 6.49,
          total_price: 6.49,
        },
        {
          id: "1-4",
          product_name: "Fresh Baby Spinach - 10 oz",
          product_image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 3.99,
          total_price: 7.98,
        },
        {
          id: "1-5",
          product_name: "Organic Tomatoes - 1 lb",
          product_image: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=200&h=200&fit=crop",
          quantity: 3,
          unit_price: 4.99,
          total_price: 14.97,
        },
        {
          id: "1-6",
          product_name: "Fresh Broccoli Crowns",
          product_image: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 2.99,
          total_price: 5.98,
        },
        {
          id: "1-7",
          product_name: "Red Bell Peppers - 3 Pack",
          product_image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 5.99,
          total_price: 5.99,
        },
        {
          id: "1-8",
          product_name: "Organic Carrots - 2 lb Bag",
          product_image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 3.49,
          total_price: 6.98,
        },
        {
          id: "1-9",
          product_name: "Fresh Cucumber - Each",
          product_image: "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=200&h=200&fit=crop",
          quantity: 4,
          unit_price: 1.29,
          total_price: 5.16,
        },
        {
          id: "1-10",
          product_name: "Romaine Lettuce Hearts - 3 Pack",
          product_image: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 3.99,
          total_price: 3.99,
        },
        {
          id: "1-11",
          product_name: "Fresh Mushrooms - 8 oz",
          product_image: "https://images.unsplash.com/photo-1614881396115-4e99da0e0f96?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 3.49,
          total_price: 6.98,
        },
        {
          id: "1-12",
          product_name: "Yellow Onions - 3 lb Bag",
          product_image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 2.99,
          total_price: 2.99,
        },
      ],
      shipping_address: {
        first_name: "John",
        last_name: "Doe",
        address_line_1: "123 Main Street",
        address_line_2: "Apt 4B",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "US",
      },
    },
    {
      id: "2",
      order_number: "BF-20241001-042",
      total_amount: 134.82,
      subtotal: 134.82,
      tax_amount: 0,
      shipping_amount: 0,
      status: "delivered",
      payment_status: "succeeded",
      created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      voice_command: "Weekly grocery shopping - meat, chicken, fish, pasta, and pantry staples",
      items: [
        {
          id: "2-1",
          product_name: "Grass-Fed Ground Beef - 1 lb",
          product_image: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 8.99,
          total_price: 17.98,
        },
        {
          id: "2-2",
          product_name: "Organic Chicken Breast - 1.5 lb",
          product_image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 12.99,
          total_price: 25.98,
        },
        {
          id: "2-3",
          product_name: "Wild Caught Salmon Fillet - 1 lb",
          product_image: "https://images.unsplash.com/photo-1485704686097-ed47f7263ca4?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 16.99,
          total_price: 16.99,
        },
        {
          id: "2-4",
          product_name: "Italian Penne Pasta - 1 lb",
          product_image: "https://images.unsplash.com/photo-1551462147-37c8e8f97c54?w=200&h=200&fit=crop",
          quantity: 3,
          unit_price: 2.99,
          total_price: 8.97,
        },
        {
          id: "2-5",
          product_name: "Organic Marinara Sauce - 24 oz",
          product_image: "https://images.unsplash.com/photo-1633896809899-e6e0f8e83301?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 5.49,
          total_price: 10.98,
        },
        {
          id: "2-6",
          product_name: "Extra Virgin Olive Oil - 500ml",
          product_image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 12.99,
          total_price: 12.99,
        },
        {
          id: "2-7",
          product_name: "Arborio Risotto Rice - 1 lb",
          product_image: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 4.99,
          total_price: 4.99,
        },
        {
          id: "2-8",
          product_name: "Sea Salt - 16 oz",
          product_image: "https://images.unsplash.com/photo-1607427628908-fed1a4e4d4f3?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 3.99,
          total_price: 3.99,
        },
        {
          id: "2-9",
          product_name: "Black Peppercorns - 4 oz",
          product_image: "https://images.unsplash.com/photo-1599909533878-6c1a2f60a29c?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 4.99,
          total_price: 4.99,
        },
        {
          id: "2-10",
          product_name: "Garlic Cloves - 3 Bulbs",
          product_image: "https://images.unsplash.com/photo-1541506618330-7c369fc759b5?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 1.99,
          total_price: 3.98,
        },
        {
          id: "2-11",
          product_name: "Fresh Basil - 1 oz",
          product_image: "https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 2.99,
          total_price: 5.98,
        },
        {
          id: "2-12",
          product_name: "Parmesan Cheese - 8 oz",
          product_image: "https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 8.99,
          total_price: 8.99,
        },
        {
          id: "2-13",
          product_name: "Chicken Broth - 32 oz",
          product_image: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 3.49,
          total_price: 6.98,
        },
      ],
      shipping_address: {
        first_name: "John",
        last_name: "Doe",
        address_line_1: "123 Main Street",
        address_line_2: "Apt 4B",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "US",
      },
    },
    {
      id: "3",
      order_number: "BF-20240928-089",
      total_amount: 45.67,
      subtotal: 45.67,
      tax_amount: 0,
      shipping_amount: 0,
      status: "delivered",
      payment_status: "succeeded",
      created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      voice_command: "Breakfast essentials and coffee",
      items: [
        {
          id: "3-1",
          product_name: "Organic Coffee Beans - 12 oz",
          product_image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 14.99,
          total_price: 14.99,
        },
        {
          id: "3-2",
          product_name: "Greek Yogurt - 32 oz",
          product_image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 5.99,
          total_price: 11.98,
        },
        {
          id: "3-3",
          product_name: "Organic Granola - 16 oz",
          product_image: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 6.99,
          total_price: 6.99,
        },
        {
          id: "3-4",
          product_name: "Fresh Blueberries - 6 oz",
          product_image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 4.99,
          total_price: 9.98,
        },
        {
          id: "3-5",
          product_name: "Honey - 16 oz",
          product_image: "https://images.unsplash.com/photo-1587049352846-4a222e784210?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 8.99,
          total_price: 8.99,
        },
      ],
      shipping_address: {
        first_name: "John",
        last_name: "Doe",
        address_line_1: "123 Main Street",
        address_line_2: "Apt 4B",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "US",
      },
    },
    {
      id: "4",
      order_number: "BF-20240925-156",
      total_amount: 98.32,
      subtotal: 98.32,
      tax_amount: 0,
      shipping_amount: 0,
      status: "processing",
      payment_status: "succeeded",
      created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      voice_command: "Snacks, beverages, and party supplies",
      items: [
        {
          id: "4-1",
          product_name: "Organic Tortilla Chips - 13 oz",
          product_image: "https://images.unsplash.com/photo-1613919113640-c65019d0c49f?w=200&h=200&fit=crop",
          quantity: 3,
          unit_price: 4.99,
          total_price: 14.97,
        },
        {
          id: "4-2",
          product_name: "Fresh Salsa - 16 oz",
          product_image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 5.49,
          total_price: 10.98,
        },
        {
          id: "4-3",
          product_name: "Guacamole - 12 oz",
          product_image: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 6.99,
          total_price: 13.98,
        },
        {
          id: "4-4",
          product_name: "Sparkling Water - 12 Pack",
          product_image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 6.99,
          total_price: 13.98,
        },
        {
          id: "4-5",
          product_name: "Organic Hummus - 10 oz",
          product_image: "https://images.unsplash.com/photo-1571158217867-a9e80ff024b6?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 4.99,
          total_price: 9.98,
        },
        {
          id: "4-6",
          product_name: "Baby Carrots - 1 lb",
          product_image: "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 2.99,
          total_price: 5.98,
        },
        {
          id: "4-7",
          product_name: "Mixed Nuts - 16 oz",
          product_image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 12.99,
          total_price: 12.99,
        },
        {
          id: "4-8",
          product_name: "Dark Chocolate Bar - 3.5 oz",
          product_image: "https://images.unsplash.com/photo-1606312619070-d48b4cbc4fac?w=200&h=200&fit=crop",
          quantity: 4,
          unit_price: 3.99,
          total_price: 15.96,
        },
      ],
      shipping_address: {
        first_name: "John",
        last_name: "Doe",
        address_line_1: "123 Main Street",
        address_line_2: "Apt 4B",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "US",
      },
    },
    {
      id: "5",
      order_number: "BF-20240920-234",
      total_amount: 62.45,
      subtotal: 62.45,
      tax_amount: 0,
      shipping_amount: 0,
      status: "delivered",
      payment_status: "succeeded",
      created_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      voice_command: "Cleaning supplies and household items",
      items: [
        {
          id: "5-1",
          product_name: "Laundry Detergent - 100 oz",
          product_image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 18.99,
          total_price: 18.99,
        },
        {
          id: "5-2",
          product_name: "Paper Towels - 8 Pack",
          product_image: "https://images.unsplash.com/photo-1631540575402-26b7756e7988?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 15.99,
          total_price: 15.99,
        },
        {
          id: "5-3",
          product_name: "Dish Soap - 24 oz",
          product_image: "https://images.unsplash.com/photo-1585305865199-da62a8dc8f3f?w=200&h=200&fit=crop",
          quantity: 2,
          unit_price: 4.99,
          total_price: 9.98,
        },
        {
          id: "5-4",
          product_name: "Trash Bags - 45 Count",
          product_image: "https://images.unsplash.com/photo-1621963997794-14c5e7e2c22c?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 12.99,
          total_price: 12.99,
        },
        {
          id: "5-5",
          product_name: "Sponges - 6 Pack",
          product_image: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=200&h=200&fit=crop",
          quantity: 1,
          unit_price: 4.50,
          total_price: 4.50,
        },
      ],
      shipping_address: {
        first_name: "John",
        last_name: "Doe",
        address_line_1: "123 Main Street",
        address_line_2: "Apt 4B",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "US",
      },
    },
  ];
};

// Order status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-cyan-100 text-cyan-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
        statusColors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Payment status badge component
const PaymentStatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-800",
    processing: "bg-cyan-100 text-cyan-800",
    succeeded: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-light ${
        statusColors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Individual order card
const OrderCard = ({ order, index }: { order: MockOrder; index: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-brand-soft hover:shadow-brand transition-shadow duration-200"
    >
      {/* Order Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900 tracking-wide">
                {order.order_number}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-light">
              <Calendar className="w-4 h-4" />
              {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Order Summary */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-600" />
            <span className="text-lg font-semibold text-gray-900">
              ${order.total_amount.toFixed(2)}
            </span>
            <PaymentStatusBadge status={order.payment_status} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                View Details
              </>
            )}
          </Button>
        </div>

        {/* Items Preview (when collapsed) */}
        {!isExpanded && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-500 font-light">
              {order.items.length} {order.items.length === 1 ? "item" : "items"}
            </span>
          </div>
        )}
      </div>

      {/* Expanded Order Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 bg-gray-50"
          >
            <div className="p-6 space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                {order.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center gap-4 bg-white rounded-2xl p-4"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 truncate">
                        {item.product_name}
                      </h5>
                      <p className="text-sm text-gray-500 font-light">
                        Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${item.total_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-light">Subtotal</span>
                  <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Tax</span>
                    <span className="text-gray-900">${order.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                {order.shipping_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Shipping</span>
                    <span className="text-gray-900">${order.shipping_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-cyan-600">${order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h4>
                <div className="text-sm text-gray-600 font-light space-y-1">
                  <p>
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </p>
                  <p>{order.shipping_address.address_line_1}</p>
                  {order.shipping_address.address_line_2 && (
                    <p>{order.shipping_address.address_line_2}</p>
                  )}
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state}{" "}
                    {order.shipping_address.postal_code}
                  </p>
                  <p>{order.shipping_address.country}</p>
                </div>
              </div>

              {/* Voice Command */}
              {order.voice_command && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Original Request</h4>
                  <p className="text-sm text-gray-600 font-light italic">
                    "{order.voice_command}"
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main Mock Order History Page Component
const MockOrderHistoryPage = () => {
  const [orders] = useState<MockOrder[]>(generateMockOrders());
  const navigate = useNavigate();

  const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-gray-400 w-12 h-12 sm:w-10 sm:h-10 rounded-xl hover:bg-gray-50"
          >
            <ArrowLeft className="w-6 h-6 sm:w-5 sm:h-5" />
          </Button>
          <h2 className="text-base sm:text-lg font-light text-gray-900 tracking-wide">
            Order History (Demo)
          </h2>
          <div className="w-12 sm:w-10" />
        </div>
      </div>

      {/* Stats Banner */}
      <div className="px-4 sm:px-6 py-6 bg-gradient-to-br from-cyan-50 to-cyan-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-sm text-gray-600 font-light mb-1">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-sm text-gray-600 font-light mb-1">Total Spent</p>
              <p className="text-2xl font-semibold text-cyan-600">${totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="px-4 sm:px-6 py-4 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> This is a preview showing what your order history will look like after shopping. These are mock orders with realistic data.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-8 max-w-4xl mx-auto">
        <div className="space-y-4">
          {orders.map((order, index) => (
            <OrderCard key={order.id} order={order} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MockOrderHistoryPage;

