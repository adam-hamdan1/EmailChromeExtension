document.addEventListener('DOMContentLoaded', () => {
  const rulesContainer = document.getElementById('rulesContainer');

  // Load rules from storage and display them with checkboxes
  chrome.storage.sync.get('rules', (data) => {
    const rules = data.rules || [];
    if (rules.length === 0) {
      rulesContainer.textContent = 'No rules available.';
    } else {
      rules.forEach((rule, index) => {
        const ruleDiv = document.createElement('div');
        ruleDiv.style.marginBottom = '10px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `rule-${index}`;
        checkbox.dataset.index = index;

        const label = document.createElement('label');
        label.htmlFor = `rule-${index}`;
        label.textContent = `Rule ${index + 1}: ${rule.sender} → ${rule.label}`;

        ruleDiv.appendChild(checkbox);
        ruleDiv.appendChild(label);
        rulesContainer.appendChild(ruleDiv);
      });
    }
  });
});

// Event listener for running selected rules
document.getElementById('runSelectedRules').addEventListener('click', async () => {
  alert("Trying to sort.");
  chrome.storage.sync.get('rules', async (data) => {
    const rules = data.rules || [];
    const selectedRules = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
      .map((checkbox) => rules[checkbox.dataset.index]);

    if (selectedRules.length > 0) {
      console.log("Selected Rules:", selectedRules);

      // Extract sender email and label name from selected rules
      const senderEmail = selectedRules[0].sender;
      const labelName = selectedRules[0].label;

      try {
        // Send sender email and label name to the backend server
        const response = await fetch('http://localhost:3000/run-python', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_email: senderEmail,
            label_name: labelName
          })
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Backend response:", result.output);
        alert("Script executed successfully. Check the console for output.");
      } catch (error) {
        console.error("Error running script:", error);
        alert("Error executing the script. Check the console for details.");
      }
    } else {
      alert('No rules selected.');
    }
  });
});



// Event listener for deleting selected rules
document.getElementById('deleteSelectedRules').addEventListener('click', () => {
  chrome.storage.sync.get('rules', (data) => {
    const rules = data.rules || [];
    const selectedIndexes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
      .map((checkbox) => parseInt(checkbox.dataset.index));

    if (selectedIndexes.length > 0) {
      const updatedRules = rules.filter((_, index) => !selectedIndexes.includes(index));
      chrome.storage.sync.set({ rules: updatedRules }, () => {
        alert('Selected rules deleted!');
        window.location.reload(); // Refresh the page to update the rules list
      });
    } else {
      alert('No rules selected.');
    }
  });
});

// Event listener for navigating to the Create Rules page
document.getElementById('createRules').addEventListener('click', () => {
  window.location.href = 'create_rules.html';
});
