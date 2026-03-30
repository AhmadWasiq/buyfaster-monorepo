import { VercelRequest, VercelResponse } from '@vercel/node';
import FormData from 'form-data';
import axios from 'axios';

// Sora Video API response types
interface SoraVideo {
  id: string;
  object: string;
  created_at: number;
  status: string;
  model: string;
  progress?: number;
  seconds?: string;
  size?: string;
  error?: {
    message: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY in your environment variables'
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const { action, videoId, prompt, model = 'sora-2-pro', size = '1280x720', seconds = '8' } = req.body;

    console.log('[Sora API] Request:', { action, videoId, prompt: prompt?.substring(0, 50), model, size, seconds });

    if (action === 'create') {
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ error: 'Prompt is required and must be a non-empty string' });
      }

      // Start video generation using direct REST API call
      console.log('[Sora API] Creating video with prompt:', prompt);
      
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('model', model);
      formData.append('prompt', prompt);
      formData.append('size', size);
      formData.append('seconds', seconds);
      
      try {
        const response = await axios.post<SoraVideo>(
          'https://api.openai.com/v1/videos',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              ...formData.getHeaders()
            }
          }
        );

        console.log('[Sora API] Video created:', response.data);
        return res.status(200).json(response.data);
      } catch (error: any) {
        console.error('[Sora API] Error creating video:', error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({
          error: error.response?.data?.error?.message || error.message || 'Failed to create video',
          details: error.response?.data
        });
      }
    }

    if (action === 'status' && videoId) {
      // Check video status
      console.log('[Sora API] Checking status for video:', videoId);
      
      try {
        const response = await axios.get<SoraVideo>(
          `https://api.openai.com/v1/videos/${videoId}`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            }
          }
        );

        return res.status(200).json(response.data);
      } catch (error: any) {
        console.error('[Sora API] Error getting video status:', error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({
          error: error.response?.data?.error?.message || error.message || 'Failed to get video status',
          details: error.response?.data
        });
      }
    }

    if (action === 'download' && videoId) {
      // Download video content
      console.log('[Sora API] Downloading video:', videoId);
      
      try {
        const response = await axios.get(
          `https://api.openai.com/v1/videos/${videoId}/content`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
            responseType: 'arraybuffer',
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            decompress: false // Prevent any automatic decompression
          }
        );

        const videoBuffer = Buffer.from(response.data);
        
        // Send the video file with headers to prevent compression
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="video-${videoId}.mp4"`);
        res.setHeader('Content-Length', videoBuffer.length.toString());
        res.setHeader('Cache-Control', 'no-transform'); // Prevent proxy compression
        res.setHeader('Accept-Ranges', 'bytes'); // Support range requests
        
        return res.status(200).send(videoBuffer);
      } catch (error: any) {
        console.error('[Sora API] Error downloading video:', error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({
          error: error.response?.data?.error?.message || error.message || 'Failed to download video',
          details: error.response?.data
        });
      }
    }

    return res.status(400).json({ error: 'Invalid action', validActions: ['create', 'status', 'download'] });
  } catch (error: any) {
    console.error('[Sora API] Error:', error);
    console.error('[Sora API] Error details:', {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code,
      response: error.response?.data
    });
    
    return res.status(error.status || 500).json({ 
      error: error.message || 'Failed to process video request',
      details: error.response?.data || error.toString(),
      type: error.type || 'unknown_error',
      code: error.code
    });
  }
}

