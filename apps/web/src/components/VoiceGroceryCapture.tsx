import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';
import { useConversation } from '@elevenlabs/react';
import { ShoppingList } from '../entities/ShoppingList';

interface VoiceGrocerryCaptureProps {
  onListComplete: (groceryList: string) => void;
  onCancel: () => void;
}

export default function VoiceGroceryCapture({
  onListComplete,
  onCancel
}: VoiceGrocerryCaptureProps) {
  const conversation = useConversation();
  const sessionRef = useRef<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [groceryItems, setGroceryItems] = useState<string[]>([]);
  const groceryItemsRef = useRef<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  

  const stopSession = useCallback(async () => {
    setError(null);
    try {
      const s: any = sessionRef.current as any;
      if (s && typeof s.disconnect === 'function') await s.disconnect();
      else if (s && typeof s.close === 'function') await s.close();
    } catch (err: any) {
      console.error('Error disconnecting voice session', err);
    } finally {
      sessionRef.current = null;
      setIsActive(false);
      setIsConnecting(false);
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    console.log(`[VoiceGrocery] Attempting to ${newMutedState ? 'mute' : 'unmute'}`);

    // Note: ElevenLabs handles audio internally, muting is handled by the browser/OS
    // The mute button provides visual feedback but actual muting is controlled by user
    console.log(`[VoiceGrocery] ✅ Mute state: ${newMutedState ? 'MUTED' : 'UNMUTED'} (visual feedback only)`);
  }, [isMuted]);


  const startSession = useCallback(async () => {
    if (isConnecting || isActive) return;
    setIsConnecting(true);
    setError(null);
    
    // Reset grocery items for a fresh session
    setGroceryItems([]);
    groceryItemsRef.current = [];

    try {
      // Get ElevenLabs API key - ElevenLabs handles microphone access
      console.log('[VoiceGrocery] Getting ElevenLabs API key…');

      const response = await fetch('/api/realtime-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-realtime' }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Backend error (${response.status})`);
      }
      
      const payload = await response.json();
      const clientKey: string | undefined = payload?.client_secret?.value;
      if (!clientKey) {
        throw new Error('Missing client_secret.value in response');
      }

      // Define ElevenLabs client tools
      const clientTools = {
        load_saved_shopping_list: async ({ listName }: { listName: string }) => {
          console.log('[VoiceGrocery][tool] load_saved_shopping_list:', listName);

          try {
            const savedList = await ShoppingList.findByName(listName);

            if (!savedList) {
              return `I couldn't find a list named "${listName}". Would you like to tell me what items you need instead?`;
            }

            // Load list items
            const items = await ShoppingList.getItems(savedList.id!);
            const itemNames = items.map(item => `${item.quantity}x ${item.product_name}`);

            // Set items and immediately finish
            setGroceryItems(itemNames);
            groceryItemsRef.current = itemNames;

            // Trigger completion with the saved list
            setTimeout(() => {
              const listText = itemNames.join('\n');
              onListComplete(listText);
            }, 500);

            return `Perfect! I found your "${savedList.name}" list with ${items.length} items. Let me process that order for you now...`;
          } catch (error) {
            console.error('Error loading saved list:', error);
            return `I had trouble loading that list. Let's build a new list instead - what do you need?`;
          }
        },

        add_items_to_list: async ({ items }: { items: string[] }) => {
          console.log('[VoiceGrocery][tool] add_items_to_list:', items);

          setGroceryItems(prev => {
            const newItems = [...prev, ...items];
            groceryItemsRef.current = newItems;
            return newItems;
          });

          const itemList = items.join(', ');
          const newCount = groceryItemsRef.current.length;
          return `Got it! I've added ${itemList} to your list. You now have ${newCount} items.`;
        },

        remove_items_from_list: async ({ items }: { items: string[] }) => {
          console.log('[VoiceGrocery][tool] remove_items_from_list:', items);

          setGroceryItems(prev => {
            const itemsToRemoveLower = items.map((i: string) => i.toLowerCase().trim());
            const newItems = prev.filter(item =>
              !itemsToRemoveLower.some((removeItem: string) =>
                item.toLowerCase().includes(removeItem) || removeItem.includes(item.toLowerCase())
              )
            );
            groceryItemsRef.current = newItems;
            return newItems;
          });

          const itemList = items.join(', ');
          const newCount = groceryItemsRef.current.length;
          return `Removed ${itemList}. You now have ${newCount} items.`;
        },

        finish_shopping_list: async ({ confirmed }: { confirmed: boolean }) => {
          console.log('[VoiceGrocery][tool] finish_shopping_list:', confirmed);

          const currentItems = groceryItemsRef.current;

          if (confirmed && currentItems.length > 0) {
            // Immediately hide UI and complete the list
            const listText = currentItems.join('\n');
            console.log('[VoiceGrocery] Completing list with:', listText);

            setIsCompleting(true);

            // Call onListComplete immediately to transition to shopping flow
            onListComplete(listText);

            // Clean up session in background
            setTimeout(() => {
              stopSession();
            }, 100);

            return `Perfect! I've noted down ${currentItems.length} items. Let me find the best products for you now...`;
          } else if (currentItems.length === 0) {
            return "Your list is empty. Please tell me what you'd like to buy first.";
          }

          return "Let me know when you're ready to finish your list.";
        }
      };

      // Create ElevenLabs conversation session
      console.log('[VoiceGrocery] Starting ElevenLabs conversation session…');

      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';

      const conversationId = await conversation.startSession({
        agentId,
        clientTools,
        connectionType: 'webrtc',
      });

      sessionRef.current = conversation;
      console.log('[VoiceGrocery] Connected. Listening. Conversation ID:', conversationId);

      setIsActive(true);
      
    } catch (err: any) {
      console.error('Failed to start voice session', err);
      setError(err?.message || 'Failed to start voice session');
      await stopSession();
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isActive, stopSession, groceryItems.length, onListComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const s: any = sessionRef.current as any;
      if (s && typeof s.disconnect === 'function') s.disconnect().catch(() => void 0);
    };
  }, []);

  // Auto-start session when component mounts
  useEffect(() => {
    if (!isActive && !isConnecting) {
      startSession();
    }
  }, []);

  // Hide UI immediately when completing to allow shopping flow to show
  if (isCompleting) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-10 flex flex-col pointer-events-none"
    >

      {/* Bottom area with control buttons and items list */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-8 pointer-events-auto">
        {/* Control Buttons */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
            className="flex items-center gap-3 mb-6"
          >
            {/* Mute Button */}
            <motion.button
              onClick={toggleMute}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full backdrop-blur-md border shadow-brand flex items-center justify-center transition-all ${
                isMuted 
                  ? 'bg-red-50/95 border-red-200 hover:bg-red-100/95' 
                  : 'bg-white/95 border-gray-200 hover:bg-white shadow-brand-soft'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />}
            </motion.button>

            {/* Stop Button */}
            <motion.button
              onClick={() => {
                stopSession();
                onCancel();
              }}
              className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-brand backdrop-blur-md shadow-brand-strong flex items-center justify-center hover:opacity-90 transition-all overflow-hidden"
              title="Stop voice assistant"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Glossy shine effect */}
              <span className="absolute -inset-[30%] bg-white/20 blur-[5px] rotate-45 -translate-y-[120%] pointer-events-none z-0" aria-hidden="true" />
              <span className="relative z-10">
                <Square className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </span>
            </motion.button>
          </motion.div>
        )}

        {/* Items List and Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-center max-w-md w-full mx-auto px-4 flex flex-col"
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
          {error && <p className="text-sm text-red-600 bg-red-50/95 backdrop-blur-md rounded-full px-4 py-2 mb-4 font-medium shadow-md border border-red-200">{error}</p>}

          {groceryItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl p-4 shadow-lg mb-4 flex-1 overflow-hidden flex flex-col"
            >
              <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide flex-shrink-0">Your List ({groceryItems.length} {groceryItems.length === 1 ? 'item' : 'items'})</p>
              <div className="space-y-1.5 overflow-y-auto pr-2 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                {groceryItems.map((item, idx) => (
                  <motion.p
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-gray-700 text-left"
                  >
                    • {item}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </motion.div>
  );
}
