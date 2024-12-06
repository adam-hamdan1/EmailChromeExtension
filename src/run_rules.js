// Wait for the DOM to fully load before executing
document.addEventListener('DOMContentLoaded', () => {
  const rulesContainer = document.getElementById('rulesContainer');

  // Load rules from Chrome storage and display them as checkboxes
  chrome.storage.sync.get('rules', (data) => {
    const rules = data.rules || [];

    if (rules.length === 0) {
      // Display message if no rules are found
      rulesContainer.textContent = 'No rules available.';
    } else {
      // Dynamically create and display rules
      rules.forEach((rule, index) => {
        const ruleDiv = document.createElement('div');
        ruleDiv.style.marginBottom = '10px';

        // Create a checkbox for each rule
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `rule-${index}`;
        checkbox.dataset.index = index;

        // Create a label describing the rule
        const label = document.createElement('label');
        label.htmlFor = `rule-${index}`;
        label.textContent = `Rule ${index + 1}: ${rule.sender} → ${rule.label}`;

        // Append the checkbox and label to the rule container
        ruleDiv.appendChild(checkbox);
        ruleDiv.appendChild(label);
        rulesContainer.appendChild(ruleDiv);
      });
    }
  });
});

// Event listener to run selected rules
document.getElementById('runSelectedRules').addEventListener('click', async () => {
  alert('Attempting to sort emails...');
  
  chrome.storage.sync.get('rules', async (data) => {
    const rules = data.rules || [];
    
    // Collect selected rules based on checkboxes
    const selectedRules = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
      .map((checkbox) => rules[checkbox.dataset.index]);

    if (selectedRules.length > 0) {
      console.log('Selected Rules:', selectedRules);

      // Extract data from the first selected rule
      const { sender: senderEmail, label: labelName } = selectedRules[0];

      try {
        // Send rule data to the backend server
        const response = await fetch('http://localhost:3000/run-python', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender_email: senderEmail, label_name: labelName })
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Backend response:', result.output);
        alert('Emails successfully sorted!');
      } catch (error) {
        console.error('Error running script:', error);
        alert('Unable to sort emails. Please try again.');
      }
    } else {
      alert('No rules selected. Please select at least one rule to run.');
    }
  });
});

// Event listener to delete selected rules
document.getElementById('deleteSelectedRules').addEventListener('click', () => {
  chrome.storage.sync.get('rules', (data) => {
    const rules = data.rules || [];
    
    // Collect the indexes of selected rules
    const selectedIndexes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
      .map((checkbox) => parseInt(checkbox.dataset.index));

    if (selectedIndexes.length > 0) {
      // Filter out the selected rules
      const updatedRules = rules.filter((_, index) => !selectedIndexes.includes(index));

      // Update the storage and refresh the page
      chrome.storage.sync.set({ rules: updatedRules }, () => {
        alert('Selected rules have been deleted!');
        window.location.reload();
      });
    } else {
      alert('No rules selected. Please select at least one rule to delete.');
    }
  });
});

// Event listener to navigate to the Create Rules page
document.getElementById('createRules').addEventListener('click', () => {
  window.location.href = 'create_rules.html';
});
