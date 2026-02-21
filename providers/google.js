const { fetchWithErrorHandling } = require('./utils');

//for now we whitelist only the low consumption models
const LOW_CONSUMPTION_MODELS = [
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview' },
];

class GoogleAPI {
    static async getModels() {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error('Error: GOOGLE_API_KEY is not set');
            throw new Error('Missing API key.');
        }
        const response = await fetchWithErrorHandling(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        return response.models
            .filter(m => LOW_CONSUMPTION_MODELS.some(lm => lm.value === m.name.replace('models/', '')))
            .map(m => LOW_CONSUMPTION_MODELS.find(lm => lm.value === m.name.replace('models/', '')));
    }

    static async generateResponse(userMessage, conversationHistory = [], model) {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error('Error: GOOGLE_API_KEY is not set');
            throw new Error('Missing API key.');
        }

        // Convert neutral history format to Google's format
        const contents = conversationHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
        contents.push({ role: 'user', parts: [{ text: userMessage }] });

        const response = await fetchWithErrorHandling(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents }),
            }
        );

        if (!response.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Failed to get response from API.');
        return response.candidates[0].content.parts[0].text;
    }
}

module.exports = { GoogleAPI, GOOGLE_MODELS: LOW_CONSUMPTION_MODELS.map(m => m.value) };