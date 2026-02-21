// DOM element references
const chatLog = document.getElementById('chat-log');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const providerSelect = document.getElementById('provider-select');
const modelSelect = document.getElementById('model-select');

// Session Management
let sessionId = null;

/**
 * Displays an error message in the model select dropdown.
 * Replaces all options with a single "Error loading models" option.
 * @returns {void}
 */
const setModelError = () => { modelSelect.innerHTML = '<option>Error loading models</option>'; };

/**
 * Initializes a new chat session by requesting a session ID from the server.
 * - Sends a POST request to `/getSession`
 * - Sets the global `sessionId` on success
 * - Logs an error if the session initialization fails
 * @returns {Promise<void>}
 */
async function initSession() {
    try {
        const res = await fetch('/getSession', { method: 'POST' });
        const data = await res.json();
        if (!data.success) {
            console.error('Failed to initialize session:', data.error);
            return;
        }
        sessionId = data.data.sessionId;
    } catch (error) {
        console.error('Failed to initialize session:', error.message);
    }
}

/**
 * Loads available models for the selected AI provider and updates the model dropdown.
 * - Disables the model select and shows a loading message while fetching
 * - Populates the dropdown with fetched models on success
 * - Displays an error message in the dropdown if fetching fails
 * @returns {void}
 */
function onProviderChange() {
    modelSelect.disabled = true;
    modelSelect.innerHTML = '<option>Loading...</option>';

    fetch(`/getModels?provider=${providerSelect.value}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                setModelError();
                return;
            }
            modelSelect.innerHTML = '';
            data.data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.label;
                modelSelect.appendChild(option);
            });
        })
        .catch(err => {
            console.error('Error loading models:', err);
            setModelError();
        })
        .finally(() => {
            modelSelect.disabled = false;
        });
}

// EventListener to send message when pressing Enter
userInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') sendMessage();
});

/**
 * Initializes the chat interface on page load.
 * - Starts a new session by calling `initSession`
 * - Sets initial provider and model state via `onProviderChange`
 * @returns {Promise<void>}
 */
async function init() {
    await initSession();
    onProviderChange();
}

/**
 * Sends the user’s message to the chat interface and triggers the chatbot response.
 * - Reads and trims input
 * - Displays the user’s message in the chat
 * - Clears the input field
 * - Calls `getChatbotResponse` to fetch the AI reply
 * @returns {void}
 */
function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    displayMessage('user', message);
    userInput.value = '';
    getChatbotResponse(message);
}

/**
 * Toggles UI controls while waiting for a chatbot response.
 * Disables or enables input and send button, and updates button text
 * based on the loading state.
 * @param {boolean} isLoading - Whether a request is in progress.
 * @returns {void}
 */
function setLoading(isLoading) {
    sendButton.disabled = isLoading;
    sendButton.textContent = isLoading ? 'Sending...' : 'Send';
    userInput.disabled = isLoading;
}

/**
 * Renders a chat message in the UI.
 * Creates a message bubble, adds provider/model metadata for chatbot messages,
 * appends it to the chat log, and scrolls to the latest message.
 * @param {'user' | 'chatbot'} sender - Message sender type.
 * @param {string} message - Message text to display.
 * @returns {void}
 */
function displayMessage(sender, message) {
    //build new message bubble
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    const messageParagraph = document.createElement('p');
    messageParagraph.innerText = message;
    messageElement.appendChild(messageParagraph);

    //add provider & model metadata for chatbot messages
    if (sender === 'chatbot') {
        const meta = document.createElement('span');
        meta.classList.add('message-meta');
        meta.innerText = `${providerSelect.options[providerSelect.selectedIndex].text} · ${modelSelect.options[modelSelect.selectedIndex].text}`;
        messageElement.appendChild(meta);
    }
    chatLog.appendChild(messageElement);

    chatLog.scrollTop = chatLog.scrollHeight;
}

/**
 * Sends the user message to the server and displays the chatbot response.
 * Includes provider, model, and session ID in the request.
 * Initiates an async fetch request and handles response and errors internally.
 * @param {string} userMessage - The user's message to send to the AI.
 * @returns {void}
 */
function getChatbotResponse(userMessage) {
    setLoading(true);

    fetch('/getChatbotResponse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage, provider: providerSelect.value, model: modelSelect.value, sessionId }),
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            displayMessage('chatbot', `Error: ${data.error}`);
            return;
        }
        sessionId = data.data.sessionId;
        displayMessage('chatbot', data.data.chatbotResponse);
    })
    .catch(error => {
        console.error('Error:', error);
        displayMessage('chatbot', 'Error: Unable to reach the server. Please try again.');
    })
    .finally(() => {
        setLoading(false);
    });
}

init();