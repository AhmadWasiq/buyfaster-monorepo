import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeft,
  ShoppingCart,
  Camera
} from 'lucide-react';
import { Button } from './ui/button';
import { processOCR } from '../lib/ocr';
import { OCRShoppingFlow } from './OCRShoppingFlow';

interface OCRProcessorProps {
  imageFile?: File;
  imageUrl?: string;
  onClose: () => void;
  onProcessComplete?: (text: string) => void;
  onBackToHome?: () => void;
}

export const OCRProcessor: React.FC<OCRProcessorProps> = ({
  imageFile,
  imageUrl,
  onClose,
  onProcessComplete,
  onBackToHome
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showShoppingFlow, setShowShoppingFlow] = useState(false);

  const handleProcessOCR = async () => {
    setIsProcessing(true);
    setError('');
    setExtractedText('');

    try {
      let result: string;

      if (imageFile) {
        result = await processOCR(imageFile);
      } else if (imageUrl) {
        result = await processOCR(imageUrl);
      } else {
        throw new Error('No image provided');
      }

      setExtractedText(result);
      onProcessComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextChange = (newText: string) => {
    setExtractedText(newText);
    onProcessComplete?.(newText);
  };

  const handleSearchProducts = () => {
    setShowShoppingFlow(true);
  };

  const handleShoppingFlowBack = () => {
    setShowShoppingFlow(false);
  };

  // Auto-process if image is provided
  React.useEffect(() => {
    if (imageFile || imageUrl) {
      handleProcessOCR();
    }
  }, [imageFile, imageUrl]);

  // If shopping flow is active, show that instead
  if (showShoppingFlow) {
    return (
      <OCRShoppingFlow
        extractedText={extractedText}
        onBack={handleShoppingFlowBack}
        onComplete={onBackToHome}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/30 to-white">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 w-12 h-12 sm:w-10 sm:h-10">
          <ArrowLeft className="w-6 h-6 sm:w-5 sm:h-5" />
        </Button>
        <h2 className="text-base sm:text-lg font-light text-gray-900 tracking-wide">Your List</h2>
        <div className="w-12 sm:w-10" />
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          {isProcessing && (
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
                  Getting your shopping list ready...
                </h3>
                <p className="text-sm sm:text-base text-gray-500 font-light tracking-wide">
                  Just a moment
                </p>
              </motion.div>

              {/* Progress indicator */}
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
                    animate={{ width: "100%" }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {error && !isProcessing && (
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
              <h3 className="text-xl font-light text-gray-900 mb-2 tracking-wide">Processing Failed</h3>
              <p className="text-gray-500 text-center font-light mb-6">{error}</p>
              <div className="flex gap-3">
                <Button onClick={onClose} variant="gradient">
                  Go Back
                </Button>
              </div>
            </motion.div>
          )}

          {extractedText && !isProcessing && !error && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 shadow-brand">
                <div className="flex justify-start sm:justify-end mb-4">
                  <Button onClick={handleSearchProducts} variant="gradient" size="sm" className="w-full sm:w-auto px-4 py-2">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Find Products
                  </Button>
                </div>
                <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-4 h-[42rem]">
                  <textarea
                    value={extractedText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="ocr-textarea w-full h-full p-3 border-0 bg-transparent resize-none focus:outline-none focus:ring-0 font-light text-gray-800 leading-relaxed placeholder:text-gray-400 text-base overflow-y-auto"
                    placeholder="Tap here to edit your shopping list..."
                    style={{ fontSize: '16px' }} // Prevents zoom on iOS
                  />
                </div>
              </div>
            </motion.div>
          )}

          {!imageFile && !imageUrl && !isProcessing && !error && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2 tracking-wide">Ready to Extract Text</h3>
              <p className="text-gray-500 text-center font-light mb-8 max-w-md">
                Upload an image or capture from camera to extract text using AI
              </p>
              <Button onClick={onClose} variant="gradient" className="px-6">
                Get Started
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
