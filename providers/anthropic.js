const { fetchWithErrorHandling } = require('./utils');

//for now we whitelist only the low consumption models
const LOW_CONSUMPTION_MODELS = [
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
];

class AnthropicAPI {
    static async getModels() {
        // Anthropic has no public models endpoint, return hardcoded whitelist of low consumption models only (for now)
        return LOW_CONSUMPTION_MODELS;
    }

    static async generateResponse(userMessage, conversationHistory = [], model) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            console.error('Error: ANTHROPIC_API_KEY is not set');
            throw new Error('Missing API key.');
        }

        const response = await fetchWithErrorHandling('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 500,
                messages: conversationHistory.concat([{ role: 'user', content: userMessage }]),
            }),
        });

        if (!response.content?.[0]?.text) throw new Error('Failed to get response from API.');
        return response.content[0].text;
    }
}

module.exports = { AnthropicAPI, ANTHROPIC_MODELS: LOW_CONSUMPTION_MODELS.map(m => m.value) };