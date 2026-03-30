import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Returns ElevenLabs configuration for voice sessions
 * ElevenLabs handles authentication differently than OpenAI
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY not configured');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    // For ElevenLabs, we return the API key directly since client tools
    // are configured in the ElevenLabs dashboard and sessions are started client-side
    return res.status(200).json({
      client_secret: {
        value: apiKey
      }
    });

  } catch (error: any) {
    console.error('Error creating ElevenLabs session config:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error'
    });
  }
}
