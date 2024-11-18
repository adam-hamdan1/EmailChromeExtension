// Authenticator function to authorize tokens
async function authenticate() {
  console.log("Attempting to get auth token...");
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
          console.error("Authentication error:", chrome.runtime.lastError.message);
          return; // Early exit on error
      }

      console.log("Token retrieved successfully:", token);
      saveToken(token); // Ensure saveToken is implemented properly
  });
}

// Save token in chrome.storage
function saveToken(token) {
  console.log("Saving token:", token);
  // Store the token in chrome.storage instead of localStorage
  chrome.storage.local.set({ authToken: token }, () => {
      console.log("Token saved in storage.");
  });
}

// Get token from chrome.storage
function getToken(callback) {
  chrome.storage.local.get('authToken', (result) => {
      callback(result.authToken);
  });
}

// Refresh token if necessary
function refreshToken() {
  getToken((oauthToken) => {
      if (oauthToken) {
          chrome.identity.removeCachedAuthToken({ token: oauthToken }, () => {
              authenticate(); // Re-authenticate to get a new token
          });
      } else {
          console.error("No token found to refresh.");
      }
  });
}

// Fetch emails from Gmail API
async function fetchEmails() {
  getToken(async (accessToken) => {
      if (!accessToken) {
          console.error("No access token available.");
          return;
      }
      try {
          const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages", {
              headers: { Authorization: `Bearer ${accessToken}` }
          });
          const emails = await response.json();
          processEmails(emails.messages); // Process emails with the Rule Processor
      } catch (error) {
          console.error("Error fetching emails:", error);
          notifyUser("Error fetching emails. Please check your internet connection.");
      }
  });
}

// Process each email based on rules
function processEmails(emails) {
  if (!emails || emails.length === 0) {
      console.log("No emails to process.");
      return;
  }
  emails.forEach(email => {
      getEmailMetadata(email.id).then((metadata) => {
          loadRules((rules) => {
              rules.forEach(rule => applyRule(metadata, rule));
          });
      });
  });
}

// Fetch metadata for an email
async function getEmailMetadata(emailId) {
  return new Promise((resolve) => {
      getToken(async (accessToken) => {
          const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}`, {
              headers: { Authorization: `Bearer ${accessToken}` }
          });
          const metadata = await response.json();
          resolve(metadata);
      });
  });
}

// Apply a rule to an email if conditions match
function applyRule(emailMetadata, rule) {
  if (emailMetadata.payload.headers) {
      const sender = emailMetadata.payload.headers.find(header => header.name === "From")?.value;
      if (sender === rule.sender) {
          labelEmail(emailMetadata.id, rule.labelId);
      }
  }
}

// Apply label to an email
async function labelEmail(emailId, labelId) {
  getToken(async (accessToken) => {
      if (!accessToken) {
          console.error("No access token available.");
          return;
      }
      try {
          await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`, {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({ addLabelIds: [labelId] })
          });
          notifyUser(`Label applied to email ${emailId}`);
      } catch (error) {
          console.error("Error applying label:", error);
      }
  });
}

// Load sorting rules from storage
function loadRules(callback) {
  chrome.storage.local.get('rules', (data) => {
      callback(data.rules || []);
  });
}

// Store a new rule in storage
function saveRule(rule) {
  loadRules((rules) => {
      rules.push(rule);
      chrome.storage.local.set({ rules: rules });
  });
}

// Handle incoming messages for real-time actions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addRule') {
      saveRule(request.rule); // Add rule
  } else if (request.action === 'fetchEmails') {
      fetchEmails(); // Fetch and sort emails
  } else if (request.action === 'refreshToken') {
      refreshToken(); // Refresh OAuth token
  }
  sendResponse({ status: 'done' });
});

// Notify user about actions taken
function notifyUser(message) {
  chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Email Sorted',
      message: message
  });
}

// Initialize on install or update
chrome.runtime.onInstalled.addListener(() => {
  authenticate(); // Authenticate user on installation
  loadRules(() => console.log("Rules loaded."));
});

// export default ServiceWorker; // Add this line for ES Modules
