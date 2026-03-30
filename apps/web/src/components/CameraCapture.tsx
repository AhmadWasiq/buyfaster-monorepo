import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Check,
  X,
  Flashlight,
  FlashlightOff,
  SwitchCamera
} from 'lucide-react';
import { Button } from './ui/button';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [error, setError] = useState<string>('');

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setError('');

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);

        // Check if flash is available
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        setHasFlash('torch' in capabilities);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions.');
    }
  }, [facingMode]);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current || !hasFlash) return;

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{ torch: !flashOn } as any]
      });
      setFlashOn(!flashOn);
    } catch (err) {
      console.error('Error toggling flash:', err);
    }
  }, [flashOn, hasFlash]);

  // Switch camera
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Capture image
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Calculate optimal size to keep under 5MB
    const maxWidth = 1920;
    const maxHeight = 1080;
    let { videoWidth, videoHeight } = video;

    // Scale down if too large
    if (videoWidth > maxWidth || videoHeight > maxHeight) {
      const scale = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
      videoWidth *= scale;
      videoHeight *= scale;
    }

    // Set canvas size
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Draw video frame to canvas with compression
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

    // Convert to data URL with higher compression for large images
    const quality = videoWidth * videoHeight > 1920 * 1080 ? 0.6 : 0.8;
    const imageData = canvas.toDataURL('image/jpeg', quality);
    setCapturedImage(imageData);
  }, []);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage('');
  }, []);

  // Confirm capture
  const confirmCapture = useCallback(() => {
    onCapture(capturedImage);
  }, [capturedImage, onCapture]);

  // Start camera on mount
  useEffect(() => {
    startCamera();

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [facingMode, startCamera, isStreaming]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white w-12 h-12 sm:w-10 sm:h-10 rounded-xl">
          <X className="w-6 h-6 sm:w-5 sm:h-5" />
        </Button>
        <h2 className="text-base sm:text-lg font-light text-white tracking-wide">Camera</h2>
        <div className="w-12 sm:w-10" />
      </div>

      <div className="flex-1 relative">
        {/* Camera preview */}
        <div className="absolute inset-0 bg-black">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full px-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-3xl flex items-center justify-center mb-6">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-light text-white mb-2 tracking-wide">Camera Error</h3>
              <p className="text-gray-300 text-center font-light mb-6">{error}</p>
              <Button onClick={startCamera} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Try Again
              </Button>
            </div>
          ) : !capturedImage ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
          ) : (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
          )}
        </div>

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera controls */}
        {!error && (
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              {!capturedImage ? (
                <>
                  {/* Switch camera button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={switchCamera}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 shadow-brand-soft"
                  >
                    <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>

                  {/* Capture button */}
                  <Button
                    onClick={captureImage}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-brand-strong border-4 border-white"
                    disabled={!isStreaming}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-900 rounded-full" />
                    </div>
                  </Button>

                  {/* Flash toggle button */}
                  {hasFlash && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFlash}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 shadow-brand-soft"
                    >
                      {flashOn ? (
                        <Flashlight className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <FlashlightOff className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {/* Retake button */}
                  <Button
                    onClick={retakePhoto}
                    variant="ghost"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
                  >
                    <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>

                  {/* Confirm button */}
                  <Button
                    onClick={confirmCapture}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-green-500 hover:bg-green-600"
                  >
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Instructions overlay */}
        {!error && !capturedImage && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-64 h-64 border-2 border-white/30 rounded-full opacity-50" />
          </div>
        )}
      </div>
    </div>
  );
};
