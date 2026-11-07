# NEXORA AI — Android + GitHub friendly PWA

A responsive, installable AI workspace with an iOS-inspired Liquid Glass interface.

## Included and working

- AI chat powered by Google Gemini API (server-side key; never exposed in browser code)
- Modes: general chat, study, coding, writing, translation, summarizing, brainstorming
- Multilingual responses: auto-detect or choose English, Nepali, Hindi, Spanish, French, Arabic, Japanese
- Image attachment and image questions (Gemini vision-capable model)
- Text/Markdown/CSV file content attachment
- Browser voice input (where supported) and text-to-speech
- Local chat history, new chats, copy answer, dark/light theme
- PWA manifest and service worker for installable app shell
- Mobile responsive layout

## Important limits

This is a working starter product, not a copy of ChatGPT. It does not include every proprietary ChatGPT capability. Live web browsing, generated images/videos, account sync, payments, team workspaces, and PDF parsing need additional APIs/services and are not falsely presented as working buttons. The PWA shell can open offline, but AI replies require internet and a configured API key.

## Run locally

1. Install Node.js 18 or newer on a computer or Android terminal environment that supports Node.
2. Copy `.env.example` to `.env`.
3. Get a Gemini API key from https://aistudio.google.com/app/apikey and put it in `.env`.
4. Run:

   ```bash
   npm install
   npm start
   ```

5. Open `http://localhost:3000`.

## Deploy from GitHub (recommended: Render)

1. Create a GitHub repository named `nexora-ai`.
2. Upload all files in this project. Keep `.env` out of GitHub.
3. In Render, create a **Web Service** and connect the repository.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables in Render:
   - `GEMINI_API_KEY` = your private Gemini API key
   - `GEMINI_MODEL` = `gemini-2.5-flash`
7. Deploy. Open the HTTPS URL on Android Chrome.
8. Chrome menu → **Install app** / **Add to Home screen**.

## Android-only GitHub workflow

You can upload/edit files using github.com in Chrome:
- Open your repository → Add file → Upload files.
- Upload the contents of this ZIP (not the ZIP itself if you want GitHub to show individual files).
- For a quick edit: open a file → pencil icon → edit → Commit changes.
- Deploy/redeploy through your hosting provider after commits.

## Security

- Never put the Gemini key in `public/app.js`, `index.html`, or any client-side file.
- Never commit `.env`.
- Add usage limits and authentication before making this public; otherwise strangers could consume your API quota.
- Check provider pricing, age requirements, and terms before enabling paid usage.
- Do not collect sensitive personal information unless you have a clear need and proper safeguards.

## Suggested next development phases

1. Add authentication, per-user server-side chat storage, rate limiting, and admin dashboard.
2. Add PDF extraction and secure file storage.
3. Add optional web search with citations.
4. Add image generation through a separate image API.
5. Add subscriptions only after usage costs, legal requirements, and billing provider support are understood.
