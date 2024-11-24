// UI Manager Module
const UIManager = (() => {
    // Initialize UI elements and event listeners
    function initialize() {
        setupRuleForm();
        setupRulesList();
        setupProcessButton();
        setupRefreshButton();
    }

    // Setup the rule creation form
    function setupRuleForm() {
        const form = document.getElementById('rule-form');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const data = new FormData(form);
            const rule = {
                sender: data.get('sender'),
                subject: data.get('subject'),
                labelId: data.get('labelId'),
                labelName: data.get('labelName'),
                senderMatch: data.get('senderMatch') === 'on',
                subjectMatch: data.get('subjectMatch') === 'on',
            };

            try {
                await RuleManager.addRule(rule);
                NotificationManager.showSuccess('Rule added successfully');
            } catch (error) {
                NotificationManager.showError('Failed to add rule');
            }
        });
    }

    // Setup the rules list display
    function setupRulesList() {
        updateRulesList();
        
        // Setup event delegation for rule actions
        const rulesList = document.getElementById('rules-list');
        if (rulesList) {
            rulesList.addEventListener('click', async (e) => {
                if (e.target.classList.contains('delete-rule')) {
                    const ruleId = parseInt(e.target.dataset.ruleId);
                    await RuleManager.deleteRule(ruleId);
                    updateRulesList();
                }
            });
        }
    }

    // Update the displayed rules list
    async function updateRulesList() {
        const rules = await RuleManager.getRules();
        const rulesList = document.getElementById('rules-list');
        rulesList.innerHTML = '';

        rules.forEach((rule) => {
            const ruleItem = document.createElement('div');
            ruleItem.textContent = `${rule.sender} - ${rule.subject}`;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-rule';
            deleteButton.addEventListener('click', async () => {
                try {
                    await RuleManager.deleteRule(rule.id);
                    NotificationManager.showSuccess('Rule deleted successfully');
                    await this.updateRulesList();
                } catch (error) {
                    NotificationManager.showError('Failed to delete rule');
                }
            });
            ruleItem.appendChild(deleteButton);
            rulesList.appendChild(ruleItem);
        });
    }

    // Setup the process emails button
    function setupProcessButton() {
        const processButton = document.getElementById('process-emails');
        if (processButton) {
            processButton.addEventListener('click', async () => {
                try {
                    const emails = await GmailAPIHandler.loadEmails(); // Retrieve emails to process
                    await RuleProcessor.processEmails(emails); // Process emails with RuleProcessor
                } catch (error) {
                    NotificationManager.showError('Failed to process emails');
                }
            });
        }
    }

    // Setup the refresh rules button
    function setupRefreshButton() {
        const refreshButton = document.getElementById('refresh-rules');
        refreshButton.addEventListener('click', async () => {
            try {
                await RuleManager.loadRules();
                await this.updateRulesList();
            } catch (error) {
                NotificationManager.showError('Failed to refresh rules');
            }
        });
    }

    // Ensure DOM is fully loaded before adding event listeners
    document.addEventListener("DOMContentLoaded", () => {
            const addRuleButton = document.getElementById("add-rule");
            
            // Add click event listener to the "Add Rule" button
            if (addRuleButton) {
                addRuleButton.addEventListener("click", () => {
                    window.location.href = "ruleManagement.html";
                });
            }
        });


    document.addEventListener("DOMContentLoaded", () => {
        const addRuleButton = document.getElementById("add-rule");
        if (addRuleButton) {
            addRuleButton.addEventListener("click", () => {
                window.location.href = "ruleManagement.html";
            });
        }
    });
    

    // Public interface
    return {
        initialize,
        updateRulesList
    };
})();

// Initialize UI when popup loads
document.addEventListener('DOMContentLoaded', UIManager.initialize);

// export default UIManager; // Add this line for ES Modules
