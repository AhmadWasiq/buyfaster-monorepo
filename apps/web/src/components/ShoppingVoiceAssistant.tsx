import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';
import { useConversation } from '@elevenlabs/react';
import { shoppingVoiceSync } from '../lib/voiceUISync';

interface ShoppingVoiceAssistantProps {
  products: any[];
  onRemoveItem: (originalItem: string) => Promise<{ success: boolean; message: string }>;
  onAddItem: (itemName: string) => Promise<void>;
  onChangeItem: (originalItem: string, newItemName: string) => Promise<{ success: boolean; message: string }>;
  onOpenAlternatives: (originalItem: string) => { success: boolean; message: string };
  onSelectFromAlternatives: (itemName: string, alternativeName: string) => Promise<{ success: boolean; message: string }>;
  onSelectAlternativeByPosition: (itemName: string, position: number) => Promise<{ success: boolean; message: string }>;
  onConfirmPurchase: () => void;
  onCloseAlternatives: () => void;
}

export default function ShoppingVoiceAssistant({
  products,
  onRemoveItem,
  onAddItem,
  onChangeItem,
  onOpenAlternatives,
  onSelectFromAlternatives,
  onSelectAlternativeByPosition,
  onConfirmPurchase,
  onCloseAlternatives
}: ShoppingVoiceAssistantProps) {
  const conversation = useConversation();
  const sessionRef = useRef<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const hasAutoStartedRef = useRef(false);
  const productsRef = useRef(products);
  const capturedStreamsRef = useRef<MediaStream[]>([]); // Store all captured streams

  const stopSession = useCallback(async () => {
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

      // Restore original getUserMedia
      if ((navigator.mediaDevices as any)._originalGetUserMedia) {
        navigator.mediaDevices.getUserMedia = (navigator.mediaDevices as any)._originalGetUserMedia;
        delete (navigator.mediaDevices as any)._originalGetUserMedia;
      }
      
    }
  }, []);

  const toggleMute = useCallback(async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    console.log(`[ShoppingVoice] Attempting to ${newMutedState ? 'mute' : 'unmute'}`);

    // Note: ElevenLabs handles audio internally, muting is handled by the browser/OS
    // The mute button provides visual feedback but actual muting is controlled by user
    console.log(`[ShoppingVoice] ✅ Mute state: ${newMutedState ? 'MUTED' : 'UNMUTED'} (visual feedback only)`);
  }, [isMuted]);

  const startSession = useCallback(async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);

    try {
      // Get ElevenLabs API key
      console.log('[ShoppingVoice] Getting ElevenLabs API key…');

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
        remove_item: async ({ itemName }: { itemName: string }) => {
          console.log('[ShoppingVoice][tool] remove_item:', itemName);
          console.log('[ShoppingVoice][tool] Current products from ref:', productsRef.current.map(p => p.originalItem || p.name));

          // Use sync manager to ensure UI updates before voice confirms
          const result = await shoppingVoiceSync.executeVoiceCommand(
            'remove_item',
            async () => {
              const result = await onRemoveItem(itemName);

              // Emit sync event
              shoppingVoiceSync.emit({
                type: 'ITEM_REMOVED',
                itemName: itemName,
                success: result.success
              });

              return result;
            },
            2000 // 2 second timeout
          );

          return result.message;
        },

        add_item: async ({ itemName }: { itemName: string }) => {
          console.log('[ShoppingVoice][tool] add_item:', itemName);

          // Use sync manager with longer timeout for search operations
          const result = await shoppingVoiceSync.executeVoiceCommand(
            'add_item',
            async () => {
              await onAddItem(itemName);

              const result = {
                success: true,
                message: `Added.`
              };

              // Emit sync event
              shoppingVoiceSync.emit({
                type: 'ITEM_ADDED',
                itemName: itemName,
                success: true
              });

              return result;
            },
            5000 // 5 second timeout for search
          );

          return result.message;
        },

        change_item: async ({ oldItemName, newItemName }: { oldItemName: string, newItemName: string }) => {
          console.log('[ShoppingVoice][tool] change_item:', oldItemName, '->', newItemName);

          // Use sync manager with longer timeout for search operations
          const result = await shoppingVoiceSync.executeVoiceCommand(
            'change_item',
            async () => {
              const result = await onChangeItem(oldItemName, newItemName);

              // Emit sync event
              shoppingVoiceSync.emit({
                type: 'ITEM_CHANGED',
                oldItem: oldItemName,
                newItem: newItemName,
                success: result.success
              });

              return result;
            },
            5000 // 5 second timeout for search
          );

          return result.message;
        },

        show_alternatives: async ({ itemName }: { itemName: string }) => {
          console.log('[ShoppingVoice][tool] show_alternatives:', itemName);

          // Use sync manager
          const result = await shoppingVoiceSync.executeVoiceCommand(
            'show_alternatives',
            async () => {
              const result = onOpenAlternatives(itemName);

              // Emit sync event
              shoppingVoiceSync.emit({
                type: 'ALTERNATIVES_SHOWN',
                itemName: itemName,
                success: result.success
              });

              return result;
            },
            2000
          );

          return result.message;
        },

        select_alternative: async ({ originalItem, alternativeName }: { originalItem: string, alternativeName: string }) => {
          console.log('[ShoppingVoice][tool] select_alternative:', originalItem, '->', alternativeName);

          // Use sync manager with longer timeout for search operations
          const result = await shoppingVoiceSync.executeVoiceCommand(
            'select_alternative',
            async () => {
              const result = await onSelectFromAlternatives(originalItem, alternativeName);

              if (result.success) {
                onCloseAlternatives();
              }

              // Emit sync event
              shoppingVoiceSync.emit({
                type: 'ALTERNATIVE_SELECTED',
                itemName: originalItem,
                alternativeName: alternativeName,
                success: result.success
              });

              return result;
            },
            5000 // 5 second timeout for search
          );

          return result.message;
        },

        select_alternative_by_position: async ({ originalItem, position }: { originalItem: string, position: number }) => {
          console.log('[ShoppingVoice][tool] select_alternative_by_position:', originalItem, 'position', position);

          // Use sync manager with longer timeout for search operations
          const result = await shoppingVoiceSync.executeVoiceCommand(
            'select_alternative_by_position',
            async () => {
              const result = await onSelectAlternativeByPosition(originalItem, position);

              if (result.success) {
                onCloseAlternatives();
              }

              // Emit sync event
              shoppingVoiceSync.emit({
                type: 'ALTERNATIVE_SELECTED',
                itemName: originalItem,
                alternativeName: `position ${position}`,
                success: result.success
              });

              return result;
            },
            5000 // 5 second timeout for search
          );

          return result.message;
        },

        confirm_purchase: async ({ confirmed }: { confirmed: boolean }) => {
          console.log('[ShoppingVoice][tool] confirm_purchase:', confirmed);

          if (!confirmed) {
            return `Please confirm to proceed with purchase.`;
          }

          // Use sync manager
          const result = await shoppingVoiceSync.executeVoiceCommand(
            'confirm_purchase',
            async () => {
              onConfirmPurchase();

              // Emit sync event
              shoppingVoiceSync.emit({
                type: 'PURCHASE_CONFIRMED',
                success: true
              });

              return {
                success: true,
                message: `Processing...`
              };
            },
            2000
          );

          return result.message;
        }
      };


      // Create ElevenLabs conversation session
      console.log('[ShoppingVoice] Starting ElevenLabs conversation session…');

      // Agent ID for shopping list page voice assistant
      const agentId = 'agent_8601k8h03gtffehr8981a7b7p2nz';

      const conversationId = await conversation.startSession({
        agentId,
        clientTools,
        connectionType: 'webrtc',
      });

      sessionRef.current = conversation;
      console.log('[ShoppingVoice] Connected. Listening. Conversation ID:', conversationId);
      console.log('[ShoppingVoice] Captured streams:', capturedStreamsRef.current.length);

      setIsActive(true);
      
    } catch (err: any) {
      console.error('Failed to start voice session', err);
      await stopSession();
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, stopSession, products, onRemoveItem, onAddItem, onChangeItem, onOpenAlternatives, onSelectFromAlternatives, onConfirmPurchase, onCloseAlternatives]);

  // Auto-start on mount
  useEffect(() => {
    if (!hasAutoStartedRef.current && !isActive && !isConnecting) {
      hasAutoStartedRef.current = true;
      startSession();
    }
  }, [isActive, isConnecting, startSession]);

  // Update products ref whenever products change (tools will read from this)
  useEffect(() => {
    productsRef.current = products;
    console.log('[ShoppingVoice] Products updated in ref:', products.map(p => p.originalItem || p.name));
  }, [products]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return (
    <div className="flex items-center gap-2">
      {/* Mute button (only show when active) */}
      {isActive && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={toggleMute}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-md flex items-center justify-center transition-all ${
            isMuted 
              ? 'bg-red-50 text-red-600 border border-red-200' 
              : 'bg-white text-cyan-600 border border-gray-200'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
        </motion.button>
      )}

      {/* Main voice button - Stop/Start */}
      <motion.button
        onClick={isActive ? stopSession : startSession}
        disabled={isConnecting}
        className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-brand-strong flex items-center justify-center transition-all bg-gradient-brand text-white hover:opacity-90 overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isActive ? 'Stop voice assistant' : 'Start voice assistant'}
      >
        {/* Glossy shine effect */}
        <span className="absolute -inset-[30%] bg-white/20 blur-[5px] rotate-45 -translate-y-[120%] pointer-events-none z-0" aria-hidden="true" />
        
        <span className="relative z-10">
          {isActive ? (
            <Square className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </span>
      </motion.button>
    </div>
  );
}

