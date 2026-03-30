import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useNavigate } from 'react-router-dom';

const NumberedListPage = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const filledCount = Object.values(values).filter(value => value.trim() !== '').length;

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 100);
  }, []);

  const handleReset = () => {
    setValues({});
    setCopied(false);
    // Focus on first input after reset
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  };

  const handleInputChange = (index: number, value: string) => {
    setValues(prev => ({ ...prev, [index]: value }));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < 100 && inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex]?.focus();
      }
    }
  };

  const handleCopy = async () => {
    const filledItems = Object.entries(values)
      .filter(([_, value]) => value.trim() !== '')
      .map(([index, value]) => `${parseInt(index) + 1}- ${value}`)
      .join('\n');

    if (filledItems) {
      try {
        await navigator.clipboard.writeText(filledItems);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = filledItems;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackErr) {
          console.error('Fallback copy failed: ', fallbackErr);
        }
        document.body.removeChild(textArea);
      }
    } else {
      // Show feedback when no items are filled
      alert('Please fill in at least one item before copying.');
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
        <div className="text-center">
          <h2 className="text-base sm:text-lg font-light text-gray-900 tracking-wide">Numbered List</h2>
          {filledCount > 0 && (
            <p className="text-xs text-gray-500 font-light">{filledCount} item{filledCount !== 1 ? 's' : ''} filled</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="rounded-2xl px-3 flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            disabled={filledCount === 0}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button
            onClick={handleCopy}
            variant="gradient"
            size="sm"
            className="px-4 flex items-center gap-2"
            disabled={filledCount === 0}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copied ? 'Copied!' : `Copy (${filledCount})`}</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <h3 className="text-lg font-light text-gray-900 mb-2">Fill in your numbered list</h3>
            <p className="text-gray-500 text-sm font-light">
              Press Enter to move to the next item. Click Copy when done.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 100 }, (_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.01 }}
                className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100"
              >
                <span className="text-gray-600 font-medium text-sm w-8 flex-shrink-0">
                  {index + 1}.
                </span>
                <span className="text-gray-400">-</span>
                <Input
                  ref={(el) => { inputRefs.current[index] = el; }}
                  value={values[index] || ''}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  placeholder={`Item ${index + 1}`}
                  className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </motion.div>
            ))}
          </div>

          {/* Buttons at bottom for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center sm:hidden"
          >
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={handleReset}
                variant="ghost"
                className="rounded-2xl px-4 py-3 flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                disabled={filledCount === 0}
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </Button>
              <Button
                onClick={handleCopy}
                variant="ghost"
                className="rounded-2xl px-8 py-3 flex items-center gap-2 shadow-lg"
                style={{
                  backgroundColor: filledCount === 0 ? '#d1d5db' : '#0891b2',
                  color: filledCount === 0 ? '#6b7280' : 'white',
                  border: 'none'
                }}
                disabled={filledCount === 0}
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
                {copied ? 'Copied!' : `Copy List (${filledCount})`}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default NumberedListPage;
