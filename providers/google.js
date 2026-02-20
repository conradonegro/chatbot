const LOW_CONSUMPTION_MODELS = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3-flash-preview',
];

class GoogleAPI {
    static async getModels() {
        const apiKey = process.env.GOOGLE_API_KEY;
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();

        //console.log('Google models:', data.models.map(m => m.name));

        return data.models
            .filter(m => LOW_CONSUMPTION_MODELS.includes(m.name.replace('models/', '')))
            .map(m => ({
                value: m.name.replace('models/', ''),
                label: m.displayName
            }));
    }

    static async generateResponse(userMessage, conversationHistory = [], model) {
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            console.error('Error: GOOGLE_API_KEY is not set');
            return 'Server configuration error: missing API key.';
        }

        // Convert neutral history format to Google's format
        const contents = conversationHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
        contents.push({ role: 'user', parts: [{ text: userMessage }] });

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Google API error:', errorData);
                return 'Sorry, there was an error contacting the AI service.';
            }

            const responseData = await response.json();
            return responseData.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error('Network or fetch error:', error.message);
            return 'Sorry, I was unable to reach the AI service. Please try again.';
        }
    }
}

module.exports = { GoogleAPI };