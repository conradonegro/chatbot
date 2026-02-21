/* IMPORTS */
require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const sanitizeHtml = require('sanitize-html');
const { OpenAIAPI, OPENAI_MODELS } = require('./providers/openai');
const { AnthropicAPI, ANTHROPIC_MODELS } = require('./providers/anthropic');
const { GoogleAPI, GOOGLE_MODELS } = require('./providers/google');
const { XAI_API, XAI_MODELS } = require('./providers/xai');

/* CONSTANTS */
const MAX_MESSAGE_LENGTH = 2000;
const PORT = process.env.PORT || 3000;
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* PROVIDERS */
const providers = {
    openai: OpenAIAPI,
    anthropic: AnthropicAPI,
    google: GoogleAPI,
    x: XAI_API,
};

/* DERIVED CONSTANTS */
const VALID_PROVIDERS = Object.keys(providers);
const VALID_MODELS = {
    openai: OPENAI_MODELS,
    anthropic: ANTHROPIC_MODELS,
    google: GOOGLE_MODELS,
    x: XAI_MODELS,
};

/* STATE */
const sessionHistories = new Map();

/* WEB APP SETUP */
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

/**
 * Sends a successful JSON response.
 * @param {import('express').Response} res
 * @param {*} data
 */
const ok = (res, data) => res.json({ success: true, data });

/**
 * Sends an error JSON response.
 * @param {import('express').Response} res
 * @param {number} status
 * @param {string} error
 */
const fail = (res, status, error) => res.status(status).json({ success: false, error });

/**
 * Creates a new chat session.
 * - Generates a unique session ID
 * - Initializes an empty message history for the session
 * @returns {string} sessionId - The newly created session identifier.
 */
function createSession() {
    const sessionId = crypto.randomUUID();
    sessionHistories.set(sessionId, []);
    return sessionId;
}

/**
 * Sanitizes user input before sending it to AI providers.
 * - Removes all HTML and script tags
 * - Trims leading and trailing whitespace
 * - Rejects non-string or empty input
 * - Enforces a maximum message length
 * 
 * @param {string} text - Raw user input to sanitize.
 * 
 * @returns {{ text: string } | { error: string }}
 * An object containing either:
 * - `text`: the sanitized message, or
 * - `error`: a validation error message.
 */
function sanitizeInput(text) {
    if (!text || typeof text !== 'string') return { error: 'Invalid message.' };
    
    const sanitized = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
    const trimmed = sanitized.trim();
    
    if (trimmed.length === 0) return { error: 'Message cannot be empty.' };
    if (trimmed.length > MAX_MESSAGE_LENGTH) return { error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters.` };
    return { text: trimmed };
}

// ROUTE /getSession: Initialize the session
app.post('/getSession', (req, res) => {
    try {
        const sessionId = createSession();
        ok(res, { sessionId });
    } catch (error) {
        console.error('Error creating session:', error.message);
        fail(res, 500, 'Failed to create session.');
    }
});

// ROUTE /: Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ROUTE /getChatbotResponse: Call API and get model's response
app.post('/getChatbotResponse', async (req, res) => {
    try {
        //get provider, model and sessionId from the client
        const { provider, model, sessionId } = req.body;

        //validate provider
        if (!provider || !VALID_PROVIDERS.includes(provider)) {
            return fail(res, 400, 'Invalid provider.');
        }

        //validate model
        if (!model || !VALID_MODELS[provider].includes(model)) {
            return fail(res, 400, 'Invalid model for selected provider.');
        }

        //validate sessionId and use it to get history
        if (!sessionId || typeof sessionId !== 'string' || !UUID_V4_REGEX.test(sessionId)) {
           return fail(res, 400, 'Invalid session ID.');
        }
        const history = sessionHistories.get(sessionId);
        if (!history) return fail(res, 400, 'Invalid session.');

        //sanitize userMessage from the client
        const userMessage = sanitizeInput(req.body.userMessage);
        if (userMessage.error) {
            return fail(res, 400, userMessage.error);
        }

        const api = providers[provider];
        const chatbotResponse = await api.generateResponse(userMessage.text, history, model);

        history.push({ role: 'user', content: userMessage.text });
        history.push({ role: 'assistant', content: chatbotResponse });

        ok(res, { chatbotResponse, sessionId });
    } catch (error) {
        console.error('Server error:', error.message);
        fail(res, 500, 'Sorry, the server encountered an error. Please try again.');
    }
});

// ROUTE /getModels: Get models from provider
app.get('/getModels', async (req, res) => {
    try {
        const provider = req.query.provider;
        if (!provider || !VALID_PROVIDERS.includes(provider)) {
            return fail(res, 400, 'Invalid provider.');
        }
        const api = providers[provider];
        const models = await api.getModels();
        ok(res, { models });
    } catch (error) {
        console.error('Error fetching models:', error.message);
        fail(res, 500, 'Failed to fetch models.');
    }
});

/* START SERVER */
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});