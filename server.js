require('dotenv').config();

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; //TODO remove this, only for dev
const express = require('express');
const path = require('path');
const { OpenAIAPI } = require('./providers/openai');
const { AnthropicAPI } = require('./providers/anthropic');
const { GoogleAPI } = require('./providers/google');
const { XAI_API } = require('./providers/xai');

const providers = {
    openai: OpenAIAPI,
    anthropic: AnthropicAPI,
    google: GoogleAPI,
    x: XAI_API,
};

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/getChatbotResponse', async (req, res) => {
    try {
        const { userMessage, provider, model, conversationHistory } = req.body;
        const api = providers[provider];

        if (!api) return res.status(400).json({ error: 'Unknown provider' });

        const chatbotResponse = await api.generateResponse(userMessage, conversationHistory, model);
        res.json({ chatbotResponse });
    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).json({ chatbotResponse: 'Sorry, the server encountered an error. Please try again.' });
    }
});

app.get('/getModels', async (req, res) => {
    const provider = req.query.provider;
    const api = providers[provider];

    if (!api) return res.status(400).json({ error: 'Unknown provider' });

    try {
        const models = await api.getModels();
        res.json({ models });
    } catch (error) {
        console.error('Error fetching models:', error.message);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});