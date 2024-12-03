// Gmail API Handler Module
const GmailAPIHandler = (() => {
    let oauthToken = null;

    // Authenticate and retrieve OAuth token
    async function authenticate() {
        console.log("Attempting to get auth token...");
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
                console.error("Authentication error:", chrome.runtime.lastError.message);
                return; // Early exit on error
            }
            if (token) {
                console.log("Authentication successful, token:", token);
                // Continue with authenticated requests
            } else {
                console.error("No token received.");
            }
        });
    }


    // Refresh OAuth token if expired
    async function refreshToken() {
        return new Promise((resolve) => {
            chrome.identity.removeCachedAuthToken({ token: oauthToken }, () => {
                authenticate().then(resolve);
            });
        });
    }

    // Retrieve emails from Gmail inbox
    async function fetchEmails() {
        return await apiRequest("https://www.googleapis.com/gmail/v1/users/me/messages");
    }

    // Fetch metadata for a specific email
    async function getEmailMetadata(emailId) {
        return await apiRequest(`https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}`);
    }

    // Apply label to an email
    async function applyLabel(emailId, labelId) {
        return await apiRequest(`https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`, "POST", {
            addLabelIds: [labelId]
        });
    }

    // General function to make authenticated Gmail API requests
    async function apiRequest(url, method = "GET", body = null) {
        return new Promise((resolve, reject) => {
            getToken((accessToken) => {
                fetch(url, {
                    method: method,
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: body ? JSON.stringify(body) : null
                })
                .then(async response => {
                    if (response.status === 401) { // Token might be expired
                        await refreshToken();
                        return apiRequest(url, method, body);
                    }
                    const data = await response.json();
                    resolve(data);
                })
                .catch(error => {
                    console.error("Gmail API request error:", error);
                    reject(error);
                });
            });
        });
    }

    // Retrieve stored access token
    function getToken(callback) {
        if (oauthToken) {
            callback(oauthToken);
        } else {
            chrome.storage.local.get('accessToken', (result) => {
                oauthToken = result.accessToken;
                callback(oauthToken);
            });
        }
    }

    return {
        authenticate,
        refreshToken,
        fetchEmails,
        getEmailMetadata,
        applyLabel
    };
})();

