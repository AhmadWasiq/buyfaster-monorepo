import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: description }] }],
          systemInstruction: {
            parts: [{
              text: "Résume la description de ce produit en français, sans mentionner son nom ni entrer dans les détails des ingrédients, du prix, de la livraison ou de la disponibilité. Concentre-toi uniquement sur ce qu'est le produit et ses caractéristiques principales. Le résumé doit être clair, naturel et d'une longueur moyenne — ni trop court ni trop long."
            }]
          }
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return res.status(response.status).json({ error: 'Summarization failed' });
    }

    const data = await response.json();
    const summary = data.candidates[0].content.parts[0].text;

    res.status(200).json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

