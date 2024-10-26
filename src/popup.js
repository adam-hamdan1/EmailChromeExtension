document.getElementById('ruleForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const sender = document.getElementById('sender').value;
    const label = document.getElementById('label').value;
  
    const newRule = { sender, label, action: 'label' };
  
    chrome.storage.local.get('rules', function(data) {
      const rules = data.rules || [];
      rules.push(newRule);
      chrome.storage.local.set({ rules });
      displayRules(rules);
    });
  });
  
  function displayRules(rules) {
    const rulesList = document.getElementById('rulesList');
    rulesList.innerHTML = '';
    rules.forEach(rule => {
      const li = document.createElement('li');
      li.textContent = `${rule.sender} -> ${rule.label}`;
      rulesList.appendChild(li);
    });
  }
  
  chrome.storage.local.get('rules', function(data) {
    displayRules(data.rules || []);
  });
  