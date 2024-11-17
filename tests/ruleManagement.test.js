// Mock Chrome APIs and NotificationManager
global.chrome = {
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
        },
    },
};

const NotificationManager = {
    showSuccess: jest.fn(),
};

// Import RuleManager
const RuleManager = require('./ruleManagement').RuleManager;

describe('Rule Management Tests', () => {
    let rules;

    beforeEach(() => {
        jest.clearAllMocks();
        rules = [
            { id: 1, sender: 'test@example.com', labelId: 'label1', createdAt: '2024-01-01T00:00:00Z' },
            { id: 2, sender: 'info@example.com', labelId: 'label2', createdAt: '2024-01-02T00:00:00Z' },
        ];

        // Mock initial storage content
        chrome.storage.local.get.mockImplementation((key, callback) => {
            callback({ rules });
        });

        chrome.storage.local.set.mockImplementation((data, callback) => {
            rules = data.rules;
            if (callback) callback();
        });
    });

    test('loadRules() should load rules from storage', async () => {
        const loadedRules = await RuleManager.loadRules();
        expect(loadedRules).toEqual(rules);
        expect(chrome.storage.local.get).toHaveBeenCalledWith('rules', expect.any(Function));
    });

    test('saveRules() should save rules to storage', async () => {
        await RuleManager.addRule({ sender: 'new@example.com', labelId: 'label3' });
        expect(chrome.storage.local.set).toHaveBeenCalledWith(
            { rules: expect.any(Array) },
            expect.any(Function)
        );
    });

    test('addRule() should add a new rule and save it', async () => {
        const newRule = { sender: 'new@example.com', labelId: 'label3' };
        await RuleManager.addRule(newRule);

        const updatedRules = await RuleManager.loadRules();
        expect(updatedRules).toHaveLength(3);
        expect(updatedRules[2]).toMatchObject({
            sender: 'new@example.com',
            labelId: 'label3',
        });
        expect(NotificationManager.showSuccess).toHaveBeenCalledWith('Rule added successfully');
    });

    test('deleteRule() should delete the specified rule and save changes', async () => {
        const ruleIdToDelete = 1;
        await RuleManager.deleteRule(ruleIdToDelete);

        const updatedRules = await RuleManager.loadRules();
        expect(updatedRules).toHaveLength(1);
        expect(updatedRules.find(rule => rule.id === ruleIdToDelete)).toBeUndefined();
        expect(NotificationManager.showSuccess).toHaveBeenCalledWith('Rule deleted successfully');
    });

    test('updateRule() should update the specified rule and save changes', async () => {
        const ruleIdToUpdate = 1;
        const updates = { labelId: 'updatedLabel' };

        await RuleManager.updateRule(ruleIdToUpdate, updates);

        const updatedRules = await RuleManager.loadRules();
        const updatedRule = updatedRules.find(rule => rule.id === ruleIdToUpdate);
        expect(updatedRule).toMatchObject({
            id: ruleIdToUpdate,
            labelId: 'updatedLabel',
        });
        expect(NotificationManager.showSuccess).toHaveBeenCalledWith('Rule updated successfully');
    });

    test('getRules() should return the current list of rules', () => {
        const currentRules = RuleManager.getRules();
        expect(currentRules).toEqual(rules);
    });

    test('addRule() should generate a unique ID and creation timestamp', async () => {
        const newRule = { sender: 'unique@example.com', labelId: 'uniqueLabel' };
        await RuleManager.addRule(newRule);

        const updatedRules = await RuleManager.loadRules();
        const addedRule = updatedRules.find(rule => rule.sender === 'unique@example.com');

        expect(addedRule).toHaveProperty('id');
        expect(addedRule).toHaveProperty('createdAt');
    });
});

