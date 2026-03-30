import { Mistral } from '@mistralai/mistralai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Mistral client with server-side API key
const getMistralClient = () => {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY environment variable is not set');
  }
  return new Mistral({ apiKey });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check content length for large payloads
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (contentLength > maxSize) {
      return res.status(413).json({ 
        error: 'Payload too large. Please compress image or use smaller image.',
        maxSize: '10MB'
      });
    }

    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Validate base64 image data
    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image data format' });
    }

    // Check image data size
    const imageSizeEstimate = (imageData.length * 3) / 4; // Rough base64 size estimate
    if (imageSizeEstimate > maxSize) {
      return res.status(413).json({ 
        error: 'Image too large. Please compress or resize before uploading.',
        maxSize: '10MB'
      });
    }

    const client = getMistralClient();

    // Process OCR with Mistral
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "image_url",
        imageUrl: imageData
      },
      includeImageBase64: false
    });

    // Extract text from the response
    const extractedText = ocrResponse.pages
      .map(page => page.markdown)
      .join('\n\n');

    return res.status(200).json({ 
      success: true, 
      text: extractedText 
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    
    // Don't expose internal error details to client
    return res.status(500).json({ 
      error: 'Failed to process image with OCR',
      success: false
    });
  }
}
