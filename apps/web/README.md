# BuyFaster - Voice Shopping App with OCR

A modern React + TypeScript shopping app with voice recognition and OCR text extraction capabilities.

## Features

- **Voice Shopping**: Speak to add items to your cart
- **OCR Text Extraction**: Extract text from images using AI
- **Camera Integration**: Capture images directly from camera
- **File Upload**: Upload images for text extraction
- **Modern UI**: Beautiful, responsive design with animations
- **Secure Architecture**: Client-side UI with secure server-side API processing

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   - Create a `.env` file in the root directory
   - Add your API keys:
     ```
     # Supabase Configuration (Client-side)
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     
     # Mistral AI OCR (Server-side - Secure)
     MISTRAL_API_KEY=your_mistral_api_key
     
     # Gemini API for Product Summarization (Server-side - Secure)
     GEMINI_API_KEY=your_gemini_api_key
     ```
   - Get your Mistral AI API key from [https://console.mistral.ai/](https://console.mistral.ai/)
   - Get your Gemini API key from [https://aistudio.google.com/](https://aistudio.google.com/)
   - Get your Supabase keys from your [Supabase Dashboard](https://supabase.com/dashboard)

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Architecture

### Security Model
- **Frontend**: Uses Supabase anon key with Row Level Security (RLS) for user data
- **Backend**: Secure API routes (`/api/ocr`) handle sensitive operations with server-side API keys
- **OCR Processing**: Mistral AI integration runs securely on the server

### Technologies
- React 19 + TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Framer Motion for animations
- Supabase for database and authentication
- Mistral AI for OCR text extraction
- Vercel for deployment

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
