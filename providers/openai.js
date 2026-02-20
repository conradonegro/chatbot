//for now we whitelist only the low consumption models
const LOW_CONSUMPTION_MODELS = [
    'gpt-4o-mini',
    'gpt-3.5-turbo',
];

class OpenAIAPI {

    static async getModels() {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        const data = await response.json();
        return data.data
            .filter(m => LOW_CONSUMPTION_MODELS.includes(m.id))
            .map(m => ({ value: m.id, label: m.id }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    static async generateResponse(userMessage, conversationHistory = [], model) {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            console.error('Error: OPENAI_API_KEY is not set');
            return 'Server configuration error: missing API key.';
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
                return 'Sorry, there was an error contacting the AI service.';
            }

            const responseData = await response.json();

            //console.log('Response from OpenAI API:', responseData.choices[0].message);

            if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message) {
                return responseData.choices[0].message.content;
            } else {
                console.error('Error: No valid response from OpenAI API');
                return "Sorry, I couldn't understand that.";
            }

        } catch (error) {
            console.error('Network or fetch error:', error.message);
            return 'Sorry, I was unable to reach the AI service. Please try again.';
        }
    }
}

module.exports = { OpenAIAPI };