import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  MoreHorizontal,
  User,
  Upload,
  List,
  History,
  ExternalLink,
  // Video, // Kept for future use (Sora)
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { Button } from "./components/ui/button";
import { useNavigate, BrowserRouter, Routes, Route } from "react-router-dom";
// import { createPageUrl } from "./utils"; // We use local definition below
import { OCRProcessor } from "./components/OCRProcessor";
import { OCRShoppingFlow } from "./components/OCRShoppingFlow";
import { CameraCapture } from "./components/CameraCapture";
import SavedListsPage from "./components/SavedListsPage";
import PaymentSuccessPage from "./components/PaymentSuccessPage";
import PaymentFailurePage from "./components/PaymentFailurePage";
import ReorderPaymentPage from "./components/ReorderPaymentPage";
import UserProfile from "./components/UserProfile";
import TestEmailPage from "./components/TestEmailPage";
import OrderHistoryPage from "./components/OrderHistoryPage";
import MockOrderHistoryPage from "./components/MockOrderHistoryPage";
import { Auth } from "./lib/auth";
import AuthWrapper from "./components/AuthWrapper";
import VoiceGroceryCapture from "./components/VoiceGroceryCapture";
import { Orb, AgentState } from "./components/ui/orb";
// import SoraVideoGenerator from "./components/SoraVideoGenerator"; // Kept for future use
// import NumberedListPage from "./components/NumberedListPage"; // Kept for future use

// --- UTILITY FUNCTIONS ---
// Note: With BrowserRouter, we use the path directly
const createPageUrl = (path: string) => `/${path}`;

// Expose auth for console access (development)
(window as any).Auth = Auth;
console.log('🔐 Real Authentication System Loaded - Google OAuth enabled');

// WaveformAnimation component removed - now using VoiceAgentButton with built-in visualization

// =======================================================================
// --- COMPONENT: CameraOptions ---
// =======================================================================
// Displays the subtle dropdown for camera and upload options.
const CameraOptions = ({
  isOpen,
  onClose,
  onStartOCR,
  onStartCameraOCR
}: {
  isOpen: boolean;
  onClose: () => void;
  onStartOCR: (file: File) => void;
  onStartCameraOCR: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onStartOCR(file);
      onClose();
    }
  };

  const handleCameraOCR = () => {
    onStartCameraOCR();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6, rotateX: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6, rotateX: -4, transition: { duration: 0.25, ease: "easeOut" } }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 40,
              mass: 0.9,
              duration: 0.35
            }}
            className="absolute top-14 sm:top-16 right-0 bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 z-50 min-w-40 sm:min-w-48"
          >
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                delay: 0.08,
                type: "spring",
                stiffness: 600,
                damping: 35,
                mass: 0.7,
                duration: 0.3
              }}
            >
              <Button
                onClick={handleCameraOCR}
                variant="ghost"
                className="w-full px-3 py-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 flex items-center !justify-start transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] touch-manipulation"
              >
                <Camera className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <span className="font-light tracking-wide text-gray-700 ml-3">Use Camera</span>
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                delay: 0.12,
                type: "spring",
                stiffness: 600,
                damping: 35,
                mass: 0.7,
                duration: 0.3
              }}
            >
              <Button
                onClick={handleFileUpload}
                variant="ghost"
                className="w-full px-3 py-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 flex items-center !justify-start transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] touch-manipulation"
              >
                <Upload className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <span className="font-light tracking-wide text-gray-700 ml-3">Upload List</span>
              </Button>
            </motion.div>
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
const MainMenu = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const menuItems = [
    { icon: User, label: "User Profile", path: "Profile" },
    { icon: List, label: "Saved Lists", subtitle: "Quick reorder", path: "CustomList" },
    { icon: History, label: "History", path: "History" },
    // { icon: Video, label: "Sora Videos", subtitle: "AI video generation", path: "sora" }, // Kept for future use
    { icon: ExternalLink, label: "About Us", url: "https://www.buyfaster.fr" },
  ];

  const handleAction = (item: any) => {
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
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6, rotateX: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6, rotateX: -4, transition: { duration: 0.25, ease: "easeOut" } }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 40,
              mass: 0.9,
              duration: 0.35
            }}
            className="absolute top-14 sm:top-16 left-0 bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 z-50 min-w-48 sm:min-w-56"
          >
            {menuItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -8, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  delay: index * 0.06 + 0.08,
                  type: "spring",
                  stiffness: 550,
                  damping: 35,
                  mass: 0.8,
                  duration: 0.32
                }}
              >
                <Button
                  onClick={() => handleAction(item)}
                  variant="ghost"
                  className="w-full px-3 py-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 h-auto flex items-start justify-start transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] group touch-manipulation"
                >
                  <motion.div
                    whileHover={{ rotate: 3 }}
                    whileTap={{ rotate: 3, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                      duration: 0.2
                    }}
                  >
                    <item.icon className="w-5 h-5 text-gray-600 flex-shrink-0 mt-1 group-hover:text-gray-800 group-active:text-gray-900 transition-colors" />
                  </motion.div>
                  <div className="text-left ml-3 flex-1">
                    <div className="font-light tracking-wide text-gray-700 group-hover:text-gray-900 group-active:text-gray-950 transition-colors">{item.label}</div>
                    {item.subtitle && <div className="text-xs text-gray-500 font-light mt-1 group-hover:text-gray-600 group-active:text-gray-700 transition-colors">{item.subtitle}</div>}
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






// OrderItem component removed - now using dedicated OrderHistoryPage component

// =======================================================================
// --- PAGE: Home ---
// =======================================================================
const HomePage = () => {
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [currentView, setCurrentView] = useState<string>("home");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [voiceGroceryText, setVoiceGroceryText] = useState("");
  
  // Voice state
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceCaptureComplete, setVoiceCaptureComplete] = useState(false);
  
  // Orb state
  const [agentState, setAgentState] = useState<AgentState>(null);
  const [audioVolume, setAudioVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Test Supabase connection on component mount
  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        const { error } = await supabase.from('test').select('*').limit(1);
        if (error) {
          console.log('Supabase connection test:', error.message);
          console.log('Using local test data instead of Supabase');
        } else {
          console.log('Supabase connected successfully');
        }
      } catch (err) {
        console.log('Supabase connection established, awaiting database setup');
        console.log('Using local test data for product search');
      }
    };

    testSupabaseConnection();
  }, []);

  // Audio monitoring for orb reactivity
  useEffect(() => {
    if (!voiceActive) {
      // Cleanup audio monitoring when voice is inactive
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAudioVolume(0);
      return;
    }

    // Start audio monitoring
    const startAudioMonitoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 256;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const updateVolume = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = Array.from(dataArray).reduce((a, b) => a + b, 0) / bufferLength;
            setAudioVolume(Math.min(average / 128, 1)); // Normalize to 0-1
          }
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        
        updateVolume();
      } catch (err) {
        console.error('Error accessing microphone for orb visualization:', err);
      }
    };

    startAudioMonitoring();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [voiceActive]);

  const startVoiceCapture = () => {
    setVoiceActive(true);
    setVoiceCaptureComplete(false);
    setAgentState("listening");
  };

  const handleVoiceListComplete = (groceryListText: string) => {
    console.log('[HomePage] Voice grocery list complete:', groceryListText);
    setVoiceGroceryText(groceryListText);
    setVoiceCaptureComplete(true);
    setCurrentView("voice-shopping");
  };

  const resetToHome = () => {
    setVoiceGroceryText("");
    setVoiceActive(false);
    setVoiceCaptureComplete(false);
    setCurrentView("home");
    setSelectedFile(null);
    setCapturedImageUrl(null);
    setAgentState(null);
  };
  
  const handleVoiceEnd = () => {
    setVoiceActive(false);
    setAgentState(null);
  };

  const handleStartOCR = (file: File) => {
    setSelectedFile(file);
    setCurrentView("ocr");
  };

  const handleStartCameraOCR = () => {
    setCurrentView("camera-capture");
  };

  const handleCaptureComplete = (imageUrl: string) => {
    setCapturedImageUrl(imageUrl);
    setCurrentView("ocr");
  };

  const handleOCRComplete = (text: string) => {
    // Handle the extracted text (you can save it, copy it, etc.)
    console.log("Extracted text:", text);
  };


  const handleOCRClose = () => {
    setCurrentView("home");
    setSelectedFile(null);
    setCapturedImageUrl(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50/30 to-white relative">
      {/* Voice Grocery Capture - integrated into main view */}
      {voiceActive && !voiceCaptureComplete && (
        <VoiceGroceryCapture
          onListComplete={handleVoiceListComplete}
          onCancel={handleVoiceEnd}
        />
      )}
      
      <AnimatePresence mode="wait">
        {currentView === "home" ? (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col relative">
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6">
              <div className="relative flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                    mass: 0.8,
                    duration: 0.15
                  }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMainMenu(true)}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg border border-black/20 flex items-center justify-center hover:bg-[#06B6D4]/5 hover:shadow-xl active:bg-[#06B6D4]/10 active:scale-95 transition-all duration-200 group touch-manipulation"
                  >
                    <motion.div
                      whileHover={{ rotate: 45 }}
                      whileTap={{ rotate: 45, scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                        duration: 0.2
                      }}
                    >
                      <MoreHorizontal className="w-6 h-6 sm:w-7 sm:h-7 text-black group-hover:text-gray-700 group-active:text-gray-800 transition-colors" />
                    </motion.div>
                  </Button>
                </motion.div>
                <MainMenu isOpen={showMainMenu} onClose={() => setShowMainMenu(false)} />
              </div>
              <div className="relative flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                    mass: 0.8,
                    duration: 0.15
                  }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCameraOptions(true)}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg border border-black/20 flex items-center justify-center hover:bg-[#06B6D4]/5 hover:shadow-xl active:bg-[#06B6D4]/10 active:scale-95 transition-all duration-200 group touch-manipulation"
                  >
                    <motion.div
                      whileHover={{ rotate: -8, scale: 1.05 }}
                      whileTap={{ rotate: -8, scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                        duration: 0.2
                      }}
                    >
                      <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-black group-hover:text-gray-700 group-active:text-gray-800 transition-colors" />
                    </motion.div>
                  </Button>
                </motion.div>
                <CameraOptions
                  isOpen={showCameraOptions}
                  onClose={() => setShowCameraOptions(false)}
                  onStartOCR={handleStartOCR}
                  onStartCameraOCR={handleStartCameraOCR}
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-8 sm:py-16">
              <div className="text-center mb-8 sm:mb-20">
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-600 text-base sm:text-lg font-light tracking-wide mb-2">Speak Your List</motion.p>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-gray-400 text-sm sm:text-base font-light">Get It Done</motion.p>
              </div>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ delay: 0.6, type: "spring" }} 
                className="relative mb-8 sm:mb-20"
              >
                {/* Pure Orb - ElevenLabs Style */}
                <motion.div
                  onClick={voiceActive ? undefined : startVoiceCapture}
                  className="relative w-32 h-32 sm:w-56 sm:h-56 rounded-full cursor-pointer z-10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={voiceActive ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                  transition={voiceActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {/* Glass container with subtle inset shadow - fixed sizing */}
                  <div className="absolute inset-0 rounded-full bg-gray-100/50 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]" style={{ isolation: 'isolate', contain: 'layout style paint' }}>
                     {/* Inner white background with inset shadow - fixed sizing */}
                     <div className="absolute inset-[4px] rounded-full bg-white shadow-[inset_0_0_12px_rgba(0,0,0,0.08)]">
                       {/* Pure Three.js Orb - fills the inner white container */}
                       <Orb
                         key="orb-main"
                         colors={["#0C7A8D", "#FFFFFF"]}
                         agentState={agentState}
                         volumeMode={agentState ? "auto" : "manual"}
                         manualInput={audioVolume}
                         manualOutput={audioVolume}
                         seed={12345}
                         className="absolute inset-0 rounded-full"
                       />
                     </div>
                  </div>
                </motion.div>
              </motion.div>
              <AnimatePresence>
                {!voiceActive && (
                  <motion.div
                    key="instruction-text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{
                      delay: 0.8,
                      exit: { duration: 0.3, ease: "easeOut" }
                    }}
                    className="text-center"
                  >
                    <p className="text-gray-400 text-xs sm:text-sm font-light tracking-wide">
                      Tap to start voice shopping or use camera
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : currentView === "camera-capture" ? (
          <CameraCapture onCapture={handleCaptureComplete} onClose={handleOCRClose} />
        ) : currentView === "ocr" ? (
          <OCRProcessor
            imageFile={selectedFile || undefined}
            imageUrl={capturedImageUrl || undefined}
            onClose={handleOCRClose}
            onProcessComplete={handleOCRComplete}
            onBackToHome={() => setCurrentView("home")}
          />
        ) : currentView === "voice-shopping" ? (
          <OCRShoppingFlow
            extractedText={voiceGroceryText}
            onBack={resetToHome}
            onComplete={resetToHome}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

// HistoryPage component removed - now using dedicated OrderHistoryPage component

// =======================================================================
// --- PAGE: Profile ---
// =======================================================================
const ProfilePage = () => {
  const navigate = useNavigate();
  return <UserProfile onBack={() => navigate(createPageUrl("Home"))} />;
};

// =======================================================================
// --- LAYOUT AND ROUTER SETUP ---
// =======================================================================
const AppLayout = ({ children }: { children: React.ReactNode }) => (
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
        <AuthWrapper requireAuth={true}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/Home" element={<HomePage />} />
            <Route path="/History" element={<OrderHistoryPage />} />
            <Route path="/mock-history" element={<MockOrderHistoryPage />} />
            <Route path="/Profile" element={<ProfilePage />} />
            <Route path="/CustomList" element={<SavedListsPage />} />
            <Route path="/test-email" element={<TestEmailPage />} />
            <Route path="/reorder-payment" element={<ReorderPaymentPage />} />
            <Route path="/payment-success" element={
              <PaymentSuccessPage onContinueShopping={() => window.location.href = '/'} />
            } />
            <Route path="/payment-failure" element={
              <PaymentFailurePage
                onRetry={() => window.location.href = '/'}
                onContinueShopping={() => window.location.href = '/'}
              />
            } />
            {/* <Route path="/sora" element={<SoraVideoGenerator onBack={() => window.location.href = '/'} />} /> */}
            {/* Sora route kept for future use - uncomment when needed */}
          </Routes>
        </AuthWrapper>
      </AppLayout>
    </BrowserRouter>
  );
}