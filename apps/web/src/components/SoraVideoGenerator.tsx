import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Video, Download, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface SoraVideoGeneratorProps {
  onBack: () => void;
}

const SoraVideoGenerator: React.FC<SoraVideoGeneratorProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingVideoId, setExistingVideoId] = useState('');

  const createVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('creating');

    try {
      console.log('[Sora] Creating video with prompt:', prompt);
      
      const response = await fetch('/api/sora-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          prompt,
          model: 'sora-2-pro',
          size: '1280x720',
          seconds: '8',
        }),
      });

      console.log('[Sora] Response status:', response.status);
      console.log('[Sora] Response headers:', response.headers);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[Sora] Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`);
      }

      const data = await response.json();
      console.log('[Sora] Response data:', data);

      if (!response.ok) {
        const errorMsg = data.error || data.details || 'Failed to create video';
        throw new Error(errorMsg);
      }

      setVideoId(data.id);
      setStatus(data.status);
      setProgress(data.progress || 0);

      // Start polling for status
      pollVideoStatus(data.id);
    } catch (err: any) {
      console.error('[Sora] Error:', err);
      setError(err.message || 'An unexpected error occurred');
      setStatus('failed');
      setIsLoading(false);
    }
  };

  const pollVideoStatus = async (id: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/sora-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'status',
            videoId: id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check status');
        }

        setStatus(data.status);
        setProgress(data.progress || 0);

        if (data.status === 'completed') {
          clearInterval(pollInterval);
          setIsLoading(false);
          // Video is ready, user can download it
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
          setIsLoading(false);
          setError('Video generation failed');
        }
      } catch (err: any) {
        clearInterval(pollInterval);
        setError(err.message);
        setIsLoading(false);
      }
    }, 5000); // Poll every 5 seconds
  };

  const downloadVideo = async (vidId?: string) => {
    const targetVideoId = vidId || videoId;
    if (!targetVideoId) return;

    try {
      console.log('[Sora] Downloading video:', targetVideoId);
      setError(null);
      
      const response = await fetch('/api/sora-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'download',
          videoId: targetVideoId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download video');
      }

      // Get the video as an ArrayBuffer (preserves binary data perfectly)
      const arrayBuffer = await response.arrayBuffer();
      console.log('[Sora] Downloaded video size:', (arrayBuffer.byteLength / 1024 / 1024).toFixed(2), 'MB');
      
      // Create a blob with explicit video/mp4 type (no compression)
      const blob = new Blob([arrayBuffer], { type: 'video/mp4' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a friendly filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `buyfaster-video-${timestamp}.mp4`;
      
      console.log('[Sora] Saving as:', filename);
      
      // Create a temporary link and click it to download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('[Sora] Download complete!');
    } catch (err: any) {
      console.error('[Sora] Download error:', err);
      setError(err.message);
    }
  };

  const handleExistingVideoDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingVideoId.trim()) {
      downloadVideo(existingVideoId.trim());
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to generate';
      case 'creating':
        return 'Creating video job...';
      case 'queued':
        return 'Queued for processing...';
      case 'in_progress':
        return `Processing... ${progress}%`;
      case 'completed':
        return 'Video ready!';
      case 'failed':
        return 'Generation failed';
      default:
        return status;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'in_progress':
      case 'queued':
        return 'text-cyan-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-2xl hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-light text-gray-900">
            Sora Video Generator
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8"
        >
          {/* Re-Download Existing Video Section */}
          <div className="mb-6 p-4 rounded-2xl bg-cyan-50 border border-cyan-100">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              📥 Re-Download Existing Video
            </h3>
            <p className="text-xs text-gray-600 font-light mb-3">
              Already generated a video? Paste your video ID below to download with full quality (no compression).
            </p>
            <form onSubmit={handleExistingVideoDownload} className="flex gap-2">
              <input
                type="text"
                value={existingVideoId}
                onChange={(e) => setExistingVideoId(e.target.value)}
                placeholder="video_abc123..."
                className="flex-1 px-4 py-2 rounded-xl border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all text-sm font-mono"
              />
              <Button
                type="submit"
                disabled={!existingVideoId.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </form>
          </div>

          {/* Info */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <Video className="w-5 h-5 text-cyan-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">
                Generate New Video
              </h2>
            </div>
            <p className="text-sm text-gray-600 font-light">
              Create high-quality videos from text prompts. Be specific about shot type,
              subject, action, setting, and lighting for best results.
            </p>
          </div>

          {/* Prompt Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Wide shot of a child flying a red kite in a grassy park, golden hour sunlight, camera slowly pans upward."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all resize-none font-light"
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* Status Display */}
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />}
              </div>

              {/* Progress Bar */}
              {(status === 'in_progress' || status === 'queued') && (
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-cyan-600 rounded-full"
                  />
                </div>
              )}

              {/* Video ID */}
              {videoId && (
                <div className="mt-2 text-xs text-gray-500 font-mono">
                  ID: {videoId}
                </div>
              )}
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100"
            >
              <p className="text-sm font-medium text-red-600 mb-2">{error}</p>
              {error.includes('API key') && (
                <div className="text-xs text-red-500 mt-2 space-y-1">
                  <p>Please check:</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>OPENAI_API_KEY is set in your environment variables</li>
                    <li>Your OpenAI account has access to Sora API</li>
                    <li>You've restarted the development server after adding the key</li>
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {status !== 'completed' ? (
              <Button
                onClick={createVideo}
                disabled={isLoading || !prompt.trim()}
                className="flex-1 py-6 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-light tracking-wide shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => downloadVideo()}
                className="flex-1 py-6 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-light tracking-wide shadow-lg hover:shadow-xl transition-all"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Video
              </Button>
            )}
          </div>

          {/* Settings Info */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-light">
              <strong>Settings:</strong> Model: Sora 2 Pro · Resolution: 1280x720 · Duration: 8 seconds
            </p>
            <p className="text-xs text-gray-400 font-light mt-1">
              Video generation may take several minutes depending on API load.
            </p>
          </div>
        </motion.div>

        {/* Example Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-white rounded-3xl shadow-lg border border-gray-100 p-6"
        >
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Example Prompts
          </h3>
          <div className="space-y-2">
            {[
              'Close-up of a steaming coffee cup on a wooden table, morning light through blinds, soft depth of field.',
              'Wide tracking shot of a teal coupe driving through a desert highway, heat ripples visible, hard sun overhead.',
              'Aerial view of ocean waves crashing on rocky shores, golden hour lighting, slow motion.',
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => !isLoading && setPrompt(example)}
                className="w-full text-left px-4 py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 text-sm text-gray-700 font-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {example}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SoraVideoGenerator;

