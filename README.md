# Chatbot

A web-based chatbot that lets you switch between AI providers and models mid-conversation, while maintaining a shared conversation context throughout.

## Features

- **Multi-provider support** — Connect to OpenAI, Anthropic, Google, or X (Grok) from a single interface
- **Model selection** — Choose from available low-consumption models for each provider
- **Shared conversation history** — Switch provider or model at any point without losing context
- **Per-message attribution** — Each response shows which provider and model generated it
- **Clean chat UI** — User and chatbot messages displayed as bubbles on opposite sides of the chat window

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **AI Providers:** OpenAI, Anthropic, Google Gemini, X (Grok)

## Project Structure

```
chatbot/
├── providers/
│   ├── openai.js
│   ├── anthropic.js
│   ├── google.js
│   └── xai.js
├── public/
│   ├── index.html
│   ├── main.js
│   ├── style.css
│   └── chat.png
├── server.js
├── package.json
└── .env
```

## Getting Started

### Prerequisites

- Node.js v18 or higher
- API keys for the providers you want to use

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/chatbot.git
cd chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root:
```
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
XAI_API_KEY=your-xai-key
```
You don't need keys for all providers — only the ones you intend to use.

4. Start the server:
```bash
node server.js
```

5. Open your browser and go to `http://localhost:3000`

## Supported Models

| Provider  | Models |
|-----------|--------|
| OpenAI    | GPT-4o Mini, GPT-3.5 Turbo |
| Anthropic | Claude Haiku 4.5 |
| Google    | Gemini 2.0 Flash, Gemini 2.0 Flash Lite, Gemini 2.5 Flash, Gemini 2.5 Flash Lite |
| X (Grok)  | Grok 2 Mini |

## Notes

- Only low-consumption models are available by default to keep API costs minimal during development
- Conversation history is preserved when switching providers or models, but each provider may interpret context slightly differently
- API keys are never exposed to the frontend — all provider communication happens server-side
