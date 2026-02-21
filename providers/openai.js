//for now we whitelist only the low consumption models
const LOW_CONSUMPTION_MODELS = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

class OpenAIAPI {

    static async getModels() {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        const data = await response.json();
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

        const endpoint = 'https://api.openai.com/v1/chat/completions';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: model,
                    max_tokens: 500,
                    messages: conversationHistory.concat([{ role: 'user', content: userMessage }]),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('OpenAI API error:', errorData);
                throw new Error('Failed to get response from API.');
            }

            const responseData = await response.json();

            if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message) {
                return responseData.choices[0].message.content;
            } else {
                console.error('Error: No valid response from OpenAI API');
                throw new Error('Failed to get response from API.');
            }

        } catch (error) {
            console.error('Network or fetch error:', error.message);
            throw new Error('Failed to get response from API.');
        }
    }
}

module.exports = { OpenAIAPI, OPENAI_MODELS: LOW_CONSUMPTION_MODELS.map(m => m.value) };