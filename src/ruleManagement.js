// Rule Management Module
const RuleManager = (() => {
    let rules = [];

    // Load rules from storage
    async function loadRules() {
        return new Promise((resolve) => {
            chrome.storage.local.get('rules', (result) => {
                rules = result.rules || [];
                resolve(rules);
            });
        });
    }

    // Save rules to storage
    async function saveRules() {
        return new Promise((resolve) => {
            chrome.storage.local.set({ rules: rules }, () => {
                resolve();
            });
        });
    }

    // Add new rule
    async function addRule(rule) {
        rules.push({
            id: Date.now(),
            ...rule,
            createdAt: new Date().toISOString()
        });
        await saveRules();
        NotificationManager.showSuccess('Rule added successfully');
    }

    // Delete rule
    async function deleteRule(ruleId) {
        rules = rules.filter(rule => rule.id !== ruleId);
        await saveRules();
        NotificationManager.showSuccess('Rule deleted successfully');
    }

    // Update existing rule
    async function updateRule(ruleId, updates) {
        const index = rules.findIndex(rule => rule.id === ruleId);
        if (index !== -1) {
            rules[index] = { ...rules[index], ...updates };
            await saveRules();
            NotificationManager.showSuccess('Rule updated successfully');
        }
    }

    // Get all rules
    function getRules() {
        return rules;
    }

    // Initialize
    loadRules();

    // Public interface
    return {
        loadRules,
        addRule,
        deleteRule,
        updateRule,
        getRules
    };
})();