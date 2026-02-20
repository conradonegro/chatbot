class AnthropicAPI {
    static async getModels() {
        // Anthropic has no public models endpoint, return hardcoded whitelist of low consumption models only (for now)
        return [
            { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' }
        ];
    }

    static async generateResponse(userMessage, conversationHistory = [], model) {
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            console.error('Error: ANTHROPIC_API_KEY is not set');
            return 'Server configuration error: missing API key.';
        }

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
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

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Anthropic API error:', errorData);
                return 'Sorry, there was an error contacting the AI service.';
            }

            const responseData = await response.json();
            return responseData.content[0].text;

        } catch (error) {
            console.error('Network or fetch error:', error.message);
            return 'Sorry, I was unable to reach the AI service. Please try again.';
        }
    }
}

module.exports = { AnthropicAPI };