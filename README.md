# BuyFaster (Monorepo)

AI-powered smart grocery shopping app. Snap a photo of your shopping list, get OCR-parsed items with live product search, voice assistant integration, and one-click checkout. Monorepo managed with Turborepo.

## Features

- **OCR Grocery Scanning** -- Photograph handwritten or printed shopping lists; Mistral OCR extracts items automatically
- **Smart Product Search** -- Serper-powered search returns real product results from Carrefour.fr with Gemini-generated summaries
- **Voice Assistant** -- ElevenLabs conversational AI for hands-free grocery list building
- **Payments** -- Stripe integration for checkout with saved payment methods
- **Order History** -- Supabase-backed order tracking with email confirmations
- **Auth** -- Google OAuth via Supabase Auth

## Monorepo Structure

```
apps/
  web/          # Vite + React + TypeScript (deployed to Vercel)
  mobile/       # Expo / React Native (WIP)
packages/
  shared/       # Shared entities, utilities, and search logic
```

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example apps/web/.env
# Then fill in your keys in apps/web/.env

# Run the web app
npm run dev:web
```

## Environment Variables

See [`.env.example`](.env.example) for all required variables. You will need accounts/keys for:

- [Supabase](https://supabase.com) -- auth and database
- [Stripe](https://stripe.com) -- payments
- [Mistral AI](https://mistral.ai) -- OCR
- [Google Gemini](https://ai.google.dev) -- product summaries
- [Serper](https://serper.dev) -- Google Shopping search
- [ElevenLabs](https://elevenlabs.io) -- voice assistant
- [OpenAI](https://openai.com) -- Sora video generation (optional)
- Gmail App Password -- order confirmation emails

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Vercel Serverless Functions
- **Database/Auth:** Supabase
- **AI:** Mistral (OCR), Gemini (summaries), ElevenLabs (voice)
- **Payments:** Stripe

## License

[MIT](LICENSE)
