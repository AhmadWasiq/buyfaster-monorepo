import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Order, OrderData } from "../entities/Order";
import { format } from "date-fns";

interface OrderWithItems extends OrderData {
  items?: Array<{
    id?: string;
    product_name: string;
    product_image?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

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

// Individual order item card
const OrderCard = ({ order, index }: { order: OrderWithItems; index: number }) => {
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
                {order.order_number || `Order #${order.id?.substring(0, 8)}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-light">
              <Calendar className="w-4 h-4" />
              {format(new Date(order.created_at!), "MMM d, yyyy 'at' h:mm a")}
            </div>
          </div>
          <StatusBadge status={order.status || "pending"} />
        </div>

        {/* Order Summary */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-600" />
            <span className="text-lg font-semibold text-gray-900">
              ${order.total_amount?.toFixed(2)}
            </span>
            <PaymentStatusBadge status={order.payment_status || "pending"} />
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
        {!isExpanded && order.items && order.items.length > 0 && (
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
              {order.items && order.items.length > 0 ? (
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
              ) : (
                <p className="text-sm text-gray-500 font-light">No items found</p>
              )}

              {/* Order Totals */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-light">Subtotal</span>
                  <span className="text-gray-900">${order.subtotal?.toFixed(2)}</span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Tax</span>
                    <span className="text-gray-900">${order.tax_amount?.toFixed(2)}</span>
                  </div>
                )}
                {order.shipping_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-light">Shipping</span>
                    <span className="text-gray-900">${order.shipping_amount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-cyan-600">${order.total_amount?.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
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
              )}

              {/* Voice Command / Notes */}
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

// Main Order History Page Component
const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrdersWithItems();
  }, []);

  const loadOrdersWithItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch orders for current user
      const ordersList = await Order.findByCurrentUser();
      
      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        ordersList.map(async (order) => {
          try {
            const items = await Order.getOrderItems(order.id!);
            return { ...order, items };
          } catch (err) {
            console.error(`Error fetching items for order ${order.id}:`, err);
            return { ...order, items: [] };
          }
        })
      );

      setOrders(ordersWithItems);
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Failed to load order history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/30 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
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
            Order History
          </h2>
          <div className="w-12 sm:w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-8 max-w-4xl mx-auto">
        {isLoading ? (
          // Loading State
          <div className="space-y-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-50 rounded-3xl p-6 h-40"
                />
              ))}
          </div>
        ) : error ? (
          // Error State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
              <ShoppingBag className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-light text-gray-900 mb-2">Error Loading Orders</h3>
            <p className="text-gray-500 text-center font-light mb-6">{error}</p>
            <Button
              onClick={loadOrdersWithItems}
              variant="gradient"
            >
              Try Again
            </Button>
          </motion.div>
        ) : orders.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-50 to-cyan-50 rounded-3xl flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-cyan-600" />
            </div>
            <h3 className="text-xl font-light text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 text-center font-light mb-8">
              Start shopping to see your order history
            </p>
            <Button
              onClick={() => navigate("/")}
              variant="gradient"
              size="sm"
              className="px-8"
            >
              Start Shopping
            </Button>
          </motion.div>
        ) : (
          // Orders List
          <div className="space-y-4">
            {orders.map((order, index) => (
              <OrderCard key={order.id} order={order} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;

