//html elements to use
const chatLog = document.getElementById('chat-log');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const providerSelect = document.getElementById('provider-select');
const modelSelect = document.getElementById('model-select');

//conversation history stored in a neutral format
//{role: 'user' | 'assistant', content: string}
let conversationHistory = [];

//load models of selected provider
function onProviderChange() {
    const provider = providerSelect.value;
    modelSelect.disabled = true;
    modelSelect.innerHTML = '<option>Loading...</option>';

    fetch(`/getModels?provider=${provider}`)
        .then(res => res.json())
        .then(data => {
            modelSelect.innerHTML = '';
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.label;
                modelSelect.appendChild(option);
            });
        })
        .catch(err => {
            console.error('Error loading models:', err);
            modelSelect.innerHTML = '<option>Error loading models</option>';
        })
        .finally(() => {
            modelSelect.disabled = false;
        });
}

//init model list
onProviderChange();

//send message when pressing Enter
userInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') sendMessage();
});

//displays message and gets chatbot response
function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    displayMessage('user', message);
    userInput.value = '';
    getChatbotResponse(message);
}

//disable/enable controls while waiting for response or not
function setLoading(isLoading) {
    sendButton.disabled = isLoading;
    sendButton.textContent = isLoading ? 'Sending...' : 'Send';
    userInput.disabled = isLoading;
}

//displays messages in the chat
function displayMessage(sender, message) {
    //message elements
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    const messageParagraph = document.createElement('p');
    messageParagraph.innerText = message;

    //append new message elements
    messageElement.appendChild(messageParagraph);
    //add provider & model metadata only for chatbot messages
    if (sender === 'chatbot') {
        const meta = document.createElement('span');
        meta.classList.add('message-meta');
        meta.innerText = `${providerSelect.options[providerSelect.selectedIndex].text} · ${modelSelect.options[modelSelect.selectedIndex].text}`;
        messageElement.appendChild(meta);
    }
    chatLog.appendChild(messageElement);

    //auto-scroll to latest message
    chatLog.scrollTop = chatLog.scrollHeight;
}

//gets response from the AI provider's model
function getChatbotResponse(userMessage) {
    setLoading(true);

    //add user message to history
    conversationHistory.push({ role: 'user', content: userMessage });

    const provider = providerSelect.value;
    const model = modelSelect.value;

    fetch('/getChatbotResponse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage, provider, model, conversationHistory }),
    })
    .then(response => response.json())
    .then(data => {
        displayMessage('chatbot', data.chatbotResponse);
        //add AI response to history
        conversationHistory.push({ role: 'assistant', content: data.chatbotResponse });
    })
    .catch(error => {
        console.error('Error:', error);
        displayMessage('chatbot', 'Sorry, something went wrong. Please try again.');
    })
    .finally(() => {
        setLoading(false);
    });
}