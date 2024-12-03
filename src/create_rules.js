document.getElementById('saveRule').addEventListener('click', () => {
  const sender = document.getElementById('sender').value;
  const label = document.getElementById('label').value;

  if (sender && label) {
    chrome.storage.sync.get('rules', (data) => {
      const rules = data.rules || [];
      rules.push({ sender, label });
      chrome.storage.sync.set({ rules }, () => {
        alert('Rule saved!');
        window.location.href = 'run_rules.html'; // Redirect to run_rules.html after saving
      });
    });
  } else {
    alert('Please fill in all fields.');
  }
});

document.getElementById('backToRunRules').addEventListener('click', () => {
  window.location.href = 'run_rules.html';
});
