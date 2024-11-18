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
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const rule = {
                sender: form.sender.value,
                subject: form.subject.value,
                labelId: form.labelId.value,
                labelName: form.labelName.value,
                senderMatch: form.senderMatch.checked,
                subjectMatch: form.subjectMatch.checked
            };

            try {
                await RuleManager.addRule(rule);
                form.reset();
                updateRulesList();
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
        const rulesList = document.getElementById('rules-list');
        if (!rulesList) return;

        const rules = await RuleManager.getRules();
        rulesList.innerHTML = rules.map(rule => `
            <div class="rule-item">
                <div class="rule-info">
                    <strong>Sender:</strong> ${rule.sender}<br>
                    <strong>Subject:</strong> ${rule.subject}<br>
                    <strong>Label:</strong> ${rule.labelName}
                </div>
                <button class="delete-rule" data-rule-id="${rule.id}">Delete</button>
            </div>
        `).join('');
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
        if (refreshButton) {
            refreshButton.addEventListener('click', async () => {
                await RuleManager.loadRules();
                updateRulesList();
            });
        }
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
