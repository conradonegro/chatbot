/**
 * Performs a fetch request with standardized error handling.
 * - Throws if the network request fails
 * - Throws if the response status is not ok
 * - Returns parsed JSON on success
 * @param {string} url - The URL to fetch.
 * @param {RequestInit} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<object>} Parsed JSON response.
 */
async function fetchWithErrorHandling(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `HTTP error: ${response.status}`);
    }
    return response.json();
}

module.exports = { fetchWithErrorHandling };