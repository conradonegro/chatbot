const { fetchWithErrorHandling } = require('./utils');

//for now we whitelist only the low consumption models
const LOW_CONSUMPTION_MODELS = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

class OpenAIAPI {

    static async getModels() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('Error: OPENAI_API_KEY is not set');
            throw new Error('Missing API key.');
        }

        const response = await fetchWithErrorHandling('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await response;
        return data.data
            .filter(m => LOW_CONSUMPTION_MODELS.some(lm => lm.value === m.id))
            .map(m => LOW_CONSUMPTION_MODELS.find(lm => lm.value === m.id))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    static async generateResponse(userMessage, conversationHistory = [], model) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('Error: OPENAI_API_KEY is not set');
            throw new Error('Missing API key.');
        }

        const data = await fetchWithErrorHandling('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                max_completion_tokens: 500,
                messages: conversationHistory.concat([{ role: 'user', content: userMessage }]),
            }),
        });

        if (!data.choices?.[0]?.message) throw new Error('Failed to get response from API.');
        return data.choices[0].message.content;
    }
}

module.exports = { OpenAIAPI, OPENAI_MODELS: LOW_CONSUMPTION_MODELS.map(m => m.value) };