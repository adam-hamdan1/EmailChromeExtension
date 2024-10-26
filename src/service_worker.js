// The authenticator function, defines function for how to authorize the tokens
async function authenticate() {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        saveToken(token);
      }
    });
  }
  
  function saveToken(token) {
    chrome.storage.local.set({ accessToken: token });
  }
  
  function getToken(callback) {
    chrome.storage.local.get('accessToken', function(result) {
      callback(result.accessToken);
    });
  }
  
  //Gmail API handler   
  async function fetchEmails() {
    getToken(async (accessToken) => {
      const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const emails = await response.json();
      // Process emails or pass them to the Rule Processor
    });
  }
  
  function applyRule(emailMetadata, rule) {
    if (emailMetadata.sender === rule.sender) {
      labelEmail(emailMetadata.id, rule.labelId);
    }
  }
  // Rule processing logic   
  async function labelEmail(emailId, labelId) {
    getToken(async (accessToken) => {
      await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ addLabelIds: [labelId] })
      });
    });
  }
//   Handles real time actions
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'addRule') {
      // Handle adding the rule, possibly storing it in chrome.storage
    } else if (request.action === 'fetchEmails') {
      fetchEmails();
    }
    sendResponse({ status: 'done' });
  });
  
//   Notifies the user
  function notifyUser(message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Email Sorted',
      message: message
    });
  }
  
