// Add event listener for the "Save Rule" button
document.getElementById('saveRule').addEventListener('click', () => {
  // Get the input values for sender and label
  const senderInput = document.getElementById('sender').value.trim(); // Trim whitespace
  const labelInput = document.getElementById('label').value.trim(); // Trim whitespace

  // Validate that both fields are filled
  if (senderInput && labelInput) {
    // Retrieve existing rules from Chrome's storage
    chrome.storage.sync.get('rules', (storageData) => {
      const existingRules = storageData.rules || []; // Default to an empty array if no rules exist

      // Add the new rule to the existing rules array
      existingRules.push({ sender: senderInput, label: labelInput });

      // Save the updated rules back to Chrome's storage
      chrome.storage.sync.set({ rules: existingRules }, () => {
        // Provide user feedback
        alert('Rule saved successfully!');

        // Redirect to the "Run Rules" page
        window.location.href = 'run_rules.html';
      });
    });
  } else {
    // Show an error message if either field is empty
    alert('Error: Both "Sender" and "Label" fields must be filled out.');
  }
});

// Add event listener for the "Back to Run Rules" button
document.getElementById('backToRunRules').addEventListener('click', () => {
  // Redirect to the "Run Rules" page
  window.location.href = 'run_rules.html';
});
