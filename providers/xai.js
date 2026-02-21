const LOW_CONSUMPTION_MODELS = [
    { value: 'grok-3-mini', label: 'Grok 2 Mini' },
    { value: 'grok-4-fast-non-reasoning', label: 'Grok 4 Fast Non-Reasoning' },
    { value: 'grok-4-1-fast-non-reasoning', label: 'Grok 4.1 Fast Non-Reasoning' },
];

class XAI_API {
    static async getModels() {
        // XAI has no public models endpoint, return hardcoded whitelist of low consumption models only (for now)
        return LOW_CONSUMPTION_MODELS;
    }

    static async generateResponse(userMessage, conversationHistory = [], model) {
        const apiKey = process.env.XAI_API_KEY;

        if (!apiKey) {
            console.error('Error: XAI_API_KEY is not set');
            throw new Error('Missing API key.');
        }

        try {
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 500,
                    messages: conversationHistory.concat([{ role: 'user', content: userMessage }]),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('X AI API error:', errorData);
            throw new Error('Failed to get response from API.');
            }

            const responseData = await response.json();
            return responseData.choices[0].message.content;

        } catch (error) {
            console.error('Network or fetch error:', error.message);
            throw new Error('Failed to get response from API.');
        }
    }
}

module.exports = { XAI_API, XAI_MODELS: LOW_CONSUMPTION_MODELS.map(m => m.value) };