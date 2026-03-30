import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  MoreHorizontal,
  ArrowLeft,
  Check,
  ShoppingBag,
  User,
  Mail,
  Settings,
  Shield,
  Plus,
  Trash2,
  RotateCcw,
  Loader2,
  X,
  Upload,
  List,
  History,
  ExternalLink,
  Star,
  Truck,
  Info,
  RefreshCw,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Order } from "./entities/Order";
import { CustomItem } from "./entities/CustomItem";
import { format } from "date-fns";
import { Link, useLocation, useNavigate, BrowserRouter, Routes, Route } from "react-router-dom";
import { createPageUrl as b44CreatePageUrl } from "./utils";

// --- UTILITY FUNCTIONS ---
// Note: With BrowserRouter, we use the path directly
const createPageUrl = (path) => `/${path}`;

// =======================================================================
// --- COMPONENT: WaveformAnimation ---
// =======================================================================
// Renders the animated sound wave lines around the main button during voice capture.
const WaveformAnimation = ({ isActive }) => {
  const generateWaveformLines = () => {
    const lines = [];
    const totalLines = 48;
    const radius = 140;

    for (let i = 0; i < totalLines; i++) {
      const angle = (i * 360) / totalLines;
      const radian = (angle * Math.PI) / 180;
      const x = Math.cos(radian) * radius;
      const y = Math.sin(radian) * radius;
      lines.push({ id: i, x, y, angle, delay: i * 0.02 });
    }
    return lines;
  };

  const waveformLines = generateWaveformLines();
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {waveformLines.map((line) => (
        <motion.div
          key={line.id}
          className="absolute w-0.5 bg-gradient-to-t from-cyan-400 to-cyan-300 rounded-full origin-bottom"
          style={{
            left: `calc(50% + ${line.x}px)`,
            top: `calc(50% + ${line.y}px)`,
            transform: `rotate(${line.angle + 90}deg)`,
          }}
          initial={{ height: 4, opacity: 0.3 }}
          animate={{
            height: [4, 20, 8, 16, 4, 12, 6],
            opacity: [0.3, 0.8, 0.5, 0.9, 0.4, 0.7, 0.3],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: line.delay,
            times: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1],
          }}
        />
      ))}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-gradient-radial from-cyan-100/20 via-transparent to-transparent"
        animate={{
          scale: [1, 1.1, 1, 1.05, 1],
          opacity: [0.2, 0.4, 0.1, 0.3, 0.2],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

// =======================================================================
// --- COMPONENT: CameraOptions ---
// =======================================================================
// Displays the subtle dropdown for camera and upload options.
const CameraOptions = ({ isOpen, onClose }) => {
  const fileInputRef = useRef(null);
  const handleFileUpload = () => fileInputRef.current?.click();
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-16 right-0 bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 z-50 min-w-48"
          >
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full justify-start px-4 py-3 rounded-2xl hover:bg-gray-50"
            >
              <Camera className="w-5 h-5 mr-3 text-gray-600" />
              <span className="font-light tracking-wide text-gray-700">Use Camera</span>
            </Button>
            <Button
              onClick={handleFileUpload}
              variant="ghost"
              className="w-full justify-start px-4 py-3 rounded-2xl hover:bg-gray-50"
            >
              <Upload className="w-5 h-5 mr-3 text-gray-600" />
              <span className="font-light tracking-wide text-gray-700">Upload Image</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// =======================================================================
// --- COMPONENT: MainMenu ---
// =======================================================================
// Displays the main 3-dot menu with navigation options.
const MainMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const menuItems = [
    { icon: User, label: "User Profile", path: "Profile" },
    { icon: List, label: "List", subtitle: "Custom purchases", path: "CustomList" },
    { icon: History, label: "History", path: "History" },
    { icon: ExternalLink, label: "Coming Soon", url: "https://www.buyfaster.fr" },
  ];

  const handleAction = (item) => {
    onClose();
    if (item.path) navigate(createPageUrl(item.path));
    if (item.url) window.open(item.url, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-16 left-0 bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 z-50 min-w-56"
          >
            {menuItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  onClick={() => handleAction(item)}
                  variant="ghost"
                  className="w-full justify-start px-4 py-3 rounded-2xl hover:bg-gray-50 h-auto"
                >
                  <item.icon className="w-5 h-5 mr-3 text-gray-600" />
                  <div className="text-left">
                    <span className="font-light tracking-wide text-gray-700">{item.label}</span>
                    {item.subtitle && <p className="text-xs text-gray-500 font-light">{item.subtitle}</p>}
                  </div>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// =======================================================================
// --- COMPONENT: ProductDetailsModal ---
// =======================================================================
// Modal popup to show detailed information about a product.
const ProductDetailsModal = ({ product, isOpen, onClose }) => {
  if (!product) return null;
  const mockDetails = {
    rating: 4.5, reviews: 128, shipping: "Free shipping", warranty: "1 year warranty", inStock: true,
    features: ["Premium organic quality", "Sustainably sourced", "No artificial preservatives"],
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"/>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <h3 className="text-lg font-light tracking-wide">Product Details</h3>
                <Button onClick={onClose} variant="ghost" size="icon" className="w-8 h-8 rounded-xl text-gray-400"><X className="w-4 h-4" /></Button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-3xl overflow-hidden mx-auto mb-4"><img src={product.image} alt={product.name} className="w-full h-full object-cover"/></div>
                  <h4 className="text-xl font-medium text-gray-900 tracking-wide mb-2">{product.name}</h4>
                  <p className="text-gray-500 font-light">{product.description}</p>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                  <div className="text-2xl font-semibold text-cyan-600">${product.price.toFixed(2)}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-medium">{mockDetails.rating}</span></div>
                    <span className="text-gray-500 text-sm">({mockDetails.reviews} reviews)</span>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-3 tracking-wide">Features</h5>
                  <div className="space-y-2">{mockDetails.features.map((f, i) => <div key={i} className="flex items-center gap-3"><div className="w-2 h-2 bg-cyan-500 rounded-full" /><span className="text-gray-600 font-light">{f}</span></div>)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-2xl p-3 text-center"><Truck className="w-5 h-5 text-green-600 mx-auto mb-1" /><p className="text-green-700 font-medium text-sm">{mockDetails.shipping}</p></div>
                  <div className="bg-blue-50 rounded-2xl p-3 text-center"><Shield className="w-5 h-5 text-blue-600 mx-auto mb-1" /><p className="text-blue-700 font-medium text-sm">{mockDetails.warranty}</p></div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// =======================================================================
// --- COMPONENT: ChangeProductList ---
// =======================================================================
// Modal to show alternative products when the user wants to change an item.
const ChangeProductList = ({ originalProduct, isOpen, onClose }) => {
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  if (!originalProduct) return null;

  const getAlternativeProducts = (original) => {
    if (original.name.toLowerCase().includes("banana")) {
      return [
        { id: 101, name: "Premium Organic Bananas", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&h=200&fit=crop", price: 4.99, description: "Premium grade, 3 lbs", brand: "Whole Foods" },
        { id: 102, name: "Fair Trade Bananas", image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=200&h=200&fit=crop", price: 3.49, description: "Certified fair trade, 2 lbs", brand: "Equal Exchange" },
      ];
    }
    return [
      { id: 201, name: "Artisan Sourdough Bread", image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=200&h=200&fit=crop", price: 5.99, description: "Hand-crafted loaf", brand: "Local Bakery" },
      { id: 202, name: "Gluten-Free Whole Grain", image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=200&h=200&fit=crop", price: 6.49, description: "Gluten-free loaf", brand: "Canyon Bakehouse" },
    ];
  };

  const alternatives = getAlternativeProducts(originalProduct);
  const handleSelectAlternative = (product) => {
    setSelectedAlternative(product);
    setTimeout(() => onClose(), 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div>
                  <h3 className="text-lg font-light tracking-wide">Change Product</h3>
                  <p className="text-sm text-gray-500 font-light">Alternatives for {originalProduct.name}</p>
                </div>
                <Button onClick={onClose} variant="ghost" size="icon" className="w-8 h-8 rounded-xl text-gray-400"><X className="w-4 h-4" /></Button>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <p className="text-xs text-gray-500 font-light mb-2 uppercase tracking-wider">Current Selection</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl overflow-hidden"><img src={originalProduct.image} alt={originalProduct.name} className="w-full h-full object-cover" /></div>
                  <div className="flex-1"><p className="font-medium text-gray-900 text-sm">{originalProduct.name}</p><p className="text-cyan-600 font-medium">${originalProduct.price.toFixed(2)}</p></div>
                </div>
              </div>
              <div className="p-6 space-y-3 overflow-y-auto">
                {alternatives.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border rounded-3xl p-4 cursor-pointer transition-all ${selectedAlternative?.id === product.id ? 'border-cyan-300 bg-cyan-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => handleSelectAlternative(product)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0"><img src={product.image} alt={product.name} className="w-full h-full object-cover" /></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1 text-sm">{product.name}</h4>
                        <p className="text-gray-500 text-xs font-light mb-1">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-cyan-600 font-medium">${product.price.toFixed(2)}</div>
                          <Button onClick={(e) => { e.stopPropagation(); setSelectedProductForDetails(product); }} variant="ghost" size="icon" className="w-6 h-6 rounded-lg text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-3 h-3" /></Button>
                        </div>
                      </div>
                      {selectedAlternative?.id === product.id && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></motion.div>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
          <ProductDetailsModal product={selectedProductForDetails} isOpen={!!selectedProductForDetails} onClose={() => setSelectedProductForDetails(null)} />
        </>
      )}
    </AnimatePresence>
  );
};

// =======================================================================
// --- COMPONENT: ProductResults ---
// =======================================================================
// Displays the list of products found based on the voice command.
const ProductResults = ({ products }) => {
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);
  const [selectedProductForChange, setSelectedProductForChange] = useState(null);

  return (
    <div className="space-y-4">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0"><img src={product.image} alt={product.name} className="w-full h-full object-cover" /></div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1 tracking-wide">{product.name}</h4>
              <p className="text-gray-500 text-sm mb-2 font-light">{product.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-cyan-600 font-medium text-lg tracking-wide">${product.price.toFixed(2)}</div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setSelectedProductForChange(product)} variant="ghost" size="sm" className="text-gray-500 hover:text-cyan-600 px-3 py-1 rounded-xl text-xs"><RefreshCw className="w-3 h-3 mr-1" />Change</Button>
                  <Button onClick={() => setSelectedProductForDetails(product)} variant="ghost" size="icon" className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      <ProductDetailsModal product={selectedProductForDetails} isOpen={!!selectedProductForDetails} onClose={() => setSelectedProductForDetails(null)} />
      <ChangeProductList originalProduct={selectedProductForChange} isOpen={!!selectedProductForChange} onClose={() => setSelectedProductForChange(null)} />
    </div>
  );
};

// =======================================================================
// --- COMPONENT: PaymentConfirmation ---
// =======================================================================
// Full-screen view to confirm successful payment with an animation.
const PaymentConfirmation = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-white">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }} className="relative mb-8">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="w-24 h-24 bg-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/25">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}><Check className="w-12 h-12 text-white" /></motion.div>
        </motion.div>
        <motion.div initial={{ scale: 0, opacity: 0.8 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} className="absolute inset-0 bg-cyan-400 rounded-full" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-center mb-8">
        <h2 className="text-2xl font-light text-gray-900 mb-3 tracking-wide">Order Confirmed</h2>
        <p className="text-gray-500 text-lg font-light">Your items will be delivered soon</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Button onClick={onComplete} variant="outline" className="px-8 py-3 rounded-3xl border-gray-200">Continue Shopping</Button>
      </motion.div>
    </motion.div>
  );
};

// =======================================================================
// --- COMPONENT: VoiceProcessing ---
// =======================================================================
// Container for the processing, results, and confirmation steps after voice input.
const VoiceProcessing = ({ currentStep, recognizedText, onBack }) => {
  const [showPayment, setShowPayment] = useState(false);
  const mockProducts = [
    { id: 1, name: "Organic Bananas", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&h=200&fit=crop", price: 3.99, description: "Fresh organic, 2 lbs" },
    { id: 2, name: "Whole Wheat Bread", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop", price: 4.49, description: "Artisan loaf" }
  ];

  const handleConfirmPurchase = async () => {
    for (const product of mockProducts) {
      await Order.create({
        product_name: product.name, product_image: product.image, price: product.price,
        quantity: 1, voice_command: recognizedText, status: "completed",
      });
    }
    setShowPayment(true);
  };

  if (showPayment) return <PaymentConfirmation onComplete={onBack} />;

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex items-center justify-between px-6 py-6 border-b border-gray-50">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-gray-400 w-10 h-10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-lg font-light text-gray-900 tracking-wide">Voice Shopping</h2>
        <div className="w-10" />
      </div>
      <div className="flex-1 px-6 py-8">
        <AnimatePresence mode="wait">
          {currentStep === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-2 border-gray-200 border-t-cyan-400 rounded-full mb-8" />
              <h3 className="text-xl font-light text-gray-900 mb-2 tracking-wide">Processing...</h3>
              <p className="text-gray-500 text-center font-light">Finding the best products for you</p>
            </motion.div>
          )}
          {currentStep === "results" && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex flex-col">
              <div className="bg-gray-50 rounded-3xl p-6 mb-8 border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-3 tracking-wide uppercase">You said</h3>
                <p className="text-gray-900 text-lg font-light leading-relaxed">"{recognizedText}"</p>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-light text-gray-900 mb-6 tracking-wide">Found these products</h3>
                <ProductResults products={mockProducts} />
              </div>
              <div className="mt-8">
                <Button onClick={handleConfirmPurchase} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-4 h-auto rounded-3xl text-lg font-light tracking-wide"><Check className="w-5 h-5 mr-2" />Confirm & Buy — ${mockProducts.reduce((s, p) => s + p.price, 0).toFixed(2)}</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// =======================================================================
// --- COMPONENT: OrderItem (for History page) ---
// =======================================================================
// Displays a single order item in the history list.
const OrderItem = ({ order, index, onReorder, isReordering }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0"><img src={order.product_image || "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop"} alt={order.product_name} className="w-full h-full object-cover" /></div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 mb-1 tracking-wide">{order.product_name}</h4>
        <p className="text-gray-500 text-sm mb-2 font-light">{format(new Date(order.created_date), "MMM d, yyyy")}</p>
        <div className="flex items-center gap-3"><span className="text-cyan-600 font-medium tracking-wide">${order.price.toFixed(2)}</span></div>
      </div>
      <Button onClick={() => onReorder(order)} disabled={isReordering} variant="outline" size="sm" className="flex items-center gap-2 px-4 py-2 rounded-2xl border-gray-200 font-light">
        {isReordering ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
        <span className="hidden sm:inline tracking-wide">{isReordering ? "Ordering..." : "Buy Again"}</span>
      </Button>
    </div>
  </motion.div>
);

// =======================================================================
// --- COMPONENT: AddItemDialog (for CustomList page) ---
// =======================================================================
// Modal dialog to add a new custom item to the user's list.
const AddItemDialog = ({ isOpen, onClose, onSave }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", preferred_brand: "", estimated_price: "", category: "groceries" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await CustomItem.create({ ...formData, estimated_price: formData.estimated_price ? parseFloat(formData.estimated_price) : null });
    setFormData({ name: "", description: "", preferred_brand: "", estimated_price: "", category: "groceries" });
    onSave();
    onClose();
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <h3 className="text-lg font-light tracking-wide">Add Custom Item</h3>
                <Button onClick={onClose} variant="ghost" size="icon" className="w-8 h-8 rounded-xl text-gray-400"><X className="w-4 h-4" /></Button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <Input placeholder="Item name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-2xl" required />
                <Textarea placeholder="Description (optional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="rounded-2xl h-20" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Preferred brand" value={formData.preferred_brand} onChange={(e) => setFormData({ ...formData, preferred_brand: e.target.value })} className="rounded-2xl" />
                  <Input type="number" step="0.01" placeholder="Est. price" value={formData.estimated_price} onChange={(e) => setFormData({ ...formData, estimated_price: e.target.value })} className="rounded-2xl" />
                </div>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="groceries">Groceries</SelectItem><SelectItem value="household">Household</SelectItem><SelectItem value="personal">Personal</SelectItem><SelectItem value="electronics">Electronics</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
                <div className="flex gap-3 pt-2">
                  <Button type="button" onClick={onClose} variant="outline" className="flex-1 rounded-2xl" disabled={isLoading}>Cancel</Button>
                  <Button type="submit" className="flex-1 rounded-2xl bg-cyan-600 hover:bg-cyan-700" disabled={isLoading}>{isLoading ? "Adding..." : "Add Item"}</Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


// =======================================================================
// --- PAGE: Home ---
// =======================================================================
const HomePage = () => {
  const [currentStep, setCurrentStep] = useState("idle");
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);

  const startVoiceCapture = () => {
    setCurrentStep("listening");
    setIsListening(true);
    setTimeout(() => {
      setCurrentStep("processing");
      setIsListening(false);
      setTimeout(() => {
        setRecognizedText("I need organic bananas and whole wheat bread");
        setCurrentStep("results");
      }, 1500);
    }, 3000);
  };

  const resetToHome = () => {
    setCurrentStep("idle");
    setRecognizedText("");
    setIsListening(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      <AnimatePresence mode="wait">
        {currentStep === "idle" ? (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col relative">
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-6">
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => setShowMainMenu(true)} className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100"><MoreHorizontal className="w-5 h-5 text-gray-600" /></Button>
                <MainMenu isOpen={showMainMenu} onClose={() => setShowMainMenu(false)} />
              </div>
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => setShowCameraOptions(true)} className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100"><Camera className="w-5 h-5 text-gray-600" /></Button>
                <CameraOptions isOpen={showCameraOptions} onClose={() => setShowCameraOptions(false)} />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
              <div className="text-center mb-20">
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-600 text-lg font-light tracking-wide mb-2">What do you want to buy?</motion.p>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-gray-400 text-base font-light">Just say it…</motion.p>
              </div>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6, type: "spring" }} className="relative mb-20">
                <Button onClick={startVoiceCapture} className="w-56 h-56 rounded-full bg-white hover:bg-gray-50 shadow-2xl shadow-gray-200/50 border-2 border-gray-100"><span className="text-gray-900 text-xl font-light tracking-wider">Buyfaster</span></Button>
                <div className="absolute inset-[-8px] rounded-full bg-gradient-to-r from-cyan-100/30 via-transparent to-blue-100/30 -z-10"></div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center"><p className="text-gray-400 text-sm font-light tracking-wide">Tap to start voice shopping</p></motion.div>
            </div>
          </motion.div>
        ) : currentStep === "listening" ? (
          <motion.div key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center px-8 py-16">
            <div className="text-center mb-16">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-600 text-lg font-light mb-2">Listening...</motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-gray-400 text-base font-light">Speak clearly and naturally</motion.p>
            </div>
            <div className="relative mb-16">
              <div className="w-56 h-56 rounded-full bg-white shadow-2xl shadow-gray-200/50 border-2 border-gray-100 flex items-center justify-center relative z-10"><span className="text-gray-900 text-xl font-light tracking-wider">Buyfaster</span></div>
              <WaveformAnimation isActive={isListening} />
            </div>
            <Button onClick={resetToHome} variant="ghost" className="text-gray-500 rounded-2xl">Cancel</Button>
          </motion.div>
        ) : (
          <VoiceProcessing currentStep={currentStep} recognizedText={recognizedText} onBack={resetToHome} />
        )}
      </AnimatePresence>
    </div>
  );
};

// =======================================================================
// --- PAGE: History ---
// =======================================================================
const HistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    const data = await Order.list("-created_date");
    setOrders(data);
    setIsLoading(false);
  };

  const handleReorder = async (order) => {
    setReorderingId(order.id);
    await Order.create({
      product_name: order.product_name, product_image: order.product_image, price: order.price,
      quantity: order.quantity, voice_command: "Reordered: " + order.product_name
    });
    await loadOrders();
    setReorderingId(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-6 py-6 border-b border-gray-50">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("Home"))} className="text-gray-400 w-10 h-10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-lg font-light text-gray-900 tracking-wide">Order History</h2>
        <div className="w-10" />
      </div>
      <div className="px-6 py-8">
        {isLoading ? (
          <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-gray-50 rounded-3xl p-6 h-28" />)}</div>
        ) : orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-6"><ShoppingBag className="w-8 h-8 text-gray-400" /></div>
            <h3 className="text-lg font-light text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 text-center font-light">Start shopping to see your history</p>
          </motion.div>
        ) : (
          <AnimatePresence><div className="space-y-4">{orders.map((order, index) => <OrderItem key={order.id} order={order} index={index} onReorder={handleReorder} isReordering={reorderingId === order.id} />)}</div></AnimatePresence>
        )}
      </div>
    </div>
  );
};

// =======================================================================
// --- PAGE: Profile ---
// =======================================================================
const ProfilePage = () => {
  const navigate = useNavigate();
  const profileOptions = [
    { icon: Mail, label: "Contact Information", desc: "Update your email" },
    { icon: Settings, label: "Preferences", desc: "Voice and notifications" },
    { icon: Shield, label: "Privacy & Security", desc: "Manage your data" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-6 py-6 border-b border-gray-50">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("Home"))} className="text-gray-400 w-10 h-10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-lg font-light text-gray-900 tracking-wide">Profile</h2>
        <div className="w-10" />
      </div>
      <div className="px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4"><User className="w-12 h-12 text-cyan-600" /></div>
          <h3 className="text-xl font-light text-gray-900 mb-1">Welcome Back</h3>
          <p className="text-gray-500 font-light">user@buyfaster.fr</p>
        </motion.div>
        <div className="space-y-3">
          {profileOptions.map((item, index) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-gray-50 rounded-3xl p-4 border border-gray-100 hover:bg-gray-100 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center"><item.icon className="w-5 h-5 text-gray-600" /></div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.label}</h4>
                  <p className="text-gray-500 text-sm font-light">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =======================================================================
// --- PAGE: CustomList ---
// =======================================================================
const CustomListPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const categoryColors = { groceries: "bg-green-100 text-green-800", household: "bg-blue-100 text-blue-800", personal: "bg-purple-100 text-purple-800", electronics: "bg-yellow-100 text-yellow-800", other: "bg-gray-100 text-gray-800" };

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setIsLoading(true);
    const data = await CustomItem.list("-created_date");
    setItems(data);
    setIsLoading(false);
  };

  const handleDeleteItem = async (itemId) => {
    await CustomItem.delete(itemId);
    await loadItems();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-6 py-6 border-b border-gray-50">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("Home"))} className="text-gray-400 w-10 h-10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-lg font-light text-gray-900 tracking-wide">Custom List</h2>
        <Button onClick={() => setShowAddDialog(true)} size="icon" className="w-10 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-700"><Plus className="w-5 h-5" /></Button>
      </div>
      <div className="px-6 py-8">
        {isLoading ? (
          <div className="space-y-4">{Array(5).fill(0).map((_, i) => <div key={i} className="animate-pulse bg-gray-50 rounded-3xl p-4 h-20" />)}</div>
        ) : items.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-6"><Plus className="w-8 h-8 text-gray-400" /></div>
            <h3 className="text-lg font-light text-gray-900 mb-2">No custom items yet</h3>
            <p className="text-gray-500 text-center font-light mb-6">Add items for quick access</p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-cyan-600 hover:bg-cyan-700 rounded-2xl px-6">Add First Item</Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.05 }} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-light ${categoryColors[item.category]}`}>{item.category}</span>
                      </div>
                      {item.description && <p className="text-gray-500 text-sm font-light mb-2">{item.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.estimated_price && <span className="text-cyan-600 font-medium">${item.estimated_price.toFixed(2)}</span>}
                      <Button onClick={() => handleDeleteItem(item.id)} variant="ghost" size="icon" className="w-8 h-8 rounded-xl text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <AddItemDialog isOpen={showAddDialog} onClose={() => setShowAddDialog(false)} onSave={loadItems} />
    </div>
  );
};


// =======================================================================
// --- LAYOUT AND ROUTER SETUP ---
// =======================================================================
const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-white">
    <style>{`:root { --primary: #06B6D4; }`}</style>
    <main className="min-h-screen">{children}</main>
  </div>
);

// This is the main export. It sets up the router and renders the correct page.
export default function AllInOne() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Home" element={<HomePage />} />
          <Route path="/History" element={<HistoryPage />} />
          <Route path="/Profile" element={<ProfilePage />} />
          <Route path="/CustomList" element={<CustomListPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}